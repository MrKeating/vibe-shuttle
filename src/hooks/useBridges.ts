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
      })
      .select()
      .single();

    if (error) throw error;
    
    setBridges((prev) => [newBridge, ...prev]);
    return newBridge;
  };

  const deleteBridge = async (id: string) => {
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
