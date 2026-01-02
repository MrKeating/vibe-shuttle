-- Drop existing tables to rebuild with new 3-repo bridge schema
DROP TABLE IF EXISTS sync_history CASCADE;
DROP TABLE IF EXISTS bridges CASCADE;

-- Auth connections table (GitHub App or PAT)
CREATE TABLE public.auth_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('github_app', 'pat')),
  encrypted_pat TEXT, -- Only for PAT type
  github_installation_id BIGINT, -- Only for GitHub App type
  github_username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auth connections"
  ON public.auth_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own auth connections"
  ON public.auth_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auth connections"
  ON public.auth_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auth connections"
  ON public.auth_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Bridges table (3-repo model: canonical + lovable + ai-studio)
CREATE TABLE public.bridges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_connection_id UUID REFERENCES public.auth_connections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  -- Canonical repo (source of truth)
  canonical_repo TEXT NOT NULL, -- owner/repo format
  canonical_branch TEXT NOT NULL DEFAULT 'main',
  -- Lovable platform repo
  lovable_repo TEXT NOT NULL,
  lovable_branch TEXT NOT NULL DEFAULT 'main',
  lovable_prefix TEXT NOT NULL DEFAULT 'lovable',
  -- AI Studio platform repo
  aistudio_repo TEXT NOT NULL,
  aistudio_branch TEXT NOT NULL DEFAULT 'main',
  aistudio_prefix TEXT NOT NULL DEFAULT 'ai-studio',
  -- Settings
  squash_policy BOOLEAN NOT NULL DEFAULT true,
  auto_merge BOOLEAN NOT NULL DEFAULT false,
  setup_complete BOOLEAN NOT NULL DEFAULT false,
  setup_pr_url TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bridges"
  ON public.bridges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bridges"
  ON public.bridges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bridges"
  ON public.bridges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bridges"
  ON public.bridges FOR DELETE
  USING (auth.uid() = user_id);

-- Sync runs table
CREATE TABLE public.sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bridge_id UUID NOT NULL REFERENCES public.bridges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('SETUP', 'INBOUND', 'OUTBOUND')),
  source_repo TEXT NOT NULL,
  dest_repo TEXT NOT NULL,
  trigger_commit_sha TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'conflict', 'error')),
  pr_url TEXT,
  pr_number INTEGER,
  log_excerpt TEXT,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync runs"
  ON public.sync_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync runs"
  ON public.sync_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync runs"
  ON public.sync_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Webhook deliveries (for deduplication)
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bridge_id UUID REFERENCES public.bridges(id) ON DELETE CASCADE,
  repo TEXT NOT NULL,
  delivery_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook deliveries for their bridges"
  ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bridges b 
    WHERE b.id = webhook_deliveries.bridge_id 
    AND b.user_id = auth.uid()
  ));

-- Repo state (last processed SHA per repo per bridge)
CREATE TABLE public.repo_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bridge_id UUID NOT NULL REFERENCES public.bridges(id) ON DELETE CASCADE,
  repo TEXT NOT NULL,
  last_processed_sha TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bridge_id, repo)
);

ALTER TABLE public.repo_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view repo state for their bridges"
  ON public.repo_state FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bridges b 
    WHERE b.id = repo_state.bridge_id 
    AND b.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage repo state"
  ON public.repo_state FOR ALL
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_auth_connections_updated_at
  BEFORE UPDATE ON public.auth_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bridges_updated_at
  BEFORE UPDATE ON public.bridges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repo_state_updated_at
  BEFORE UPDATE ON public.repo_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_sync_runs_bridge_id ON public.sync_runs(bridge_id);
CREATE INDEX idx_sync_runs_status ON public.sync_runs(status);
CREATE INDEX idx_webhook_deliveries_delivery_id ON public.webhook_deliveries(delivery_id);
CREATE INDEX idx_repo_state_bridge_repo ON public.repo_state(bridge_id, repo);