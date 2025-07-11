import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI } from "https://esm.sh/@google/genai";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { generateATSLatexResume } from "./latex-generator-edge.ts";

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
 * Clean resume data by removing empty fields and "Not provided" values
 */
function cleanResumeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.filter(item => item !== null && item !== undefined && item !== '' && item !== 'Not provided')
               .map(item => cleanResumeData(item));
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '' || value === 'Not provided') {
      continue; // Skip empty values
    }
    
    if (typeof value === 'object') {
      const cleanedValue = cleanResumeData(value);
      if (Array.isArray(cleanedValue) && cleanedValue.length > 0) {
        cleaned[key] = cleanedValue;
      } else if (!Array.isArray(cleanedValue) && Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      }
    } else if (typeof value === 'string' && value.trim()) {
      cleaned[key] = value.trim();
    } else if (typeof value !== 'string') {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Analyzes resume text and provides ATS score (0-100) with detailed breakdown
 */
async function analyzeATSScore(resumeText: string, genAI: any, jobDescription?: string): Promise<ATSCriteria> {
  const systemPrompt = `
You are an expert ATS (Applicant Tracking System) analyzer. Analyze the provided resume text and provide a comprehensive ATS compatibility score based on industry standards.

Evaluate the resume on these key criteria:

1. **Keyword Match** (0-100): How well the resume matches relevant industry keywords and skills
2. **Format Score** (0-100): ATS-friendly formatting (clear sections, standard headings, no graphics blocking text)
3. **Content Quality** (0-100): Quantified achievements, action verbs, relevant experience
4. **Readability Score** (0-100): Clear language, proper grammar, logical flow
5. **Structure Score** (0-100): Standard resume sections, clear hierarchy, contact info accessibility

Provide your analysis in this exact JSON structure:
{
  "keywordMatch": number,
  "formatScore": number,
  "contentQuality": number,
  "readabilityScore": number,
  "structureScore": number,
  "overallScore": number,
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ]
}

Guidelines:
- Overall score should be weighted average: (keywordMatch * 0.3) + (formatScore * 0.2) + (contentQuality * 0.25) + (readabilityScore * 0.15) + (structureScore * 0.1)
- Be objective and consistent in scoring
- Provide 3-5 specific, actionable recommendations
- Focus on real ATS compatibility issues, not visual design
- Only return valid JSON, no additional text
`;

  try {
    console.log("Calling Gemini API for ATS analysis...");
    console.log("Resume text length:", resumeText.length);
    console.log("Resume text preview:", resumeText.substring(0, 200));
    
    const chatCompletion = await genAI.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nAnalyze this resume for ATS compatibility:\n\n${resumeText}${jobDescription ? `\n\nTarget job description (for keyword matching):\n${jobDescription}` : ''}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keywordMatch: { type: "integer", minimum: 0, maximum: 100 },
            formatScore: { type: "integer", minimum: 0, maximum: 100 },
            contentQuality: { type: "integer", minimum: 0, maximum: 100 },
            readabilityScore: { type: "integer", minimum: 0, maximum: 100 },
            structureScore: { type: "integer", minimum: 0, maximum: 100 },
            overallScore: { type: "integer", minimum: 0, maximum: 100 },
            recommendations: { 
              type: "array", 
              items: { type: "string" },
              minItems: 3,
              maxItems: 5
            }
          },
          required: ["keywordMatch", "formatScore", "contentQuality", "readabilityScore", "structureScore", "overallScore", "recommendations"]
        }
      }
    });
    
    console.log("Gemini API call completed successfully");

    // Extract response text with fallback methods
    let responseText = "";
    
    // Try different response paths
    if (chatCompletion.text) {
      responseText = chatCompletion.text;
      console.log("Got text from chatCompletion.text:", responseText);
    } else if (chatCompletion.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = chatCompletion.candidates[0].content.parts[0].text;
      console.log("Got text from candidates array:", responseText);
    } else if (chatCompletion.response?.text) {
      responseText = chatCompletion.response.text;
      console.log("Got text from response.text:", responseText);
    }
    
    if (!responseText) {
      console.error("EMPTY RESPONSE - Full object:", JSON.stringify(chatCompletion, null, 2));
      throw new Error("Empty response from Gemini API - please check API configuration and quota");
    }

    // Parse JSON response directly (should be valid with responseSchema)
    let analysisResult;
    try {
      analysisResult = JSON.parse(responseText);
      console.log("Successfully parsed JSON:", analysisResult);
    } catch (e) {
      console.log("Direct parse failed, trying JSON extraction:", e);
      // Fallback: try to extract JSON if parsing fails
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("NO JSON MATCH - Raw response text:", responseText);
        throw new Error("No valid JSON object found in Gemini response. Raw response: " + responseText.substring(0, 200));
      }
      analysisResult = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed extracted JSON:", analysisResult);
    }
    
    // Validate and ensure all required fields
    const result: ATSCriteria = {
      keywordMatch: Math.round(Math.max(0, Math.min(100, analysisResult.keywordMatch || 0))),
      formatScore: Math.round(Math.max(0, Math.min(100, analysisResult.formatScore || 0))),
      contentQuality: Math.round(Math.max(0, Math.min(100, analysisResult.contentQuality || 0))),
      readabilityScore: Math.round(Math.max(0, Math.min(100, analysisResult.readabilityScore || 0))),
      structureScore: Math.round(Math.max(0, Math.min(100, analysisResult.structureScore || 0))),
      overallScore: Math.round(Math.max(0, Math.min(100, analysisResult.overallScore || 0))),
      recommendations: analysisResult.recommendations || []
    };

    // Recalculate overall score to ensure consistency
    result.overallScore = Math.round(
      (result.keywordMatch * 0.3) +
      (result.formatScore * 0.2) +
      (result.contentQuality * 0.25) +
      (result.readabilityScore * 0.15) +
      (result.structureScore * 0.1)
    );

    return result;

  } catch (error) {
    console.error("Error analyzing ATS score:", error);
    
    // Check for rate limiting or network errors
    if (error.message?.includes('rate limit') || error.message?.includes('quota') || error.message?.includes('429')) {
      console.warn("Rate limit detected, using fallback scores");
      return {
        keywordMatch: 50,
        formatScore: 60,
        contentQuality: 55,
        readabilityScore: 65,
        structureScore: 70,
        overallScore: 60,
        recommendations: ["ATS analysis temporarily unavailable due to rate limiting"]
      };
    }
    
    throw new Error(`Failed to analyze ATS score: ${error.message}`);
  }
}
// Cache for access token
let cachedToken: { token: string; expiry: number } | null = null;

