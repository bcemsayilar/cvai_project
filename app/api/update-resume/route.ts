import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { envConfig } from '@/lib/env-config'
import { withCSRFProtection } from '@/lib/csrf-protection'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export const POST = withCSRFProtection(async (req: Request) => {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(req as any);
    const rateLimitResult = await checkRateLimit(clientId, 'api');
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      );
    }

    const { resumeId, updatedContent } = await req.json()

    if (!resumeId || !updatedContent) {
      return NextResponse.json(
        { error: 'Resume ID and updated content are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabaseUrl = envConfig.getSupabaseUrl()
    const supabaseKey = envConfig.getServiceRoleKey()

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Create client with service role key and auth header for proper RLS handling
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { 
        headers: { 
          Authorization: authHeader 
        } 
      }
    })

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Authentication error:', userError)
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Get current resume data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Update the resume_preview_json with the new content
    let currentPreviewJson = resume.resume_preview_json
    if (typeof currentPreviewJson === 'string') {
      currentPreviewJson = JSON.parse(currentPreviewJson)
    }

    // Merge the updated content
    const updatedPreviewJson = {
      ...currentPreviewJson,
      content: updatedContent
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        resume_preview_json: JSON.stringify(updatedPreviewJson),
        updated_at: new Date().toISOString()
      })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update resume' },
        { status: 500, headers: corsHeaders }
      )
    }

    // If it's a LaTeX format resume, regenerate the LaTeX file
    if (resume.processed_file_path?.endsWith('.tex')) {
      try {
        // Import the LaTeX generator
        const { generateATSLatexResume } = await import('@/supabase/functions/process-resume/latex-generator-edge')
        
        // Transform the updated content to the format expected by the LaTeX generator
        const latexData = {
          name: updatedContent.name || '',
          title: updatedContent.title || '',
          location: updatedContent.contact?.location || '',
          contacts: [
            ...(updatedContent.contact?.email && updatedContent.contact.email.trim() && updatedContent.contact.email !== 'Not provided' ? [{ type: 'email', value: updatedContent.contact.email }] : []),
            ...(updatedContent.contact?.phone && updatedContent.contact.phone.trim() && updatedContent.contact.phone !== 'Not provided' ? [{ type: 'phone', value: updatedContent.contact.phone }] : []),
            ...(updatedContent.contact?.linkedin && updatedContent.contact.linkedin.trim() && updatedContent.contact.linkedin !== 'Not provided' ? [{ type: 'linkedin', value: updatedContent.contact.linkedin }] : []),
            ...(updatedContent.contact?.github && updatedContent.contact.github.trim() && updatedContent.contact.github !== 'Not provided' ? [{ type: 'github', value: updatedContent.contact.github }] : []),
            ...(updatedContent.contact?.website && updatedContent.contact.website.trim() && updatedContent.contact.website !== 'Not provided' ? [{ type: 'website', value: updatedContent.contact.website }] : []),
          ],
          education: updatedContent.education?.map((edu: any) => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            location: edu.location || '',
            dates: edu.dates || '',
            details: (edu.details || []).filter((detail: any) => detail && detail.trim() && detail !== 'Not provided')
          })) || [],
          experience: updatedContent.experience?.map((exp: any) => ({
            position: exp.position || '',
            company: exp.company || '',
            location: exp.location || '',
            dates: exp.dates || '',
            highlights: (exp.highlights || []).filter((highlight: any) => highlight && highlight.trim() && highlight !== 'Not provided')
          })) || [],
          skills: (updatedContent.skills || []).filter((skill: any) => skill && skill.trim() && skill !== 'Not provided'),
          featured_project: updatedContent.projects?.map((proj: any) => ({
            name: proj.name || '',
            description: proj.description || '',
            technologies: [] // Could be enhanced later
          })) || []
        }

        // Generate new LaTeX content
        const latexContent = generateATSLatexResume(latexData)

        // Create a service role client specifically for storage operations to bypass RLS
        const serviceRoleClient = createClient(supabaseUrl, supabaseKey);
        
        // Generate new filename with timestamp to avoid cache issues
        const timestamp = Date.now()
        const latexFileName = `processed/${user.id}/${resumeId}_${timestamp}.tex`
        const { error: latexUploadError } = await serviceRoleClient.storage
          .from('resumes')
          .upload(latexFileName, new Blob([latexContent], { type: 'text/plain' }), {
            contentType: 'text/plain',
            upsert: true
          })

        if (latexUploadError) {
          console.error('Error updating LaTeX file:', latexUploadError)
          console.error('LaTeX file path:', latexFileName)
          console.error('User ID:', user.id)
          // Don't fail the request, just log the error
          return NextResponse.json(
            { 
              success: true, 
              message: 'Resume updated successfully but LaTeX file may not have updated',
              updatedData: updatedPreviewJson,
              latexUpdated: false
            },
            { headers: corsHeaders }
          )
        } else {
          console.log('LaTeX file updated successfully');
          
          // Update the database with the new file path
          const { error: updatePathError } = await supabase
            .from('resumes')
            .update({ 
              processed_file_path: latexFileName,
              updated_at: new Date().toISOString()
            })
            .eq('id', resumeId)
            .eq('user_id', user.id)
          
          if (updatePathError) {
            console.error('Failed to update processed_file_path in database:', updatePathError);
          }
          
          
          return NextResponse.json(
            { 
              success: true, 
              message: 'Resume updated successfully',
              updatedData: updatedPreviewJson,
              latexUpdated: true
            },
            { headers: corsHeaders }
          )
        }

      } catch (latexError) {
        console.error('Error regenerating LaTeX:', latexError)
        // Don't fail the request, just log the error
        return NextResponse.json(
          { 
            success: true, 
            message: 'Resume updated successfully but LaTeX regeneration failed',
            updatedData: updatedPreviewJson,
            latexUpdated: false
          },
          { headers: corsHeaders }
        )
      }
    } else {
      // For non-LaTeX resumes, return success without LaTeX update
      return NextResponse.json(
        { 
          success: true, 
          message: 'Resume updated successfully',
          updatedData: updatedPreviewJson,
          latexUpdated: false
        },
        { headers: corsHeaders }
      )
    }

  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
});
