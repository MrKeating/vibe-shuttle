-- Create sync_history table to track pull/push operations
CREATE TABLE public.sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bridge_id UUID NOT NULL REFERENCES public.bridges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('pull', 'push')),
  source_branch TEXT DEFAULT 'main',
  target_branch TEXT DEFAULT 'main',
  files_count INTEGER NOT NULL DEFAULT 0,
  commit_sha TEXT,
  commit_message TEXT,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own sync history"
ON public.sync_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync history"
ON public.sync_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_sync_history_bridge_id ON public.sync_history(bridge_id);
CREATE INDEX idx_sync_history_created_at ON public.sync_history(created_at DESC);