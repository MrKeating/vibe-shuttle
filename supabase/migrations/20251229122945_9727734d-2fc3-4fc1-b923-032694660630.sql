-- Add source repository tracking for folder mode bridges
ALTER TABLE public.bridges 
ADD COLUMN source_repo_url TEXT,
ADD COLUMN source_repo_name TEXT,
ADD COLUMN merge_mode TEXT DEFAULT 'standard',
ADD COLUMN folder_prefix TEXT;