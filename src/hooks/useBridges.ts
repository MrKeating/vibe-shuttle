import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Bridge {
  id: string;
  github_repo_url: string;
  repo_name: string;
  platforms: string[];
  status: string;
  created_at: string;
  updated_at: string;
  config_created_at: string | null;
  source_repo_url: string | null;
  source_repo_name: string | null;
  merge_mode: string | null;
  folder_prefix: string | null;
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
      setBridges(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBridges();
  }, [user]);

  const createBridge = async (data: {
    github_repo_url: string;
    repo_name: string;
    platforms: string[];
    source_repo_url?: string;
    source_repo_name?: string;
    merge_mode?: string;
    folder_prefix?: string;
  }) => {
    if (!user) throw new Error("Not authenticated");

    const { data: newBridge, error } = await supabase
      .from("bridges")
      .insert({
        user_id: user.id,
        github_repo_url: data.github_repo_url,
        repo_name: data.repo_name,
        platforms: data.platforms,
        config_created_at: new Date().toISOString(),
        source_repo_url: data.source_repo_url || null,
        source_repo_name: data.source_repo_name || null,
        merge_mode: data.merge_mode || "standard",
        folder_prefix: data.folder_prefix || null,
      })
      .select()
      .single();

    if (error) throw error;
    
    setBridges((prev) => [newBridge, ...prev]);
    return newBridge;
  };

  const deleteBridge = async (id: string) => {
    // Find the bridge to get folder info
    const bridge = bridges.find((b) => b.id === id);
    
    // If this is a folder-mode bridge with a folder_prefix, delete the folder files first
    if (bridge?.folder_prefix && bridge?.github_repo_url) {
      try {
        // Extract owner/repo from github_repo_url
        const match = bridge.github_repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const [, owner, repo] = match;
          const repoName = repo.replace(/\.git$/, "");
          
          console.log("Deleting folder from repo:", { owner, repo: repoName, folder: bridge.folder_prefix });
          
          const { error: deleteError } = await supabase.functions.invoke("github-api", {
            body: {
              action: "delete-folder",
              owner,
              repo: repoName,
              folderPrefix: bridge.folder_prefix,
              message: `VibeBridge: remove synced folder /${bridge.folder_prefix}/`,
            },
          });
          
          if (deleteError) {
            console.error("Failed to delete folder:", deleteError);
            // Continue with bridge deletion even if folder deletion fails
          }
        }
      } catch (error) {
        console.error("Error deleting folder:", error);
        // Continue with bridge deletion even if folder deletion fails
      }
    }
    
    const { error } = await supabase.from("bridges").delete().eq("id", id);
    if (error) throw error;
    setBridges((prev) => prev.filter((b) => b.id !== id));
  };

  const canCreateBridge = profile?.is_paid || bridges.length < 1;

  return {
    bridges,
    isLoading,
    createBridge,
    deleteBridge,
    canCreateBridge,
    bridgeLimit: profile?.is_paid ? Infinity : 1,
  };
};
