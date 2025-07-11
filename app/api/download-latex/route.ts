import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const rateLimitResult = await checkRateLimit(clientId, 'pdf');
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many download requests. Please try again later.' },
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

    // Get user profile and check limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('resumes_used, resumes_limit')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404, headers: corsHeaders });
    }

    // Check if user has reached download limit
    if (profile.resumes_used >= profile.resumes_limit) {
      return NextResponse.json({ 
        error: 'Download limit reached for your subscription. Please upgrade your plan.' 
      }, { status: 403, headers: corsHeaders });
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
        { error: 'Resume not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Check if the resume has a LaTeX file
    if (!resume.processed_file_path || !resume.processed_file_path.endsWith('.tex')) {
      return NextResponse.json(
        { error: 'No LaTeX file available for this resume' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Download the LaTeX file from Supabase storage
    const { data: latexData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.processed_file_path)

    if (downloadError) {
      console.error('LaTeX file download error:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download LaTeX file' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Convert blob to text
    const latexContent = await latexData.text()

    // Generate filename with resume name or fallback
    let resumeName = 'resume'
    try {
      if (resume.resume_preview_json) {
        const previewData = typeof resume.resume_preview_json === 'string' 
          ? JSON.parse(resume.resume_preview_json) 
          : resume.resume_preview_json;
        resumeName = previewData?.content?.name || previewData?.name || 'resume'
        // Sanitize filename
        resumeName = resumeName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase()
      }
    } catch (e) {
      console.warn('Could not parse resume name:', e)
    }

    const filename = `${resumeName}_ats_optimized.tex`

    // Increment usage counter after successful download
    try {
      await supabase
        .from('profiles')
        .update({ 
          resumes_used: profile.resumes_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      console.log(`User ${user.id} usage incremented to ${profile.resumes_used + 1}`);
    } catch (updateError) {
      console.error('Failed to update usage counter:', updateError);
      // Don't fail the download if counter update fails
    }

    // Return the LaTeX file as download
    return new NextResponse(latexContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': latexContent.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading LaTeX file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}