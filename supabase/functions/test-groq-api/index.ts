import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Groq } from "https://esm.sh/groq-sdk"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY")

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GROQ_API_KEY not found in environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const groq = new Groq({
      apiKey: groqApiKey,
    })

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: 'Reply with JSON: { "test": "success" }',
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 100,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Groq API test successful",
        response: chatCompletion.choices[0]?.message?.content,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error testing Groq API: " + error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
})
