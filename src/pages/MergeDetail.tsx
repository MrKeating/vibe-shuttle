import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, GitBranch, FolderTree, Layers, RefreshCw, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface BridgeDetail {
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

const MergeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bridge, setBridge] = useState<BridgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchBridge = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("bridges")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        navigate("/dashboard");
        return;
      }

      setBridge(data as BridgeDetail);
      setIsLoading(false);
    };

    if (isAuthenticated) {
      fetchBridge();
    }
  }, [id, isAuthenticated, navigate]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isFolderMode = bridge?.merge_mode === "folder" || bridge?.platforms?.includes("folder-sync");

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : bridge ? (
          <div className="space-y-8">
            {/* Title Section */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                {isFolderMode ? (
                  <FolderTree className="w-7 h-7 text-primary" />
                ) : (
                  <Layers className="w-7 h-7 text-primary" />
                )}
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold mb-1">{bridge.repo_name}</h1>
                <p className="text-muted-foreground">
                  {isFolderMode ? "Folder Mode Sync" : "Standard Merge"}
                </p>
              </div>
            </div>

            {/* Repository Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Source Repository */}
              {(bridge.source_repo_url || isFolderMode) && (
                <div className="glass p-6 rounded-xl border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Source Repository</span>
                      <h3 className="font-semibold">{bridge.source_repo_name || "AI Studio Export"}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isFolderMode 
                      ? "Files from this repo are synced into the target's subfolder."
                      : "Files from this repo were merged into the target."
                    }
                  </p>
                  {bridge.source_repo_url ? (
                    <a
                      href={bridge.source_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      View on GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Source URL not stored (older merge)
                    </span>
                  )}
                </div>
              )}

              {/* Target / Merged Repository */}
              <div className="glass p-6 rounded-xl border border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {isFolderMode ? "Target (Canonical) Repository" : "Merged Repository"}
                    </span>
                    <h3 className="font-semibold">{bridge.repo_name}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {isFolderMode 
                    ? `This is your main Lovable repo. Source files live in /${bridge.folder_prefix || "ai-studio"}/`
                    : "The combined output of both repositories."
                  }
                </p>
                <a
                  href={bridge.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Folder Mode Info */}
            {isFolderMode && bridge.folder_prefix && (
              <div className="glass p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" />
                  Folder Structure
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm">
                  <div className="text-muted-foreground">your-lovable-repo/</div>
                  <div className="ml-4">├── src/</div>
                  <div className="ml-4">├── public/</div>
                  <div className="ml-4 text-primary font-semibold">└── {bridge.folder_prefix}/  ← AI Studio code</div>
                  <div className="ml-8 text-muted-foreground">├── ...</div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="glass p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-4">Details</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Merge Mode</span>
                  <Badge variant="secondary">
                    {isFolderMode ? "Folder Mode" : "Standard"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <Badge variant="outline" className="capitalize">{bridge.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Created</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(bridge.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Last Updated</span>
                  <span>{new Date(bridge.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isFolderMode && (
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={() => navigate("/merge")}>
                  <RefreshCw className="w-4 h-4" />
                  Re-sync Source Repo
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MergeDetail;