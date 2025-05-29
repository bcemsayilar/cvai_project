// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Groq } from "https://esm.sh/groq-sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

interface ATSCriteria {
  keywordMatch: number;
  formatScore: number;
  contentQuality: number;
  readabilityScore: number;
  structureScore: number;
  overallScore: number;
  recommendations: string[];
}

/**
 * Analyzes resume text and provides ATS score (0-100) with detailed breakdown
 */
async function analyzeATSScore(resumeText: string, jobDescription?: string): Promise<ATSCriteria> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY not found in environment variables");
  }

  const groq = new Groq({ apiKey: groqApiKey });

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
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this resume for ATS compatibility:\n\n${resumeText}${jobDescription ? `\n\nTarget job description (for keyword matching):\n${jobDescription}` : ''}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3, // Lower temperature for consistent scoring
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";
    if (!responseText) {
      throw new Error("Empty response from Groq API");
    }

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in the response");
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
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
    throw new Error(`Failed to analyze ATS score: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim() === '') {
      return new Response(
        JSON.stringify({ error: "Resume text is required and cannot be empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Starting ATS analysis for resume text length:", resumeText.length);

    // Analyze ATS score
    const atsAnalysis = await analyzeATSScore(resumeText, jobDescription);

    console.log("ATS analysis completed, overall score:", atsAnalysis.overallScore);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: atsAnalysis
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("ATS analyzer error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error during ATS analysis"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
