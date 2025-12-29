import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

interface GitHubUser {
  valid: boolean;
  username: string;
  avatar_url: string;
}

export const useGitHub = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callGitHubApi = async (action: string, params: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: { action, ...params },
      });
      if (error) {
        const body = (error as any)?.context?.body;
        let msg: string | undefined;

        if (body) {
          try {
            const parsed = typeof body === "string" ? JSON.parse(body) : body;
            msg = parsed?.error || parsed?.message;
          } catch {
            // ignore
          }
        }

        throw new Error(msg || (error as any)?.message || "GitHub API error");
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      return data;
    } catch (error: any) {
      toast({
        title: "GitHub API Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (): Promise<GitHubUser> => {
    return await callGitHubApi("validate-token");
  };

  const listRepos = async (): Promise<GitHubRepo[]> => {
    return await callGitHubApi("list-repos");
  };

  const getRepo = async (owner: string, repo: string) => {
    return await callGitHubApi("get-repo", { owner, repo });
  };

  const createFile = async (
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string
  ) => {
    return await callGitHubApi("create-file", { owner, repo, path, content, message });
  };

  const getFile = async (owner: string, repo: string, path: string) => {
    return await callGitHubApi("get-file", { owner, repo, path });
  };

  const createVibeBridgeConfig = async (
    owner: string,
    repo: string,
    platforms: string[]
  ) => {
    const config = {
      version: "1.0",
      platforms,
      created_at: new Date().toISOString(),
      settings: {
        auto_sync: true,
        sync_interval: "on_push",
      },
    };

    return await createFile(
      owner,
      repo,
      ".vibebridge/config.json",
      JSON.stringify(config, null, 2),
      "Add VibeBridge configuration"
    );
  };

  return {
    loading,
    validateToken,
    listRepos,
    getRepo,
    createFile,
    getFile,
    createVibeBridgeConfig,
  };
};
