import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { validator_utils, sanitizer } from '@/lib/sanitization';
import { envConfig } from '@/lib/env-config';
import { logSecurityEvent, extractRequestInfo } from '@/lib/security-monitor';

// CORS headers shared between POST and OPTIONS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export async function POST(req: NextRequest) {

  const requestInfo = extractRequestInfo(req);

  try {
    const { resumeId, isPreview = false } = await req.json();

    // Validate inputs
    if (!resumeId || !validator_utils.validateResumeId(resumeId)) {
      logSecurityEvent.inputValidationFailure({
        ...requestInfo,
        input: resumeId,
        reason: 'Invalid resume ID format'
      });
      return NextResponse.json({ error: 'Valid Resume ID is required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = envConfig.getSupabaseUrl();
    const supabaseKey = envConfig.getServiceRoleKey();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('authorization') || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      logSecurityEvent.authFailure({
        ...requestInfo,
        reason: 'Invalid or missing authentication token'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Rate limiting check
    const clientId = getClientIdentifier(req, user.id);
    const rateLimitResult = await checkRateLimit(clientId, 'pdf');
    
    if (!rateLimitResult.success) {
      logSecurityEvent.rateLimitHit({
        userId: user.id,
        ...requestInfo,
        limit: 'PDF generation limit'
      });
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
        }, 
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
          }
        }
      );
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

    // Sanitize LaTeX content before compilation
    const sanitizedLatex = sanitizer.sanitizeLatex(latexContent);
    
    if (!sanitizedLatex || sanitizedLatex.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid or empty LaTeX content' }, { status: 400, headers: corsHeaders });
    }

    // Multi-service LaTeX compilation with fallbacks
    const compileLatexToPdf = async (content: string): Promise<ArrayBuffer> => {
      const services = [
        {
          name: 'LaTeX.Online',
          url: 'https://latexonline.cc/compile',
          method: 'POST',
          prepareRequest: () => ({
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resources: [{ main: true, content }],
              compiler: 'pdflatex'
            })
          })
        },
        {
          name: 'LaTeX.Online',
          url: 'https://latexonline.cc/compile',
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

    let pdfBuffer: Buffer;
    try {
      const arrayBuffer = await compileLatexToPdf(sanitizedLatex);
      pdfBuffer = Buffer.from(arrayBuffer);
    } catch (compilationError) {
      console.error('LaTeX compilation failed:', compilationError);
      return NextResponse.json({ 
        error: 'PDF compilation failed. Please check your resume content.',
        details: envConfig.isProduction() ? undefined : (compilationError instanceof Error ? compilationError.message : String(compilationError))
      }, { status: 500, headers: corsHeaders });
    }

    if (isPreview) {
      const base64Pdf = pdfBuffer.toString('base64');
      return NextResponse.json({ 
        success: true, 
        pdfData: `data:application/pdf;base64,${base64Pdf}` 
      }, { headers: corsHeaders });
    } else {
      // For download, return PDF buffer directly instead of saving to storage
      // This prevents navigation issues and ensures direct download
      const base64Pdf = pdfBuffer.toString('base64');
      
      return NextResponse.json({ 
        success: true, 
        pdfBuffer: base64Pdf,
        fileName: `ats-optimized-resume-${resumeId}.pdf`
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('LaTeX to PDF conversion error:', error);
    return NextResponse.json({ 
      error: 'PDF conversion failed: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500, headers: corsHeaders });
  }
}