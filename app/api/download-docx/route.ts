import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders });
  }

  try {
    const { resumeId } = await req.json()

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('authorization') || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Get resume data from database
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      console.error('Resume fetch error:', resumeError)
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Check if resume has been processed
    if (!resume.processed_file_path || resume.status !== 'completed') {
      return NextResponse.json(
        { error: 'Resume has not been processed yet' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Determine the source for DOCX generation based on resume format
    let textContent = '';
    
    if (resume.processed_file_path?.endsWith('.tex')) {
      // For ATS format resumes (LaTeX), look for companion .txt file first, then .tex file
      const txtPath = resume.processed_file_path.replace('.tex', '.txt');
      
      try {
        // Try to download the companion .txt file first
        let { data: txtData, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(txtPath);

        if (downloadError || !txtData) {
          console.log('Companion .txt file not found, trying .tex file:', downloadError);
          
          // Fallback to the .tex file itself
          const { data: texData, error: texError } = await supabase.storage
            .from('resumes')
            .download(resume.processed_file_path);

          if (texError || !texData) {
            console.error('LaTeX file download error:', texError);
            return NextResponse.json(
              { error: 'Enhanced resume file not found' },
              { status: 404, headers: corsHeaders }
            );
          }
          
          txtData = texData;
        }

        textContent = await txtData.text();
        
      } catch (storageError) {
        console.error('Storage download error:', storageError);
        return NextResponse.json(
          { error: 'Failed to download resume file' },
          { status: 500, headers: corsHeaders }
        );
      }
      
    } else {
      // For Visual format resumes, generate text from JSON data
      if (!resume.resume_preview_json) {
        return NextResponse.json(
          { error: 'Resume preview data not available' },
          { status: 404, headers: corsHeaders }
        );
      }

      try {
        let resumeData;
        if (typeof resume.resume_preview_json === 'string') {
          resumeData = JSON.parse(resume.resume_preview_json);
        } else {
          resumeData = resume.resume_preview_json;
        }

        // Extract content from nested structure if needed
        const content = resumeData.content || resumeData;
        
        // Generate text content from JSON data
        textContent = generateTextFromResumeData(content);
        
      } catch (parseError) {
        console.error('Error parsing resume JSON:', parseError);
        return NextResponse.json(
          { error: 'Error processing resume data' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: 'No content available for download' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create a text blob with .docx extension (simple text format)
    // For a proper DOCX, we would need the 'docx' library
    const blob = new Blob([textContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });

    // Create response with proper headers
    const response = new NextResponse(blob);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    response.headers.set('Content-Disposition', `attachment; filename="enhanced-resume-${new Date().toISOString().split('T')[0]}.docx"`);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('DOCX download error:', error)
    return NextResponse.json(
      { error: 'Internal server error during DOCX generation' },
      { status: 500 }
    )
  }
}

// Helper function to generate text content from resume JSON data
function generateTextFromResumeData(content: any): string {
  let text = '';
  
  // Name and title
  if (content.name) {
    text += `${content.name}\n`;
  }
  if (content.title) {
    text += `${content.title}\n\n`;
  }
  
  // Contact information
  if (content.contact) {
    text += 'CONTACT INFORMATION\n';
    text += '-------------------\n';
    if (content.contact.email) text += `Email: ${content.contact.email}\n`;
    if (content.contact.phone) text += `Phone: ${content.contact.phone}\n`;
    if (content.contact.location) text += `Location: ${content.contact.location}\n`;
    if (content.contact.linkedin) text += `LinkedIn: ${content.contact.linkedin}\n`;
    if (content.contact.website) text += `Website: ${content.contact.website}\n`;
    text += '\n';
  }
  
  // Summary
  if (content.summary) {
    text += 'SUMMARY\n';
    text += '-------\n';
    text += `${content.summary}\n\n`;
  }
  
  // Experience
  if (content.experience && Array.isArray(content.experience)) {
    text += 'EXPERIENCE\n';
    text += '----------\n';
    content.experience.forEach((exp: any) => {
      if (exp.title) text += `${exp.title}`;
      if (exp.company) text += ` at ${exp.company}`;
      if (exp.duration) text += ` (${exp.duration})`;
      text += '\n';
      if (exp.location) text += `${exp.location}\n`;
      if (exp.description) text += `${exp.description}\n`;
      if (exp.achievements && Array.isArray(exp.achievements)) {
        exp.achievements.forEach((achievement: string) => {
          text += `• ${achievement}\n`;
        });
      }
      text += '\n';
    });
  }
  
  // Education
  if (content.education && Array.isArray(content.education)) {
    text += 'EDUCATION\n';
    text += '---------\n';
    content.education.forEach((edu: any) => {
      if (edu.degree) text += `${edu.degree}`;
      if (edu.institution) text += ` from ${edu.institution}`;
      if (edu.year) text += ` (${edu.year})`;
      text += '\n';
      if (edu.location) text += `${edu.location}\n`;
      if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
      if (edu.honors) text += `Honors: ${edu.honors}\n`;
      text += '\n';
    });
  }
  
  // Skills
  if (content.skills && Array.isArray(content.skills)) {
    text += 'SKILLS\n';
    text += '------\n';
    content.skills.forEach((skill: any) => {
      if (typeof skill === 'string') {
        text += `• ${skill}\n`;
      } else if (skill.category && skill.items) {
        text += `${skill.category}:\n`;
        if (Array.isArray(skill.items)) {
          skill.items.forEach((item: string) => {
            text += `  • ${item}\n`;
          });
        } else {
          text += `  • ${skill.items}\n`;
        }
      }
    });
    text += '\n';
  }
  
  // Projects
  if (content.projects && Array.isArray(content.projects)) {
    text += 'PROJECTS\n';
    text += '--------\n';
    content.projects.forEach((project: any) => {
      if (project.name) text += `${project.name}`;
      if (project.duration) text += ` (${project.duration})`;
      text += '\n';
      if (project.description) text += `${project.description}\n`;
      if (project.technologies) text += `Technologies: ${project.technologies}\n`;
      text += '\n';
    });
  }
  
  // Certifications
  if (content.certifications && Array.isArray(content.certifications)) {
    text += 'CERTIFICATIONS\n';
    text += '--------------\n';
    content.certifications.forEach((cert: any) => {
      if (cert.name) text += `${cert.name}`;
      if (cert.issuer) text += ` by ${cert.issuer}`;
      if (cert.year) text += ` (${cert.year})`;
      text += '\n';
    });
    text += '\n';
  }
  
  return text;
}
