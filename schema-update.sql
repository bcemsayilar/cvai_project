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
