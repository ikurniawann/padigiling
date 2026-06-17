-- Add is_active to pipeline_stages (for master-data compatibility)
ALTER TABLE public.pipeline_stages 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update existing rows (already seeded)
UPDATE public.pipeline_stages SET is_active = true WHERE is_active IS NULL;
