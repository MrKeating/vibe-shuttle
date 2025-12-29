import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, GitBranch, FolderTree, Layers, RefreshCw, Calendar, Loader2, Download, FileText, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMerge, FileTreeItem } from "@/hooks/useMerge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface PreviewFile {
  path: string;
  targetPath: string;
  size?: number;
}

const MergeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [bridge, setBridge] = useState<BridgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const { getRepoTree, getFileContent } = useMerge();
  const { toast } = useToast();

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

  const getRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const handlePreviewPull = async () => {
    if (!bridge?.source_repo_url) return;

    setIsLoadingPreview(true);
    try {
      const sourceInfo = getRepoInfo(bridge.source_repo_url);
      if (!sourceInfo) throw new Error("Invalid source repo URL");

      const folderPrefix = bridge.folder_prefix || (isFolderMode ? "ai-studio" : "");

      const sourceTree = await getRepoTree(sourceInfo.owner, sourceInfo.repo);
      const sourceFiles = sourceTree.filter((f) => f.type === "blob");

      if (sourceFiles.length === 0) {
        toast({
          title: "No Files",
          description: "Source repository is empty.",
          variant: "destructive",
        });
        return;
      }

      const files: PreviewFile[] = sourceFiles.map((f) => ({
        path: f.path,
        targetPath: folderPrefix ? `${folderPrefix}/${f.path}` : f.path,
        size: f.size,
      }));

      setPreviewFiles(files);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmPull = async () => {
    if (!bridge?.source_repo_url || !bridge?.github_repo_url) return;

    setShowPreview(false);
    setIsPulling(true);
    try {
      const sourceInfo = getRepoInfo(bridge.source_repo_url);
      const targetInfo = getRepoInfo(bridge.github_repo_url);
      if (!sourceInfo || !targetInfo) throw new Error("Invalid repo URLs");

      const folderPrefix = bridge.folder_prefix || (isFolderMode ? "ai-studio" : "");

      // Fetch all file contents
      const filesToPush: { path: string; content: string }[] = [];
      for (const file of previewFiles) {
        const result = await getFileContent(sourceInfo.owner, sourceInfo.repo, file.path);
        if (result.exists && result.content) {
          filesToPush.push({
            path: file.targetPath,
            content: result.content,
          });
        }
      }

      if (filesToPush.length === 0) {
        toast({
          title: "No Content",
          description: "Could not fetch any file contents from source.",
          variant: "destructive",
        });
        return;
      }

      // Push to target repo
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: {
          action: "push-files",
          owner: targetInfo.owner,
          repo: targetInfo.repo,
          files: filesToPush,
          message: folderPrefix 
            ? `Pull latest from ${sourceInfo.owner}/${sourceInfo.repo} into /${folderPrefix}/`
            : `Pull latest from ${sourceInfo.owner}/${sourceInfo.repo}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Update bridge timestamp
      await supabase
        .from("bridges")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", bridge.id);

      setBridge({ ...bridge, updated_at: new Date().toISOString() });

      toast({
        title: "Pull Complete",
        description: `Synced ${filesToPush.length} files${folderPrefix ? ` into /${folderPrefix}/` : ""}`,
      });
    } catch (error: any) {
      toast({
        title: "Pull Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPulling(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isFolderMode = bridge?.merge_mode === "folder" || bridge?.platforms?.includes("folder-sync");
  const canPull = bridge?.source_repo_url;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
              {bridge.source_repo_url && (
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
                  <a
                    href={bridge.source_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    View on GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
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
            <div className="flex gap-3">
              {canPull && (
                <Button 
                  className="gap-2" 
                  onClick={handlePreviewPull}
                  disabled={isPulling || isLoadingPreview}
                >
                  {isLoadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {isLoadingPreview ? "Loading..." : "Preview & Pull Latest"}
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={() => navigate("/merge")}>
                <RefreshCw className="w-4 h-4" />
                New Merge
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Files to Pull
            </DialogTitle>
            <DialogDescription>
              {previewFiles.length} files will be synced from the source repository
              {isFolderMode && bridge?.folder_prefix && ` into /${bridge.folder_prefix}/`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] rounded-lg border border-border">
            <div className="p-4 space-y-1">
              {previewFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate font-mono text-xs">{file.targetPath}</span>
                  </div>
                  {file.size && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatFileSize(file.size)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPull} disabled={isPulling} className="gap-2">
              {isPulling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isPulling ? "Pulling..." : `Pull ${previewFiles.length} Files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MergeDetail;