import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse('ok', { headers: corsHeaders });
  }

  try {
    const { resumeId, isPreview = false } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume ID is required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404, headers: corsHeaders });
    }

    if (!resume.processed_file_path?.endsWith('.tex')) {
      return NextResponse.json({ error: 'Not a LaTeX resume' }, { status: 400, headers: corsHeaders });
    }

    const { data: latexFile, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(resume.processed_file_path);

    if (downloadError || !latexFile) {
      return NextResponse.json({ error: 'Failed to download LaTeX file' }, { status: 500, headers: corsHeaders });
    }

    const latexContent = await latexFile.text();

    // LaTeX'i PDF'e çevir - İŞTE TEK DEĞİŞİKLİK BU!
    const formData = new FormData();
    formData.append('text', latexContent);
    formData.append('command', 'pdflatex');
    
    const pdfResponse = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData
    });
    
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'LaTeX compilation failed' }, { status: 500, headers: corsHeaders });
    }
    
    const pdfBlob = await pdfResponse.blob();
    const pdfBuffer = await pdfBlob.arrayBuffer();

    if (isPreview) {
      const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
      return NextResponse.json({ 
        success: true, 
        pdfData: `data:application/pdf;base64,${base64Pdf}` 
      }, { headers: corsHeaders });
    } else {
      const pdfFileName = `processed/${user.id}/${resumeId}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(pdfFileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500, headers: corsHeaders });
      }

      const { data: urlData, error: urlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(pdfFileName, 60 * 60);

      if (urlError) {
        return NextResponse.json({ error: 'Failed to create download URL' }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ 
        success: true, 
        downloadUrl: urlData.signedUrl 
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('LaTeX to PDF conversion error:', error);
    return NextResponse.json({ 
      error: 'PDF conversion failed: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500, headers: corsHeaders });
  }
}