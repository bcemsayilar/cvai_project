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

    // Multi-service LaTeX compilation with fallbacks
    const compileLatexToPdf = async (content: string): Promise<ArrayBuffer> => {
      const services = [
        {
          name: 'LaTeX.Online',
          url: 'https://latexonline.cc/compile',
          method: 'POST',
          prepareRequest: () => {
            const formData = new FormData();
            formData.append('text', content);
            formData.append('command', 'pdflatex');
            return { body: formData };
          }
        },
        {
          name: 'YtoTech LaTeX',
          url: 'https://latex.ytotech.com/builds/sync',
          method: 'POST',
          prepareRequest: () => ({
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resources: [{ main: true, content }],
              compiler: 'pdflatex'
            })
          })
        }
      ];

      let lastError: Error | null = null;

      for (const service of services) {
        try {
          console.log(`Attempting ${service.name} compilation...`);
          const requestConfig = service.prepareRequest();
          
          const response = await fetch(service.url, {
            method: service.method,
            ...requestConfig,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          if (response.status === 503) {
            const errorData = await response.json().catch(() => ({ message: 'Service temporarily unavailable' }));
            throw new Error(`${service.name} service unavailable: ${errorData.message || 'Service temporarily down'}`);
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`${service.name} failed (${response.status}): ${errorData.message || 'Compilation error'}`);
          }

          const pdfBlob = await response.blob();
          if (pdfBlob.size === 0) {
            throw new Error(`${service.name} returned empty PDF`);
          }

          console.log(`✅ ${service.name} compilation successful`);
          return await pdfBlob.arrayBuffer();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ ${service.name} unavailable, trying fallback service...`);
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Continue to next service for any error
          continue;
        }
      }

      // All services failed
      throw new Error(`All LaTeX compilation services failed. Last error: ${lastError?.message || 'Unknown error'}`);
    };

    const pdfBuffer = await compileLatexToPdf(latexContent);

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