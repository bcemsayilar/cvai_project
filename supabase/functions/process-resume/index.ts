// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Groq } from "https://esm.sh/groq-sdk";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

interface ATSCriteria {
  keywordMatch: number;
  formatScore: number;
  contentQuality: number;
  readabilityScore: number;
  structureScore: number;
  overallScore: number;
  recommendations: string[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

/**
 * Calls the standalone ATS analyzer function
 */
async function callATSAnalyzer(resumeText: string, supabaseClient: any): Promise<ATSCriteria> {
  try {
    const { data, error } = await supabaseClient.functions.invoke("ats-analyzer", {
      body: {
        resumeText: resumeText.trim(),
      },
    });

    if (error) {
      console.error("ATS analyzer function error:", error);
      throw new Error(error.message || "ATS analysis failed");
    }

    if (!data.success || !data.analysis) {
      console.error("ATS analysis failed:", data.error);
      throw new Error(data.error || "Failed to analyze ATS score");
    }

    return data.analysis as ATSCriteria;
  } catch (error) {
    console.error("Error calling ATS analyzer:", error);
    throw new Error(`Failed to analyze ATS score: ${error.message}`);
  }
}
// Function to get Google Cloud access token using djwt library
async function getAccessToken() {
  const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY")?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google Cloud credentials');
  }
  try {
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    };
    // Import the private key
    const keyData = privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '');
    const binaryKey = Uint8Array.from(atob(keyData), (c)=>c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    }, false, [
      'sign'
    ]);
    // Create JWT using djwt
    const jwt = await create({
      alg: "RS256",
      typ: "JWT"
    }, payload, cryptoKey);
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} - ${errorData}`);
    }
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
// Extract text using Document AI REST API
async function extractTextFromDocument(fileBuffer, mimeType) {
  try {
    const projectId = Deno.env.get("GOOGLE_PROJECT_ID");
    const location = 'us';
    const processorId = Deno.env.get("GOOGLE_PROCESSOR_ID");
    if (!projectId || !processorId) {
      throw new Error('Missing Google Cloud configuration: PROJECT_ID or PROCESSOR_ID');
    }
    console.log(`Getting access token for Document AI...`);
    const accessToken = await getAccessToken();
    // Convert the file buffer to base64 - handle large files safely
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid stack overflow
    for (let i = 0; i < fileBuffer.length; i += chunkSize) {
      const chunk = fileBuffer.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    const content = btoa(binaryString);
    const requestBody = {
      rawDocument: {
        content,
        mimeType
      }
    };
    const url = `https://us-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
    console.log(`Calling Document AI API: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Document AI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Document AI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const result = await response.json();
    if (!result.document?.text) {
      throw new Error('No text extracted from document');
    }
    console.log(`Successfully extracted text from document, length: ${result.document.text.length}`);
    return result.document.text;
  } catch (error) {
    console.error('Error processing document with Document AI:', error);
    throw error;
  }
}
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    console.log("Starting process-resume function");
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
        global: {
        headers: {
          Authorization: req.headers.get("Authorization")
        }
      }
    });
    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
          status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("User authenticated:", user.id);
    // Parse request body
    const { resumeId, filePath, enhancementStyles, customInstructions, extractOnly, resumeFormat } = await req.json();
    if (!resumeId) {
      return new Response(JSON.stringify({
        error: "Resume ID is required"
      }), {
          status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Processing resume:", resumeId, "with styles:", enhancementStyles);
    console.log("Resume format received:", resumeFormat);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("*").eq("id", user.id).single();
    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({
        error: "User profile not found"
      }), {
          status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (profile.resumes_used >= profile.resumes_limit) {
      return new Response(JSON.stringify({
        error: "Resume limit reached for your subscription"
      }), {
          status: 403,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Get resume data
    const { data: resume, error: resumeError } = await supabaseClient.from("resumes").select("*").eq("id", resumeId).eq("user_id", user.id).single();
    if (resumeError || !resume) {
      console.error("Resume error:", resumeError);
      return new Response(JSON.stringify({
        error: "Resume not found"
      }), {
          status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Update resume status to processing
    await supabaseClient.from("resumes").update({
        status: "processing",
        enhancement_styles: enhancementStyles || [],
      custom_instructions: customInstructions || ""
    }).eq("id", resumeId);
    console.log("Updated resume status to processing");
    // Download the original resume file
    const { data: fileData, error: fileError } = await supabaseClient.storage.from("resumes").download(resume.original_file_path);
    if (fileError || !fileData) {
      console.error("File download error:", fileError);
await supabaseClient.from("resumes").update({
  // Add the fields you want to update here, for example:
  status: "failed"
}).eq("id", resumeId);

await supabaseClient.from("profiles").update({
  resumes_used: profile.resumes_used + 1,
  updated_at: new Date().toISOString()
}).eq("id", user.id);
      return new Response(JSON.stringify({
        error: "Failed to download resume file"
      }), {
          status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Downloaded original resume file");
    // Extract text from the resume file
    let resumeText;
    const fileExtension = resume.original_file_path.split(".").pop()?.toLowerCase();
    const fileMimeType = fileData.type;
    console.log(`File details - Path: ${resume.original_file_path}, MIME: ${fileMimeType}, Extension: ${fileExtension}`);
    if (fileMimeType === "text/plain" || !fileMimeType && fileExtension === "txt") {
      try {
        resumeText = await fileData.text();
        console.log("Extracted text from plain text resume, length:", resumeText?.length);
      } catch (error) {
        console.error("Error extracting text from plain text file:", error);
        await supabaseClient.from("resumes").update({
          status: "failed"
        }).eq("id", resumeId);
        return new Response(JSON.stringify({
          error: "Failed to read content from plain text resume file."
        }), {
            status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else if (fileMimeType === "application/pdf" || fileMimeType === "image/png" || fileMimeType === "image/jpeg" || !fileMimeType && (fileExtension === "pdf" || fileExtension === "png" || fileExtension === "jpg" || fileExtension === "jpeg")) {
      try {
        console.log(`Attempting Document AI for file type: ${fileMimeType || fileExtension}`);
        // Convert Blob to Uint8Array for Document AI
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        // Use Document AI to extract text
        resumeText = await extractTextFromDocument(uint8Array, fileMimeType || `application/${fileExtension}`);
        resumeText = resumeText.trim();
        console.log("Extracted text using Document AI, length:", resumeText?.length);
      } catch (error) {
        console.error("Error during Document AI processing:", error);
        await supabaseClient.from("resumes").update({
          status: "failed"
        }).eq("id", resumeId);
        return new Response(JSON.stringify({
          error: "Failed to extract text using Document AI: " + error.message
        }), {
            status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else {
      const unsupportedTypeMessage = `File type (${fileMimeType || fileExtension || "unknown"}) is not currently supported for direct processing. Please upload a plain text (.txt), PDF (.pdf), PNG (.png), or JPEG (.jpg, .jpeg) file.`;
      console.error(unsupportedTypeMessage);
      await supabaseClient.from("resumes").update({
        status: "failed"
      }).eq("id", resumeId);
      return new Response(JSON.stringify({
        error: unsupportedTypeMessage
      }), {
          status: 415,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (typeof resumeText === "undefined" || resumeText.trim() === "") {
      console.error("Resume text is undefined or empty after extraction attempt.");
      await supabaseClient.from("resumes").update({
        status: "failed"
      }).eq("id", resumeId);
      return new Response(JSON.stringify({
        error: "Failed to extract meaningful text from the resume. The file might be empty, corrupted, or an unexpected issue occurred during text extraction."
      }), {
          status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("Successfully extracted resume text, length:", resumeText.length);
    
    // If extractOnly flag is set, return just the extracted text
    if (extractOnly) {
      console.log("Extract-only mode, returning extracted text");
      return new Response(JSON.stringify({
        success: true,
        extractedText: resumeText
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    // Initialize Groq client early for ATS analysis
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      console.error("GROQ_API_KEY not found in environment variables");
      await supabaseClient.from("resumes").update({
        status: "failed"
      }).eq("id", resumeId);
      return new Response(JSON.stringify({
        error: "AI service configuration error"
      }), {
          status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const groq = new Groq({ apiKey: groqApiKey });
    
    // Analyze original resume ATS score before enhancement
    console.log("Analyzing original resume ATS score...");
    let originalATSScore;
    try {
      originalATSScore = await callATSAnalyzer(resumeText, supabaseClient);
      console.log("Original ATS score:", originalATSScore.overallScore);
    } catch (error) {
      console.error("Failed to analyze original ATS score:", error);
      // Continue processing even if ATS analysis fails
      originalATSScore = {
        keywordMatch: 0,
        formatScore: 0,
        contentQuality: 0,
        readabilityScore: 0,
        structureScore: 0,
        overallScore: 0,
        recommendations: ["ATS analysis failed - please try again"]
      };
    }
    
    // Build the style properties based on enhancement styles
    let styleProperties = "";
    if (enhancementStyles?.includes("professional")) {
      styleProperties += "- Use a professional theme with a clean layout and standard fonts\n";
    }
    if (enhancementStyles?.includes("concise")) {
      styleProperties += "- Use a minimalist design with focused content and compact spacing\n";
    }
    if (enhancementStyles?.includes("creative")) {
      styleProperties += "- Use a modern, eye-catching design with distinctive visual elements\n";
    }
    if (enhancementStyles?.includes("grammarFix")) {
      styleProperties += "- Enhance language quality and correct grammatical issues\n";
    }
    if (enhancementStyles?.includes("styleOnly")) {
      styleProperties += "- Focus only on design, preserve the original text content exactly\n";
    }
    
    // Handle different resume formats
    console.log("Checking resume format:", resumeFormat, "Type:", typeof resumeFormat);
    if (resumeFormat === "ats") {
      // Process ATS-optimized LaTeX format
      console.log("Processing ATS format - generating LaTeX resume");
      
      const atsSystemPrompt = `
You are an expert ATS-optimized resume writer. Analyze the provided resume and generate a structured JSON object optimized for Applicant Tracking Systems with the following structure:

{
    "name": "Full Name",
    "title": "Professional Title/Objective",
    "location": "City, State",
    "contacts": [
        { "type": "email", "value": "email@example.com" },
        { "type": "phone", "value": "+1-xxx-xxx-xxxx" },
        { "type": "linkedin", "value": "linkedin.com/in/username" },
        { "type": "github", "value": "github.com/username" }
    ],
    "education": [
        {
            "degree": "Degree Name",
            "institution": "Institution Name", 
            "location": "City, State",
            "dates": "Start Date - End Date",
            "details": ["Relevant coursework", "Honors", "GPA if >3.5"]
        }
    ],
    "experience": [
        {
            "position": "Job Title",
            "company": "Company Name",
            "location": "City, State", 
            "dates": "Start Date - End Date",
            "highlights": [
                "Quantified achievement with metrics (increased X by Y%)",
                "Action verb + specific accomplishment + impact",
                "Technical skills demonstrated in context"
            ]
        }
    ],
    "skills": ["Technical Skill 1", "Technical Skill 2", "Relevant Keyword"],
    "featured_project": [
        {
            "name": "Project Name",
            "description": "Brief description focusing on technical implementation and results",
            "technologies": ["Tech1", "Tech2", "Tech3"]
        }
    ]
}

ATS Optimization Guidelines:
- Use standard section headings (Experience, Education, Skills)
- Include relevant industry keywords naturally
- Quantify achievements with specific metrics and percentages
- Use action verbs (Developed, Implemented, Managed, Led, etc.)
- Avoid graphics, tables, or complex formatting
- Ensure all text is machine-readable
- Include technical skills and relevant keywords for the field
- Structure content for easy parsing by ATS systems
- Keep formatting clean and simple
- Focus on results and impact over responsibilities

${styleProperties}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ""}

