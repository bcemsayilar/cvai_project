-- Add resume_preview_json column to resumes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'resume_preview_json'
  ) THEN
    ALTER TABLE public.resumes ADD COLUMN resume_preview_json JSONB;
  END IF;
END
$$;

-- Add new API functions to the database
CREATE OR REPLACE FUNCTION public.get_enhanced_resume_preview(resume_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  resume_data JSONB;
BEGIN
  SELECT resume_preview_json INTO resume_data
  FROM public.resumes
  WHERE id = resume_id;
  
  RETURN resume_data;
END;
$$;
