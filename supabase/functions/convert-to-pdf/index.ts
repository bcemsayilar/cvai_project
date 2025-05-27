// @ts-nocheck // This file is for Deno/Vercel Edge Functions and is not used in local Node.js/Next.js development. Ignore all TypeScript errors in this file.

// This Supabase edge function is no longer used. PDF generation is now client-side.








import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"

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
    console.log("Starting convert-to-pdf function")

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      },
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error("Authentication error:", userError)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log("User authenticated:", user.id)

    // Parse request body
    const { resumeId, renderedHtml } = await req.json()

    if (!resumeId) {
      return new Response(JSON.stringify({ error: "Resume ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log("Converting resume to PDF:", resumeId)

    // Get resume data
    const { data: resume, error: resumeError } = await supabaseClient
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single()

    if (resumeError || !resume) {
      console.error("Resume error:", resumeError)
      return new Response(JSON.stringify({ error: "Resume not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Check if resume has JSON preview data
    if (!resume.resume_preview_json && !renderedHtml) {
      return new Response(JSON.stringify({ error: "Resume design data not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    let htmlContent

    if (renderedHtml) {
      // Use the HTML provided by the client
      htmlContent = renderedHtml
      console.log("Using client-provided HTML for PDF generation")
    } else {
      // Generate HTML from the resume JSON
      const resumeJson = resume.resume_preview_json

      console.log("Generating HTML from resume JSON")

      // Extract design parameters
      const design = resumeJson.design || {}
      const content = resumeJson.content || {}
      const colorScheme = design.colorScheme || {
        background: "#FFFFFF",
        textPrimary: "#1F2937",
        textSecondary: "#4B5563",
        accent: "#0EA5E9",
      }

      const typography = design.typography || {
        headingFont: "Helvetica",
        bodyFont: "Roboto, sans-serif",
        headingSize: "24px",
        bodySize: "14px",
      }

      const layout = design.layout || "two-column"
      const pdfLayout = design.pdfLayout || {
        pageSize: "A4",
        orientation: "portrait",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      }

      // Generate CSS based on design parameters
      const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap');
        
        :root {
          --bg-color: ${colorScheme.background};
          --text-primary: ${colorScheme.textPrimary};
          --text-secondary: ${colorScheme.textSecondary};
          --accent-color: ${colorScheme.accent};
          --heading-font: ${typography.headingFont};
          --body-font: ${typography.bodyFont};
          --heading-size: ${typography.headingSize};
          --body-size: ${typography.bodySize};
        }
        
        body {
          font-family: var(--body-font);
          font-size: var(--body-size);
          color: var(--text-primary);
          background-color: var(--bg-color);
          margin: 0;
          padding: ${pdfLayout.margins.top}px ${pdfLayout.margins.right}px ${pdfLayout.margins.bottom}px ${pdfLayout.margins.left}px;
          box-sizing: border-box;
          ${pdfLayout.pageSize === "A4" ? "width: 210mm; height: 297mm;" : ""}
          ${pdfLayout.orientation === "landscape" ? "width: 297mm; height: 210mm;" : ""}
        }
        
        h1, h2, h3, h4, h5 {
          font-family: var(--heading-font);
          color: var(--text-primary);
          margin-top: 0;
        }
        
        h1 {
          font-size: calc(var(--heading-size) * 1.2);
          margin-bottom: 4px;
        }
        
        h2 {
          font-size: var(--heading-size);
          color: var(--accent-color);
          border-bottom: 2px solid var(--accent-color);
          padding-bottom: 4px;
          margin-bottom: 12px;
        }
        
        h3 {
          font-size: calc(var(--heading-size) * 0.8);
          margin-bottom: 8px;
        }
        
        p {
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .resume-container {
          display: ${layout === "two-column" ? "grid" : "block"};
          ${layout === "two-column" ? "grid-template-columns: 2fr 3fr; gap: 24px;" : ""}
          height: 100%;
        }
        
        .resume-header {
          grid-column: 1 / -1;
          text-align: center;
          margin-bottom: 24px;
          padding: 24px;
          background-color: ${colorScheme.accent}15; /* Accent color with 15% opacity */
          border-radius: 8px;
        }
        
        .resume-title {
          color: var(--text-secondary);
          font-size: calc(var(--heading-size) * 0.7);
          margin-bottom: 8px;
        }
        
        .resume-contact {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 12px;
          font-size: calc(var(--body-size) * 0.9);
          color: var(--text-secondary);
        }
        
        .resume-section {
          margin-bottom: 20px;
        }
        
        .experience-item, .education-item {
          margin-bottom: 16px;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .item-title {
          font-weight: bold;
        }
        
        .item-date {
          color: var(--text-secondary);
          font-size: calc(var(--body-size) * 0.9);
        }
        
        .item-subtitle {
          font-style: italic;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        
        .item-highlights {
          list-style-type: disc;
          padding-left: 20px;
          margin-top: 8px;
          margin-bottom: 0;
        }
        
        .item-highlights li {
          margin-bottom: 4px;
        }
        
        .left-column {
          padding-right: 12px;
        }
        
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .skill-tag {
          background-color: ${colorScheme.accent}15;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: calc(var(--body-size) * 0.85);
        }
      `

      // Generate HTML with content sections
      htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${content.name || "Resume"}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="resume-container">
          <header class="resume-header">
            <h1>${content.name || "Full Name"}</h1>
            <div class="resume-title">${content.title || "Professional Title"}</div>
            
            <div class="resume-contact">
              ${content.contact?.email ? `<span>${content.contact.email}</span>` : ""}
              ${content.contact?.phone ? `<span>${content.contact.phone}</span>` : ""}
              ${content.contact?.location ? `<span>${content.contact.location}</span>` : ""}
              ${content.contact?.linkedin ? `<span>${content.contact.linkedin}</span>` : ""}
            </div>
          </header>
          
          ${
            layout === "two-column"
              ? `
          <div class="left-column">
            ${
              content.summary
                ? `
            <div class="resume-section">
              <h2>Summary</h2>
              <p>${content.summary}</p>
            </div>
            `
                : ""
            }
            
            ${
              content.skills && content.skills.length > 0
                ? `
            <div class="resume-section">
              <h2>Skills</h2>
              <div class="skills-list">
                ${content.skills.map((skill) => `<div class="skill-tag">${skill}</div>`).join("")}
              </div>
            </div>
            `
                : ""
            }
            
            ${
              content.education && content.education.length > 0
                ? `
            <div class="resume-section">
              <h2>Education</h2>
              ${content.education
                .map(
                  (edu) => `
                <div class="education-item">
                  <div class="item-header">
                    <div class="item-title">${edu.degree || ""}</div>
                    <div class="item-date">${edu.dates || ""}</div>
                  </div>
                  <div class="item-subtitle">${edu.institution || ""}${edu.location ? `, ${edu.location}` : ""}</div>
                  ${
                    edu.details && edu.details.length > 0
                      ? `
                    <ul class="item-highlights">
                      ${edu.details.map((detail) => `<li>${detail}</li>`).join("")}
                    </ul>
                  `
                      : ""
                  }
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
            
            ${
              content.certifications && content.certifications.length > 0
                ? `
            <div class="resume-section">
              <h2>Certifications</h2>
              <ul class="item-highlights">
                ${content.certifications.map((cert) => `<li>${cert}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }
            
            ${
              content.languages && content.languages.length > 0
                ? `
            <div class="resume-section">
              <h2>Languages</h2>
              <p>${content.languages.join(", ")}</p>
            </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }
          
          <div class="right-column">
            ${
              content.objective
                ? `
            <div class="resume-section">
              <h2>Objective</h2>
              <p>${content.objective}</p>
            </div>
            `
                : ""
            }
            
            ${
              content.experience && content.experience.length > 0
                ? `
            <div class="resume-section">
              <h2>Experience</h2>
              ${content.experience
                .map(
                  (exp) => `
                <div class="experience-item">
                  <div class="item-header">
                    <div class="item-title">${exp.position || ""}</div>
                    <div class="item-date">${exp.dates || ""}</div>
                  </div>
                  <div class="item-subtitle">${exp.company || ""}${exp.location ? `, ${exp.location}` : ""}</div>
                  ${
                    exp.highlights && exp.highlights.length > 0
                      ? `
                    <ul class="item-highlights">
                      ${exp.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}
                    </ul>
                  `
                      : ""
                  }
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
            
            ${
              !layout || layout !== "two-column"
                ? `
              ${
                content.education && content.education.length > 0
                  ? `
              <div class="resume-section">
                <h2>Education</h2>
                ${content.education
                  .map(
                    (edu) => `
                  <div class="education-item">
                    <div class="item-header">
                      <div class="item-title">${edu.degree || ""}</div>
                      <div class="item-date">${edu.dates || ""}</div>
                    </div>
                    <div class="item-subtitle">${edu.institution || ""}${edu.location ? `, ${edu.location}` : ""}</div>
                    ${
                      edu.details && edu.details.length > 0
                        ? `
                      <ul class="item-highlights">
                        ${edu.details.map((detail) => `<li>${detail}</li>`).join("")}
                      </ul>
                    `
                        : ""
                    }
                  </div>
                `,
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
              
              ${
                content.skills && content.skills.length > 0
                  ? `
              <div class="resume-section">
                <h2>Skills</h2>
                <div class="skills-list">
                  ${content.skills.map((skill) => `<div class="skill-tag">${skill}</div>`).join("")}
                </div>
              </div>
              `
                  : ""
              }
            `
                : ""
            }
            
            ${
              content.references && content.references.length > 0
                ? `
            <div class="resume-section">
              <h2>References</h2>
              ${content.references
                .map(
                  (ref) => `
                <div class="experience-item">
                  <div class="item-title">${ref.name || ""}</div>
                  <div class="item-subtitle">${ref.position || ""}${ref.company ? `, ${ref.company}` : ""}</div>
                  <div>${ref.contact || ""}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
          </div>
        </div>
      </body>
      </html>
      `
    }

    // Generate PDF using Puppeteer
    console.log("Initializing Puppeteer")

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    try {
      const page = await browser.newPage()

      // Set viewport to match A4 paper size
      await page.setViewport({
        width: 794, // ~A4 width in pixels at 96 DPI
        height: 1123, // ~A4 height in pixels at 96 DPI
        deviceScaleFactor: 2, // Higher for better quality
      })

      // Load HTML content
      await page.setContent(htmlContent, { waitUntil: "networkidle0" })

      // Generate PDF
      console.log("Generating PDF")
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      })

      // Upload the PDF to storage
      const pdfFileName = `processed/${user.id}/${resumeId}.pdf`

      console.log("Uploading PDF to:", pdfFileName)
      const { error: uploadError } = await supabaseClient.storage.from("resumes").upload(pdfFileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      })

      if (uploadError) {
        console.error("PDF upload error:", uploadError)
        return new Response(JSON.stringify({ error: "Failed to upload PDF" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Get a temporary URL for the PDF
      console.log("Creating signed URL for PDF")
      const { data: urlData, error: urlError } = await supabaseClient.storage
        .from("resumes")
        .createSignedUrl(pdfFileName, 60 * 60) // 1 hour expiry

      if (urlError) {
        console.error("Signed URL error:", urlError)
        return new Response(JSON.stringify({ error: "Failed to create download URL" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      console.log("PDF conversion completed successfully")
      return new Response(
        JSON.stringify({
          success: true,
          message: "PDF conversion completed",
          pdfPath: pdfFileName,
          downloadUrl: urlData?.signedUrl,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    } finally {
      // Always close the browser
      await browser.close()
    }
  } catch (error) {
    console.error("General error:", error)

    return new Response(JSON.stringify({ error: "Internal server error: " + error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
