import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface AuthConnection {
  id: string;
  user_id: string;
  type: "github_app" | "pat";
  github_username: string | null;
  avatar_url: string | null;
  github_installation_id: number | null;
  created_at: string;
  updated_at: string;
}

export const useAuthConnection = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<AuthConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnection = async () => {
    if (!user) {
      setConnection(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("auth_connections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setConnection(data as AuthConnection);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchConnection();
  }, [user]);

  const savePatConnection = async (pat: string, username: string, avatarUrl: string) => {
    if (!user) throw new Error("Not authenticated");

    // Delete existing connections first
    await supabase
      .from("auth_connections")
      .delete()
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("auth_connections")
      .insert({
        user_id: user.id,
        type: "pat",
        encrypted_pat: pat, // In production, encrypt this server-side
        github_username: username,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;
    setConnection(data as AuthConnection);
    return data as AuthConnection;
  };

  const saveGitHubAppConnection = async (installationId: number, username: string, avatarUrl: string) => {
    if (!user) throw new Error("Not authenticated");

    // Delete existing connections first
    await supabase
      .from("auth_connections")
      .delete()
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("auth_connections")
      .insert({
        user_id: user.id,
        type: "github_app",
        github_installation_id: installationId,
        github_username: username,
        avatar_url: avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;
    setConnection(data as AuthConnection);
    return data as AuthConnection;
  };

  const disconnect = async () => {
    if (!user) return;

    await supabase
      .from("auth_connections")
      .delete()
      .eq("user_id", user.id);

    setConnection(null);
  };

  return {
    connection,
    isLoading,
    isConnected: !!connection,
    savePatConnection,
    saveGitHubAppConnection,
    disconnect,
    refreshConnection: fetchConnection,
  };
};