CRITICAL REQUIREMENTS - FOLLOW EXACTLY:
1. Output ONLY valid JSON - NO COMMENTS ALLOWED
2. NEVER use // comments anywhere in the JSON
3. NEVER use /* comments */ anywhere in the JSON
4. NEVER add explanatory text outside the JSON
5. For incomplete/missing data, use "Not provided" or empty strings - NEVER add comments
6. The JSON must be parseable by JSON.parse() without errors
7. Double-check that NO COMMENTS exist in your output before submitting
8. If a field is incomplete or unclear, use placeholder text like "Not provided" instead of comments
9. ABSOLUTELY NO COMMENT SYNTAX (// or /* */) anywhere in the response
10. Test your JSON mentally with JSON.parse() before responding

WRONG EXAMPLES - NEVER DO THIS:
"linkedin": "linkedin.com/in/incomplete" // LinkedIn link is incomplete
"github": "github.com/user" /* incomplete URL */

CORRECT EXAMPLES - DO THIS INSTEAD:
"linkedin": "linkedin.com/in/not-provided"
"github": "Not provided"

For missing information, use empty strings ("") for text fields or empty arrays ([]) for array fields.
Output ONLY the raw JSON object that can be parsed directly with JSON.parse().`;

      try {
        console.log("Calling Groq API for ATS format");
        const atsCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system", 
              content: atsSystemPrompt
            },
            {
              role: "user",
              content: `Analyze and optimize this resume for ATS compatibility:\n\n${resumeText}`
            }
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.5,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        });

        const atsResponseText = atsCompletion.choices[0]?.message?.content || "";
        if (!atsResponseText) {
          throw new Error("Empty response from Groq API for ATS format");
        }

        // Parse the ATS JSON response
        let atsResumeData;
        try {
          const jsonMatch = atsResponseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No valid JSON object found in ATS response");
          }
          
          // Enhanced JSON cleaning to remove any comments and invalid syntax
          let cleanJson = jsonMatch[0]
            // Remove single-line comments (// anything)
            .replace(/\/\/.*$/gm, '')
            // Remove multi-line comments (/* anything */)
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Remove any trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Remove any lines that look like comments but without //
            .replace(/^\s*[^"{\[\s].*$/gm, '')
            // Clean up any extra whitespace and newlines
            .replace(/\n\s*\n/g, '\n')
            .trim();
            
          console.log("Cleaned JSON preview:", cleanJson.substring(0, 200) + "...");
          
          // Additional fallback: try to fix common patterns that cause JSON parsing errors
          try {
            atsResumeData = JSON.parse(cleanJson);
          } catch (firstAttemptError) {
            console.log("First parse attempt failed, trying additional cleaning...");
            
            // Try more aggressive cleaning for specific patterns
            cleanJson = cleanJson
              // Remove lines that contain "// " even if they're within strings incorrectly
              .replace(/.*\/\/.*\n/g, '')
              // Fix broken string values that might have comments
              .replace(/"([^"]*?)\/\/[^"]*"/g, '"$1"')
              // Remove any remaining comment-like patterns
              .replace(/\s*\/\/[^\n]*\n/g, '\n')
              // Clean up malformed JSON structures
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']');
              
            atsResumeData = JSON.parse(cleanJson);
          }
          
          console.log("Successfully parsed ATS JSON response");
        } catch (parseError) {
          console.error("Error parsing ATS JSON response:", parseError);
          console.error("Raw response text:", atsResponseText);
          console.error("Attempted clean JSON:", cleanJson?.substring(0, 500));
          throw new Error("Failed to parse ATS response as JSON: " + parseError.message);
        }

        // Generate LaTeX content using the shared latex-generator
        const { generateATSLatexResume } = await import("./latex-generator-edge.ts");
        const latexContent = generateATSLatexResume(atsResumeData);
        
        // Create processed file path for LaTeX
        const latexFileName = `processed/${user.id}/${resumeId}.tex`;
        
        // Upload LaTeX file
        console.log("Uploading LaTeX resume to:", latexFileName);
        const { error: latexUploadError } = await supabaseClient.storage
          .from("resumes")
          .upload(latexFileName, new Blob([latexContent], { type: "text/plain" }), {
            contentType: "text/plain",
            upsert: true
          });

        if (latexUploadError) {
          console.error("Error uploading LaTeX file:", latexUploadError);
          throw new Error("Failed to save LaTeX resume");
        }

        // Also create a text version for ATS analysis
        const textSections = [];
        textSections.push(atsResumeData.name?.toUpperCase() || "");
        textSections.push(atsResumeData.title || "");
        
        // Add contact info
        if (atsResumeData.contacts && atsResumeData.contacts.length > 0) {
          const contactInfo = atsResumeData.contacts.map(c => c.value).join(" | ");
          textSections.push(contactInfo);
        }

        // Add education
        if (atsResumeData.education && atsResumeData.education.length > 0) {
          textSections.push("\nEDUCATION");
          atsResumeData.education.forEach(edu => {
            textSections.push(`${edu.degree}, ${edu.institution} (${edu.dates})`);
            if (edu.details && edu.details.length > 0) {
              edu.details.forEach(detail => textSections.push(`• ${detail}`));
            }
          });
        }

        // Add experience  
        if (atsResumeData.experience && atsResumeData.experience.length > 0) {
          textSections.push("\nEXPERIENCE");
          atsResumeData.experience.forEach(exp => {
            textSections.push(`${exp.position}, ${exp.company} (${exp.dates})`);
            if (exp.highlights && exp.highlights.length > 0) {
              exp.highlights.forEach(highlight => textSections.push(`• ${highlight}`));
            }
          });
        }

        // Add skills
        if (atsResumeData.skills && atsResumeData.skills.length > 0) {
          textSections.push("\nSKILLS");
          textSections.push(atsResumeData.skills.join(", "));
        }

        // Add projects
        if (atsResumeData.featured_project && atsResumeData.featured_project.length > 0) {
          textSections.push("\nPROJECTS");
          atsResumeData.featured_project.forEach(proj => {
            textSections.push(`${proj.name}: ${proj.description}`);
            if (proj.technologies && proj.technologies.length > 0) {
              textSections.push(`Technologies: ${proj.technologies.join(", ")}`);
            }
          });
        }

        const atsTextContent = textSections.join("\n");
        
        // Upload text version for ATS analysis
        const textFileName = `processed/${user.id}/${resumeId}.txt`;
        const { error: textUploadError } = await supabaseClient.storage
          .from("resumes")
          .upload(textFileName, new Blob([atsTextContent], { type: "text/plain" }), {
            contentType: "text/plain",
            upsert: true
          });

        if (textUploadError) {
          console.error("Error uploading text file:", textUploadError);
          throw new Error("Failed to save text resume");
        }

        // Analyze enhanced ATS score
        console.log("Analyzing enhanced ATS score for LaTeX resume...");
        let enhancedATSScore;
        try {
          enhancedATSScore = await callATSAnalyzer(atsTextContent, supabaseClient);
          console.log("Enhanced ATS score:", enhancedATSScore.overallScore);
          console.log("ATS score improvement:", enhancedATSScore.overallScore - originalATSScore.overallScore);
        } catch (error) {
          console.error("Failed to analyze enhanced ATS score:", error);
          enhancedATSScore = {
            keywordMatch: originalATSScore.keywordMatch,
            formatScore: Math.min(95, originalATSScore.formatScore + 10), // LaTeX should have good format score
            contentQuality: originalATSScore.contentQuality,
            readabilityScore: originalATSScore.readabilityScore,
            structureScore: Math.min(95, originalATSScore.structureScore + 10), // LaTeX should have good structure
            overallScore: originalATSScore.overallScore,
            recommendations: ["Enhanced ATS analysis failed - using original scores with LaTeX improvements"]
          };
        }

        // Update database with LaTeX file path and ATS scores
        const { error: updateError } = await supabaseClient
          .from("resumes")
          .update({
            status: "completed",
            processed_file_path: latexFileName, // Store LaTeX file path
            ats_score_original: originalATSScore,
            ats_score_enhanced: enhancedATSScore,
            updated_at: new Date().toISOString()
          })
          .eq("id", resumeId);

        if (updateError) {
          console.error("Error updating resume record:", updateError);
          throw new Error("Failed to update resume status");
        }

        console.log("ATS LaTeX resume processing completed successfully");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        console.error("Error processing ATS format:", error);
        await supabaseClient.from("resumes").update({ status: "failed" }).eq("id", resumeId);
        return new Response(JSON.stringify({
          error: `ATS processing failed: ${error.message}`
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Continue with visual format processing (existing logic)
    // Construct the system prompt for structured JSON output
    const systemPrompt = `
You are an expert resume enhancer and designer. Analyze the provided resume and generate a JSON object with the following structure:

{
    "name": "Full Name",
    "title": "Professional Title",
        "location": "City, Country",
    "contacts": [
        { "type": "email", "value": "email@example.com" },
        { "type": "website", "value": "https://yourwebsite.com" },
        { "type": "linkedin", "value": "linkedin.com/in/username" },
        { "type": "github", "value": "github.com/username" }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "Institution Name",
        "location": "City, Country",
        "dates": "Start Date - End Date",
        "details": ["Detail 1", "Detail 2"]
      }
    ],
    "experience": [
        {
            "position": "Job Title",
            "company": "Company Name",
            "location": "City, Country",
            "dates": "Start Date - End Date",
            "highlights": ["Achievement 1", "Achievement 2"],
            "tags": ["React", "Node.js"]
        }
    ],
    "skills": ["JavaScript", "TypeScript", "Python"],
  "design": {
      "layout": {
        "columns": 2,
        "columnGap": 20,
        "padding": 40
    },
    "typography": {
        "fontFamily": "Noto Sans",
        "fontSize": 10,
        "lineHeight": 1.5,
        "paragraphSpacing": 20
      },
      "colors": {
        "primary": "#333333",
        "secondary": "#666666",
        "accent": "#007bff",
        "text": "#333333",
        "background": "#ffffff"
      }
    }
}

