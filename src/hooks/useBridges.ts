import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

// Mock bridges for development
const MOCK_BRIDGES: Bridge[] = [
  {
    id: "bridge-1",
    github_repo_url: "https://github.com/demo-user/my-awesome-app",
    repo_name: "my-awesome-app",
    platforms: ["lovable", "cursor", "bolt"],
    status: "active",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    config_created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useBridges = () => {
  const { user } = useAuth();
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Mock fetch - in production this would use Supabase
      setIsLoading(true);
      setTimeout(() => {
        setBridges(MOCK_BRIDGES);
        setIsLoading(false);
      }, 500);
    } else {
      setBridges([]);
      setIsLoading(false);
    }
  }, [user]);

  const createBridge = async (data: {
    github_repo_url: string;
    repo_name: string;
    platforms: string[];
  }) => {
    // Mock create - in production this would use Supabase
    const newBridge: Bridge = {
      id: `bridge-${Date.now()}`,
      ...data,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      config_created_at: null,
    };
    setBridges((prev) => [...prev, newBridge]);
    return newBridge;
  };

  const deleteBridge = async (id: string) => {
    // Mock delete - in production this would use Supabase
    setBridges((prev) => prev.filter((b) => b.id !== id));
  };

  const canCreateBridge = user?.is_paid || bridges.length < 1;

  return {
    bridges,
    isLoading,
    createBridge,
    deleteBridge,
    canCreateBridge,
    bridgeLimit: user?.is_paid ? Infinity : 1,
  };
};
