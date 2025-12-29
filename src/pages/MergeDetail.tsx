import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, GitBranch, FolderTree, Layers, RefreshCw, Calendar, Loader2, Download, FileText, Eye, Upload, History, ChevronDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface SyncHistoryEntry {
  id: string;
  operation: "pull" | "push";
  source_branch: string;
  target_branch: string;
  files_count: number;
  commit_sha: string | null;
  status: string;
  created_at: string;
}

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

const MergeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [bridge, setBridge] = useState<BridgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPushPreview, setShowPushPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [pushPreviewFiles, setPushPreviewFiles] = useState<PreviewFile[]>([]);
  const { getRepoTree, getFileContent } = useMerge();
  const { toast } = useToast();

  // Branch state
  const [sourceBranches, setSourceBranches] = useState<Branch[]>([]);
  const [targetBranches, setTargetBranches] = useState<Branch[]>([]);
  const [selectedSourceBranch, setSelectedSourceBranch] = useState<string>("main");
  const [selectedTargetBranch, setSelectedTargetBranch] = useState<string>("main");
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Sync history
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  // Fetch branches when bridge is loaded
  useEffect(() => {
    if (!bridge) return;
    fetchBranches();
    fetchSyncHistory();
  }, [bridge]);

  const getRepoInfo = (url: string) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const fetchBranches = async () => {
    if (!bridge) return;
    setIsLoadingBranches(true);

    try {
      // Fetch source repo branches
      if (bridge.source_repo_url) {
        const sourceInfo = getRepoInfo(bridge.source_repo_url);
        if (sourceInfo) {
          const { data } = await supabase.functions.invoke("github-api", {
            body: { action: "get-branches", owner: sourceInfo.owner, repo: sourceInfo.repo },
          });
          if (data && Array.isArray(data)) {
            setSourceBranches(data);
            if (data.length > 0 && !data.find((b: Branch) => b.name === selectedSourceBranch)) {
              setSelectedSourceBranch(data[0].name);
            }
          }
        }
      }

      // Fetch target repo branches
      const targetInfo = getRepoInfo(bridge.github_repo_url);
      if (targetInfo) {
        const { data } = await supabase.functions.invoke("github-api", {
          body: { action: "get-branches", owner: targetInfo.owner, repo: targetInfo.repo },
        });
        if (data && Array.isArray(data)) {
          setTargetBranches(data);
          if (data.length > 0 && !data.find((b: Branch) => b.name === selectedTargetBranch)) {
            setSelectedTargetBranch(data[0].name);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchSyncHistory = async () => {
    if (!bridge) return;
    setIsLoadingHistory(true);

    try {
      const { data, error } = await supabase
        .from("sync_history")
        .select("*")
        .eq("bridge_id", bridge.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setSyncHistory(data as SyncHistoryEntry[]);
      }
    } catch (error) {
      console.error("Error fetching sync history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const logSyncOperation = async (
    operation: "pull" | "push",
    filesCount: number,
    commitSha: string | null,
    status: "success" | "failed",
    errorMessage?: string
  ) => {
    if (!bridge || !user) return;

    try {
      await supabase.from("sync_history").insert({
        bridge_id: bridge.id,
        user_id: user.id,
        operation,
        source_branch: selectedSourceBranch,
        target_branch: selectedTargetBranch,
        files_count: filesCount,
        commit_sha: commitSha,
        commit_message: operation === "pull" 
          ? `Pull from source into /${bridge.folder_prefix || "ai-studio"}/`
          : `Push from /${bridge.folder_prefix || "ai-studio"}/ to source`,
        status,
        error_message: errorMessage,
      });
      
      fetchSyncHistory();
    } catch (error) {
      console.error("Error logging sync operation:", error);
    }
  };

  const handlePreviewPull = async () => {
    if (!bridge?.source_repo_url) return;

    setIsLoadingPreview(true);
    try {
      const sourceInfo = getRepoInfo(bridge.source_repo_url);
      if (!sourceInfo) throw new Error("Invalid source repo URL");

      const folderPrefix = bridge.folder_prefix || (isFolderMode ? "ai-studio" : "");

      const sourceTree = await getRepoTree(sourceInfo.owner, sourceInfo.repo, selectedSourceBranch);
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

  const handlePreviewPush = async () => {
    if (!bridge?.source_repo_url || !bridge?.folder_prefix) return;

    setIsLoadingPreview(true);
    try {
      const targetInfo = getRepoInfo(bridge.github_repo_url);
      if (!targetInfo) throw new Error("Invalid target repo URL");

      const folderPrefix = bridge.folder_prefix;
      const prefixWithSlash = folderPrefix.endsWith("/") ? folderPrefix : `${folderPrefix}/`;

      const targetTree = await getRepoTree(targetInfo.owner, targetInfo.repo, selectedTargetBranch);
      const folderFiles = targetTree.filter(
        (f) => f.type === "blob" && f.path.startsWith(prefixWithSlash)
      );

      if (folderFiles.length === 0) {
        toast({
          title: "No Files",
          description: `No files found in /${folderPrefix}/ folder.`,
          variant: "destructive",
        });
        return;
      }

      const files: PreviewFile[] = folderFiles.map((f) => ({
        path: f.path,
        targetPath: f.path.slice(prefixWithSlash.length),
        size: f.size,
      }));

      setPushPreviewFiles(files);
      setShowPushPreview(true);
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
        const result = await getFileContent(sourceInfo.owner, sourceInfo.repo, file.path, selectedSourceBranch);
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
        await logSyncOperation("pull", 0, null, "failed", "No content fetched");
        return;
      }

      // Push to target repo
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: {
          action: "push-files",
          owner: targetInfo.owner,
          repo: targetInfo.repo,
          files: filesToPush,
          message: `git subtree pull: ${sourceInfo.owner}/${sourceInfo.repo}:${selectedSourceBranch} → /${folderPrefix}/`,
          branch: selectedTargetBranch,
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

      await logSyncOperation("pull", filesToPush.length, data?.commit_sha, "success");

      toast({
        title: "Pull Complete",
        description: `Synced ${filesToPush.length} files into /${folderPrefix}/`,
      });
    } catch (error: any) {
      await logSyncOperation("pull", 0, null, "failed", error.message);
      toast({
        title: "Pull Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleConfirmPush = async () => {
    if (!bridge?.source_repo_url || !bridge?.github_repo_url || !bridge?.folder_prefix) return;

    setShowPushPreview(false);
    setIsPushing(true);
    try {
      const sourceInfo = getRepoInfo(bridge.source_repo_url);
      const targetInfo = getRepoInfo(bridge.github_repo_url);
      if (!sourceInfo || !targetInfo) throw new Error("Invalid repo URLs");

      const { data, error } = await supabase.functions.invoke("github-api", {
        body: {
          action: "push-folder-to-source",
          sourceOwner: sourceInfo.owner,
          sourceRepo: sourceInfo.repo,
          targetOwner: targetInfo.owner,
          targetRepo: targetInfo.repo,
          folderPrefix: bridge.folder_prefix,
          message: `git subtree split: /${bridge.folder_prefix}/ → ${sourceInfo.owner}/${sourceInfo.repo}`,
          sourceBranch: selectedSourceBranch,
          targetBranch: selectedTargetBranch,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      await logSyncOperation("push", data?.files_count || pushPreviewFiles.length, data?.commit_sha, "success");

      toast({
        title: "Push Complete",
        description: `Pushed ${data?.files_count || pushPreviewFiles.length} files to ${sourceInfo.owner}/${sourceInfo.repo}`,
      });
    } catch (error: any) {
      await logSyncOperation("push", 0, null, "failed", error.message);
      toast({
        title: "Push Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsPushing(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isFolderMode = bridge?.merge_mode === "folder" || bridge?.platforms?.includes("folder-sync");
  const canPull = bridge?.source_repo_url;
  const canPush = bridge?.source_repo_url && bridge?.folder_prefix;

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
                  {isFolderMode ? "Folder Mode Sync (git subtree)" : "Standard Merge"}
                </p>
              </div>
            </div>

            {/* Branch Selection */}
            {canPull && (
              <div className="glass p-6 rounded-xl border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  Branch Selection
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Source Branch (AI Studio)</label>
                    <Select value={selectedSourceBranch} onValueChange={setSelectedSourceBranch} disabled={isLoadingBranches}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceBranches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name} {branch.protected && "(protected)"}
                          </SelectItem>
                        ))}
                        {sourceBranches.length === 0 && (
                          <SelectItem value="main">main</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Target Branch (Lovable)</label>
                    <Select value={selectedTargetBranch} onValueChange={setSelectedTargetBranch} disabled={isLoadingBranches}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetBranches.map((branch) => (
                          <SelectItem key={branch.name} value={branch.name}>
                            {branch.name} {branch.protected && "(protected)"}
                          </SelectItem>
                        ))}
                        {targetBranches.length === 0 && (
                          <SelectItem value="main">main</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

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

            {/* Sync Actions */}
            <div className="glass p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Sync Operations
              </h3>
              <div className="flex flex-wrap gap-3">
                {canPull && (
                  <Button 
                    className="gap-2" 
                    onClick={handlePreviewPull}
                    disabled={isPulling || isPushing || isLoadingPreview}
                  >
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isLoadingPreview ? "Loading..." : "Pull Latest"}
                  </Button>
                )}
                {canPush && (
                  <Button 
                    variant="outline"
                    className="gap-2" 
                    onClick={handlePreviewPush}
                    disabled={isPulling || isPushing || isLoadingPreview}
                  >
                    {isLoadingPreview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Push to Source
                  </Button>
                )}
                <Button variant="ghost" className="gap-2" onClick={() => navigate("/merge")}>
                  <RefreshCw className="w-4 h-4" />
                  New Merge
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Pull:</strong> Fetch files from source repo → write to /{bridge?.folder_prefix || "ai-studio"}/ (git subtree pull)
                <br />
                <strong>Push:</strong> Export files from /{bridge?.folder_prefix || "ai-studio"}/ → push to source repo (git subtree split)
              </p>
            </div>

            {/* Sync History */}
            <div className="glass p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Sync History
              </h3>
              {isLoadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : syncHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sync operations yet.</p>
              ) : (
                <div className="space-y-2">
                  {syncHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {entry.operation === "pull" ? (
                          <Download className="w-4 h-4 text-green-500" />
                        ) : (
                          <Upload className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="capitalize font-medium">{entry.operation}</span>
                        <Badge variant={entry.status === "success" ? "default" : "destructive"} className="text-xs">
                          {entry.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {entry.files_count} files
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        {entry.commit_sha && (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {entry.commit_sha.slice(0, 7)}
                          </code>
                        )}
                        <span className="text-xs">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
          </div>
        ) : null}
      </main>

      {/* Pull Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Pull Files from Source
            </DialogTitle>
            <DialogDescription>
              {previewFiles.length} files will be synced from <strong>{selectedSourceBranch}</strong> branch
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

      {/* Push Preview Dialog */}
      <Dialog open={showPushPreview} onOpenChange={setShowPushPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Push Files to Source
            </DialogTitle>
            <DialogDescription>
              {pushPreviewFiles.length} files from <strong>/{bridge?.folder_prefix}/</strong> will be pushed to the source repo's <strong>{selectedSourceBranch}</strong> branch
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] rounded-lg border border-border">
            <div className="p-4 space-y-1">
              {pushPreviewFiles.map((file, index) => (
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
            <Button variant="outline" onClick={() => setShowPushPreview(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPush} disabled={isPushing} className="gap-2">
              {isPushing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isPushing ? "Pushing..." : `Push ${pushPreviewFiles.length} Files`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MergeDetail;