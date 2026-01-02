import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Bridge {
  id: string;
  user_id: string;
  auth_connection_id: string | null;
  name: string;
  // Canonical repo (source of truth)
  canonical_repo: string;
  canonical_branch: string;
  // Lovable platform repo
  lovable_repo: string;
  lovable_branch: string;
  lovable_prefix: string;
  // AI Studio platform repo
  aistudio_repo: string;
  aistudio_branch: string;
  aistudio_prefix: string;
  // Settings
  squash_policy: boolean;
  auto_merge: boolean;
  setup_complete: boolean;
  setup_pr_url: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  bridge_id: string;
  direction: "SETUP" | "INBOUND" | "OUTBOUND";
  source_repo: string;
  dest_repo: string;
  trigger_commit_sha: string | null;
  status: "queued" | "running" | "success" | "conflict" | "error";
  pr_url: string | null;
  pr_number: number | null;
  log_excerpt: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export const useBridges = () => {
  const { user, profile } = useAuth();
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBridges = async () => {
    if (!user) {
      setBridges([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("bridges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBridges(data as Bridge[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBridges();
  }, [user]);

  const createBridge = async (data: {
    name: string;
    canonical_repo: string;
    canonical_branch?: string;
    lovable_repo: string;
    lovable_branch?: string;
    lovable_prefix?: string;
    aistudio_repo: string;
    aistudio_branch?: string;
    aistudio_prefix?: string;
    squash_policy?: boolean;
    auto_merge?: boolean;
    auth_connection_id?: string;
  }) => {
    if (!user) throw new Error("Not authenticated");

    const { data: newBridge, error } = await supabase
      .from("bridges")
      .insert({
        user_id: user.id,
        auth_connection_id: data.auth_connection_id || null,
        name: data.name,
        canonical_repo: data.canonical_repo,
        canonical_branch: data.canonical_branch || "main",
        lovable_repo: data.lovable_repo,
        lovable_branch: data.lovable_branch || "main",
        lovable_prefix: data.lovable_prefix || "lovable",
        aistudio_repo: data.aistudio_repo,
        aistudio_branch: data.aistudio_branch || "main",
        aistudio_prefix: data.aistudio_prefix || "ai-studio",
        squash_policy: data.squash_policy ?? true,
        auto_merge: data.auto_merge ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    setBridges((prev) => [newBridge as Bridge, ...prev]);
    return newBridge as Bridge;
  };

  const updateBridge = async (id: string, updates: Partial<Bridge>) => {
    const { data, error } = await supabase
      .from("bridges")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    setBridges((prev) =>
      prev.map((b) => (b.id === id ? (data as Bridge) : b))
    );
    return data as Bridge;
  };

  const deleteBridge = async (id: string) => {
    const { error } = await supabase.from("bridges").delete().eq("id", id);
    if (error) throw error;
    setBridges((prev) => prev.filter((b) => b.id !== id));
  };

  const getSyncRuns = async (bridgeId: string): Promise<SyncRun[]> => {
    const { data, error } = await supabase
      .from("sync_runs")
      .select("*")
      .eq("bridge_id", bridgeId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []) as SyncRun[];
  };

  const canCreateBridge = profile?.is_paid || bridges.length < 1;

  return {
    bridges,
    isLoading,
    createBridge,
    updateBridge,
    deleteBridge,
    getSyncRuns,
    refreshBridges: fetchBridges,
    canCreateBridge,
    bridgeLimit: profile?.is_paid ? Infinity : 1,
  };
};