Guidelines:
- Use the above structure exactly, even if some fields are empty.
- For contacts, use an array of objects with 'type' and 'value'.
- Do not fabricate information; only extract what is present in the resume.
- For missing information, use empty strings ("") for text fields or empty arrays ([]) for array fields.
- NEVER include JavaScript-style comments (// text) in the JSON output.
- NEVER include explanatory text, markdown formatting, or code blocks.
- NEVER use placeholder comments like "// Replace with actual..." in any part of the JSON.
- Output ONLY the raw JSON object that can be parsed directly with JSON.parse().
- **CRITICAL:** Always include the "design" object with "layout.columns" set to 2.
${styleProperties}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ""}
`;
    console.log("System prompt created with style instructions");
    console.log("Groq client initialized");
    // Process the resume with Groq
    try {
      console.log("Calling Groq API");
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Here is the resume to enhance and design:\n\n${resumeText}`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 4000,
        response_format: {
          type: "json_object"
        }
      });
      console.log("Groq API call successful");
      // Extract response
      let responseText = chatCompletion.choices[0]?.message?.content || "";
      if (!responseText) {
        throw new Error("Empty response from Groq API");
      }
      // Parse the JSON response
      let resumeJson;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON object found in the response");
        }
        resumeJson = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed JSON response");
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Failed to parse AI response as JSON: " + parseError.message);
      }
      // Validate the JSON structure (make fields optional)
      if (!resumeJson.name && !resumeJson.title) {
        throw new Error("Invalid JSON structure: missing both name and title fields");
      }
      // Ensure required fields exist with defaults
      resumeJson.name = resumeJson.name || "Name Not Found";
      resumeJson.title = resumeJson.title || "Title Not Found";
      resumeJson.location = resumeJson.location || "";
      resumeJson.contacts = resumeJson.contacts || [];
      resumeJson.education = resumeJson.education || [];
      resumeJson.experience = resumeJson.experience || [];
      resumeJson.skills = resumeJson.skills || [];
      // Create processed file path for the txt version
      const processedFileName = `processed/${user.id}/${resumeId}.txt`;
      // Generate plain text from content for backward compatibility
      const contentSections = [];
      contentSections.push(resumeJson.name?.toUpperCase() || "");
      contentSections.push(resumeJson.title || "");
      // Add Contact Info
      if (resumeJson.contacts && resumeJson.contacts.length > 0) {
        const contactInfo = [];
        resumeJson.contacts.forEach((contact)=>{
          if (contact.type === "email" && contact.value) contactInfo.push(contact.value);
          if (contact.type === "website" && contact.value) contactInfo.push(contact.value);
          if (contact.type === "linkedin" && contact.value) contactInfo.push(contact.value);
          if (contact.type === "github" && contact.value) contactInfo.push(contact.value);
        });
        if (contactInfo.length > 0) {
          contentSections.push(contactInfo.join(" | "));
      }
      }
      // Add Education
      if (resumeJson.education && resumeJson.education.length > 0) {
        contentSections.push("\nEDUCATION");
        resumeJson.education.forEach((item)=>{
          contentSections.push(`${item.degree}, ${item.institution} (${item.dates})`);
          if (item.details && item.details.length > 0) {
            item.details.forEach((detail)=>{
              contentSections.push(`• ${detail}`);
            });
          }
        });
      }
      // Add Experience
      if (resumeJson.experience && resumeJson.experience.length > 0) {
        contentSections.push("\nEXPERIENCE");
        resumeJson.experience.forEach((item)=>{
          contentSections.push(`${item.position}, ${item.company} (${item.dates})`);
          if (item.highlights && item.highlights.length > 0) {
            contentSections.push(`Highlights: ${item.highlights.join(", ")}`);
          }
          if (item.tags && item.tags.length > 0) {
            contentSections.push(`Tags: ${item.tags.join(", ")}`);
          }
        });
      }
      // Add Skills
      if (resumeJson.skills && resumeJson.skills.length > 0) {
        contentSections.push("\nSKILLS");
        contentSections.push(resumeJson.skills.join(", "));
      }
      const enhancedResumeText = contentSections.join("\n");
      
      // Analyze enhanced resume ATS score after enhancement
      console.log("Analyzing enhanced resume ATS score...");
      let enhancedATSScore;
      try {
        enhancedATSScore = await callATSAnalyzer(enhancedResumeText, supabaseClient);
        console.log("Enhanced ATS score:", enhancedATSScore.overallScore);
        console.log("ATS score improvement:", enhancedATSScore.overallScore - originalATSScore.overallScore);
      } catch (error) {
        console.error("Failed to analyze enhanced ATS score:", error);
        // Use fallback scores if analysis fails
        enhancedATSScore = {
          keywordMatch: originalATSScore.keywordMatch,
          formatScore: originalATSScore.formatScore,
          contentQuality: originalATSScore.contentQuality,
          readabilityScore: originalATSScore.readabilityScore,
          structureScore: originalATSScore.structureScore,
          overallScore: originalATSScore.overallScore,
          recommendations: ["Enhanced ATS analysis failed - using original scores"]
        };
      }
      
      // Upload the text version of the enhanced resume
      console.log("Uploading enhanced resume text to:", processedFileName);
      const { error: uploadError } = await supabaseClient.storage.from("resumes").upload(processedFileName, new Blob([
        enhancedResumeText
      ]), {
          contentType: "text/plain",
        upsert: true
      });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        await supabaseClient.from("resumes").update({
          status: "failed"
        }).eq("id", resumeId);
        return new Response(JSON.stringify({
          error: "Failed to upload enhanced resume"
        }), {
            status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Update resume record with the JSON preview data and ATS scores
      console.log("Updating resume record with JSON preview data and ATS scores");
      await supabaseClient.from("resumes").update({
          processed_file_path: processedFileName,
          resume_preview_json: resumeJson,
          ats_score_original: originalATSScore,
          ats_score_enhanced: enhancedATSScore,
          status: "completed",
        updated_at: new Date().toISOString()
      }).eq("id", resumeId);
      // Increment user's resumes_used count
      await supabaseClient.from("profiles").update({
          resumes_used: profile.resumes_used + 1,
        updated_at: new Date().toISOString()
      }).eq("id", user.id);
      console.log("Resume enhancement process completed successfully");
      return new Response(JSON.stringify({
          success: true,
          resumeId,
          status: "completed",
        processedPath: processedFileName
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      const msg = error?.message || String(error);
      console.error("Error processing resume with Groq:", msg);
      await supabaseClient.from("resumes").update({
        status: "failed"
      }).eq("id", resumeId);
      return new Response(JSON.stringify({
        error: "Failed to process resume with AI: " + msg
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    const msg = error?.message || String(error);
    console.error("General error:", msg);
    return new Response(JSON.stringify({
      error: "Internal server error: " + msg
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