// Function to get Google Cloud access token using djwt library
async function getAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }
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
    
    // Cache the token (expire 5 minutes before actual expiry)
    cachedToken = {
      token: tokenData.access_token,
      expiry: Date.now() + (tokenData.expires_in - 300) * 1000
    };
    
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
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Document AI API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Document AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Document AI API request timed out after 30 seconds');
      }
      throw fetchError;
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
serve(async (req: Request) => {
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
    const { resumeId, enhancementStyles, customInstructions, extractOnly, resumeFormat } = await req.json();
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
    let resumeText: string;
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
    
    // Initialize Gemini client early for ATS analysis
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
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
    const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // Note: We'll analyze ATS scores in parallel after content processing to optimize performance
    // Cache original ATS score to avoid re-analyzing the same text
    let originalATSScoreCache: ATSCriteria | null = null;
    
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
5. For incomplete/missing data, use empty strings or omit the field entirely - NEVER add comments
6. The JSON must be parseable by JSON.parse() without errors
7. Double-check that NO COMMENTS exist in your output before submitting
8. If a field is incomplete or unclear, use empty strings or omit the field entirely instead of comments
9. ABSOLUTELY NO COMMENT SYNTAX (// or /* */) anywhere in the response
10. Test your JSON mentally with JSON.parse() before responding

WRONG EXAMPLES - NEVER DO THIS:
"linkedin": "linkedin.com/in/incomplete" // LinkedIn link is incomplete
"github": "github.com/user" /* incomplete URL */
"value": "linkedin.com" // LinkedIn link not provided
"value": "github.com" // GitHub link not provided

CORRECT EXAMPLES - DO THIS INSTEAD:
"linkedin": ""
"github": ""
"value": ""

REMEMBER: Every single character in your response must be valid JSON. No exceptions.
Comments will break the parser and cause system errors. Use descriptive placeholder values instead.

For missing information, use empty strings ("") for text fields or empty arrays ([]) for array fields.
Output ONLY the raw JSON object that can be parsed directly with JSON.parse().`;

      try {
        console.log("Calling Gemini API for ATS format");
        const atsCompletion = await genAI.models.generateContent({
          model: "gemini-2.5-pro",
          contents: [
            {
              role: "user",
              parts: [{ text: `${atsSystemPrompt}\n\nAnalyze and optimize this resume for ATS compatibility:\n\n${resumeText}` }]
            }
          ],
          config: {
            temperature: 0.5,
            maxOutputTokens: 3000,
            responseMimeType: "application/json"
          }
        });

        const atsResponseText = atsCompletion.text || "";
        if (!atsResponseText) {
          throw new Error("Empty response from Gemini API for ATS format");
        }

        // Parse the ATS JSON response
        let atsResumeData: any;
        try {
          const jsonMatch = atsResponseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No valid JSON object found in ATS response");
          }
          
          // Robust JSON cleaning function
          function robustJsonParse(jsonStr: string): any {
            // Multiple attempts with increasingly aggressive cleaning
            const attempts = [
              // Attempt 1: Basic cleanup
              (str: string) => str
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
                .replace(/\/\/[^\n\r]*[\n\r]/g, '\n') // Remove // comments
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .trim(),
              
              // Attempt 2: More aggressive comment removal
              (str: string) => str
                .replace(/"[^"]*"\s*\/\/[^\n\r]*/g, (match) => match.split('//')[0].trim()) // Remove comments after strings
                .replace(/\s*\/\/[^\n\r]*[\n\r]*/g, '\n') // Remove all // comments
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
                .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .trim(),
              
              // Attempt 3: Line-by-line processing
              (str: string) => str
                .split('\n')
                .map(line => {
                  // Remove comments but preserve string content
                  if (line.includes('//') && !line.match(/"[^"]*\/\/[^"]*"/)) {
                    return line.split('//')[0].trim();
                  }
                  return line;
                })
                .join('\n')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/,(\s*[}\]])/g, '$1')
                .trim()
            ];
            
            for (let i = 0; i < attempts.length; i++) {
              try {
                const cleaned = attempts[i](jsonStr);
                console.log(`JSON parsing attempt ${i + 1} - preview:`, cleaned.substring(0, 200) + "...");
                return JSON.parse(cleaned);
              } catch (error) {
                console.log(`JSON parsing attempt ${i + 1} failed:`, error.message);
                if (i === attempts.length - 1) {
                  throw error;
                }
              }
            }
          }
          
          atsResumeData = cleanResumeData(robustJsonParse(jsonMatch[0]));
          
          console.log("Successfully parsed and cleaned ATS JSON response");
        } catch (parseError) {
          console.error("Error parsing ATS JSON response:", parseError);
          console.error("Raw response text:", atsResponseText.substring(0, 500));
          throw new Error("Failed to parse ATS response as JSON: " + parseError.message);
        }

        // Generate LaTeX content using the shared latex-generator
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
        const textSections: string[] = [];
        textSections.push(atsResumeData.name?.toUpperCase() || "");
        textSections.push(atsResumeData.title || "");
        
        // Add contact info
        if (atsResumeData.contacts && atsResumeData.contacts.length > 0) {
          const validContacts = atsResumeData.contacts.filter((c: any) => c.value && c.value.trim() && c.value !== 'Not provided');
          if (validContacts.length > 0) {
            const contactInfo = validContacts.map((c: any) => c.value).join(" | ");
            textSections.push(contactInfo);
          }
        }

        // Add education
        if (atsResumeData.education && atsResumeData.education.length > 0) {
          textSections.push("\nEDUCATION");
          atsResumeData.education.forEach((edu: any) => {
            textSections.push(`${edu.degree}, ${edu.institution} (${edu.dates})`);
            if (edu.details && edu.details.length > 0) {
              const validDetails = edu.details.filter((detail: any) => detail && detail.trim() && detail !== 'Not provided');
              validDetails.forEach((detail: any) => textSections.push(`• ${detail}`));
            }
          });
        }

        // Add experience  
        if (atsResumeData.experience && atsResumeData.experience.length > 0) {
          textSections.push("\nEXPERIENCE");
          atsResumeData.experience.forEach((exp: any) => {
            textSections.push(`${exp.position}, ${exp.company} (${exp.dates})`);
            if (exp.highlights && exp.highlights.length > 0) {
              const validHighlights = exp.highlights.filter((highlight: any) => highlight && highlight.trim() && highlight !== 'Not provided');
              validHighlights.forEach((highlight: any) => textSections.push(`• ${highlight}`));
            }
          });
        }

        // Add skills
        if (atsResumeData.skills && atsResumeData.skills.length > 0) {
          const validSkills = atsResumeData.skills.filter((skill: any) => skill && skill.trim() && skill !== 'Not provided');
          if (validSkills.length > 0) {
            textSections.push("\nSKILLS");
            textSections.push(validSkills.join(", "));
          }
        }

        // Add projects
        if (atsResumeData.featured_project && atsResumeData.featured_project.length > 0) {
          textSections.push("\nPROJECTS");
          atsResumeData.featured_project.forEach((proj: any) => {
            textSections.push(`${proj.name}: ${proj.description}`);
            if (proj.technologies && proj.technologies.length > 0) {
              const validTechnologies = proj.technologies.filter((tech: any) => tech && tech.trim() && tech !== 'Not provided');
              if (validTechnologies.length > 0) {
                textSections.push(`Technologies: ${validTechnologies.join(", ")}`);
              }
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

        // Analyze ATS scores (cache original to avoid re-analysis)
        console.log("Analyzing ATS scores in parallel for LaTeX resume...");
        const [originalATSScore, enhancedATSScore] = await Promise.allSettled([
          originalATSScoreCache || analyzeATSScore(resumeText, genAI),
          analyzeATSScore(atsTextContent, genAI)
        ]);
        
        // Cache original score for later use
        if (!originalATSScoreCache && originalATSScore.status === 'fulfilled') {
          originalATSScoreCache = originalATSScore.value;
        }
        
        const originalScore = originalATSScore.status === 'fulfilled' ? originalATSScore.value : {
          keywordMatch: 0, formatScore: 0, contentQuality: 0, readabilityScore: 0, structureScore: 0,
          overallScore: 0, recommendations: ["Original ATS analysis failed"]
        };
        
        const enhancedScore = enhancedATSScore.status === 'fulfilled' ? enhancedATSScore.value : {
          keywordMatch: originalScore.keywordMatch,
          formatScore: Math.min(95, originalScore.formatScore + 10),
          contentQuality: originalScore.contentQuality,
          readabilityScore: originalScore.readabilityScore,
          structureScore: Math.min(95, originalScore.structureScore + 10),
          overallScore: originalScore.overallScore,
          recommendations: ["Enhanced ATS analysis failed - using original scores with LaTeX improvements"]
        };
        
        console.log("Original ATS score:", originalScore.overallScore);
        console.log("Enhanced ATS score:", enhancedScore.overallScore);
        console.log("ATS score improvement:", enhancedScore.overallScore - originalScore.overallScore);

        // Update database with LaTeX file path, JSON data, and ATS scores
        const { error: updateError } = await supabaseClient
          .from("resumes")
          .update({
            status: "completed",
            processed_file_path: latexFileName, // Store LaTeX file path
            resume_preview_json: atsResumeData, // Store JSON data for editing
            ats_score_original: originalScore,
            ats_score_enhanced: enhancedScore,
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
    console.log("Gemini client initialized");
    // Process the resume with Gemini
    try {
      console.log("Calling Gemini API");
      const chatCompletion = await genAI.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nHere is the resume to enhance and design:\n\n${resumeText}` }]
          }
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: "application/json"
        }
      });
      console.log("Gemini API call successful");
      // Extract response
      let responseText = chatCompletion.text || "";
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }
      // Parse the JSON response
      let resumeJson: any;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON object found in the response");
        }
        resumeJson = cleanResumeData(JSON.parse(jsonMatch[0]));
        console.log("Successfully parsed and cleaned JSON response");
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
      const contentSections: string[] = [];
      contentSections.push(resumeJson.name?.toUpperCase() || "");
      contentSections.push(resumeJson.title || "");
      // Add Contact Info
      if (resumeJson.contacts && resumeJson.contacts.length > 0) {
        const contactInfo: string[] = [];
        resumeJson.contacts.forEach((contact: any) => {
          if (contact.type === "email" && contact.value && contact.value.trim() && contact.value !== 'Not provided') {
            contactInfo.push(contact.value);
          }
          if (contact.type === "website" && contact.value && contact.value.trim() && contact.value !== 'Not provided') {
            contactInfo.push(contact.value);
          }
          if (contact.type === "linkedin" && contact.value && contact.value.trim() && contact.value !== 'Not provided') {
            contactInfo.push(contact.value);
          }
          if (contact.type === "github" && contact.value && contact.value.trim() && contact.value !== 'Not provided') {
            contactInfo.push(contact.value);
          }
        });
        if (contactInfo.length > 0) {
          contentSections.push(contactInfo.join(" | "));
        }
      }
      // Add Education
      if (resumeJson.education && resumeJson.education.length > 0) {
        contentSections.push("\nEDUCATION");
        resumeJson.education.forEach((item: any) => {
          contentSections.push(`${item.degree}, ${item.institution} (${item.dates})`);
          if (item.details && item.details.length > 0) {
            const validDetails = item.details.filter((detail: any) => detail && detail.trim() && detail !== 'Not provided');
            validDetails.forEach((detail: any) => {
              contentSections.push(`• ${detail}`);
            });
          }
        });
      }
      // Add Experience
      if (resumeJson.experience && resumeJson.experience.length > 0) {
        contentSections.push("\nEXPERIENCE");
        resumeJson.experience.forEach((item: any) => {
          contentSections.push(`${item.position}, ${item.company} (${item.dates})`);
          if (item.highlights && item.highlights.length > 0) {
            const validHighlights = item.highlights.filter((highlight: any) => highlight && highlight.trim() && highlight !== 'Not provided');
            if (validHighlights.length > 0) {
              contentSections.push(`Highlights: ${validHighlights.join(", ")}`);
            }
          }
          if (item.tags && item.tags.length > 0) {
            const validTags = item.tags.filter((tag: any) => tag && tag.trim() && tag !== 'Not provided');
            if (validTags.length > 0) {
              contentSections.push(`Tags: ${validTags.join(", ")}`);
            }
          }
        });
      }
      // Add Skills
      if (resumeJson.skills && resumeJson.skills.length > 0) {
        const validSkills = resumeJson.skills.filter((skill: any) => skill && skill.trim() && skill !== 'Not provided');
        if (validSkills.length > 0) {
          contentSections.push("\nSKILLS");
          contentSections.push(validSkills.join(", "));
        }
      }
      const enhancedResumeText = contentSections.join("\n");
      
      // Analyze ATS scores (use cached original score)
      console.log("Analyzing ATS scores for visual resume...");
      const enhancedATSScore = await Promise.allSettled([
        analyzeATSScore(enhancedResumeText, genAI)
      ]);
      
      // Use cached original score or analyze if not available
      const originalATSScore = originalATSScoreCache 
        ? { status: 'fulfilled' as const, value: originalATSScoreCache }
        : await Promise.allSettled([analyzeATSScore(resumeText, genAI)]).then(results => results[0]);
      
      const originalScore = originalATSScore.status === 'fulfilled' ? originalATSScore.value : {
        keywordMatch: 0, formatScore: 0, contentQuality: 0, readabilityScore: 0, structureScore: 0,
        overallScore: 0, recommendations: ["Original ATS analysis failed"]
      };
      
      const enhancedScore = enhancedATSScore[0].status === 'fulfilled' ? enhancedATSScore[0].value : {
        keywordMatch: originalScore.keywordMatch,
        formatScore: originalScore.formatScore,
        contentQuality: originalScore.contentQuality,
        readabilityScore: originalScore.readabilityScore,
        structureScore: originalScore.structureScore,
        overallScore: originalScore.overallScore,
        recommendations: ["Enhanced ATS analysis failed - using original scores"]
      };
      
      console.log("Original ATS score:", originalScore.overallScore);
      console.log("Enhanced ATS score:", enhancedScore.overallScore);
      console.log("ATS score improvement:", enhancedScore.overallScore - originalScore.overallScore);
      
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
          ats_score_original: originalScore,
          ats_score_enhanced: enhancedScore,
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
      console.error("Error processing resume with Gemini:", msg);
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
