import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

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

    const { resumeId } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400, headers: corsHeaders });
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

    // Get the PDF from the latex-to-pdf API
    const pdfResponse = await fetch(new URL('/api/latex-to-pdf', req.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('authorization') || '',
      },
      body: JSON.stringify({ resumeId, isPreview: false }),
    });

    if (!pdfResponse.ok) {
      const errorData = await pdfResponse.json().catch(() => ({ error: 'PDF generation failed' }));
      return NextResponse.json({ error: errorData.error }, { status: pdfResponse.status, headers: corsHeaders });
    }

    const result = await pdfResponse.json();
    if (!result.success || !result.pdfBuffer) {
      return NextResponse.json({ error: 'PDF generation failed' }, { status: 500, headers: corsHeaders });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(result.pdfBuffer, 'base64');

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

    // Return the PDF as a downloadable response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ats-optimized-resume-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json({ 
      error: 'PDF download failed: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500, headers: corsHeaders });
  }
}
