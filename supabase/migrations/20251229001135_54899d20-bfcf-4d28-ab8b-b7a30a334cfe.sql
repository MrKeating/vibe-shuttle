-- Add github_pat column to profiles for storing user's GitHub Personal Access Token
ALTER TABLE public.profiles 
ADD COLUMN github_pat text;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.github_pat IS 'GitHub Personal Access Token for API access';