import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        global: { headers: { Authorization: req.headers.get('authorization') || '' } },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Parse request body
    const { resumeId, renderedHtml } = await req.json();
    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Get resume data
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();
    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404, headers: corsHeaders });
    }

    if (!resume.resume_preview_json && !renderedHtml) {
      return NextResponse.json({ error: 'Resume design data not found' }, { status: 404, headers: corsHeaders });
    }

    let htmlContent;
    if (renderedHtml) {
      htmlContent = renderedHtml;
    } else {
      // ...existing code for generating HTML from resume.resume_preview_json...
    }

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      const pdfFileName = `processed/${user.id}/${resumeId}.pdf`;
      const { error: uploadError } = await supabaseClient.storage.from('resumes').upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (uploadError) {
        return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500, headers: corsHeaders });
      }
      const { data: urlData, error: urlError } = await supabaseClient.storage
        .from('resumes')
        .createSignedUrl(pdfFileName, 60 * 60);
      if (urlError) {
        return NextResponse.json({ error: 'Failed to create download URL' }, { status: 500, headers: corsHeaders });
      }
      return NextResponse.json({
        success: true,
        message: 'PDF conversion completed',
        pdfPath: pdfFileName,
        downloadUrl: urlData?.signedUrl,
      }, { headers: corsHeaders });
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500, headers: corsHeaders });
  }
}