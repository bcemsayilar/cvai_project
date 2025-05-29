// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Groq } from "https://esm.sh/groq-sdk";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
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
    const { resumeId, enhancementStyles, customInstructions } = await req.json();
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
        status: "failed"
      }).eq("id", resumeId);
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
- Only output a valid JSON object, nothing else.
- Do NOT include any comments or explanations.
- **CRITICAL:** Always include the "design" object with "layout.columns" set to 2.
${styleProperties}
${customInstructions ? `\nAdditional instructions: ${customInstructions}` : ""}
`;
    console.log("System prompt created with style instructions");
    // Initialize Groq client
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
    const groq = new Groq({
      apiKey: groqApiKey
    });
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
      // Update resume record with the JSON preview data
      console.log("Updating resume record with JSON preview data");
      await supabaseClient.from("resumes").update({
          processed_file_path: processedFileName,
          resume_preview_json: resumeJson,
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
