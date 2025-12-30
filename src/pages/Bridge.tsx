import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSync, Loader2, ArrowRight, ArrowLeft, ExternalLink, Eye, Undo2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepoPicker } from "@/components/dashboard/RepoPicker";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMerge, type GitHubRepo } from "@/hooks/useMerge";
import { useBridges } from "@/hooks/useBridges";
import { detectPlatform, getOriginPlatformUrl } from "@/lib/platformDetection";

type Step = "select-repos" | "configure-folder" | "syncing";

const Merge = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-repos");
  const [sourceRepo, setSourceRepo] = useState<GitHubRepo | null>(null);
  const [targetRepo, setTargetRepo] = useState<GitHubRepo | null>(null);
  const [folderPrefix, setFolderPrefix] = useState("src/ai-studio");
  const [mergedRepo, setMergedRepo] = useState<GitHubRepo | null>(null);
  const { toast } = useToast();
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, getFileContent, getRepoTree } = useMerge();
  const { createBridge } = useBridges();

  const hasToken = !!profile?.github_pat;

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate("/auth");
    return null;
  }

  if (authLoading) {
    return null;
  }

  const handleFolderModeNext = () => {
    if (sourceRepo && targetRepo) {
      setStep("configure-folder");
    }
  };

  // Folder Mode sync - get all source files, prefix with folder, push to target
  const handleFolderModeSync = async () => {
    if (!sourceRepo || !targetRepo) return;

    setStep("syncing");

    try {
      const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
      const [targetOwner, targetRepoName] = targetRepo.full_name.split("/");

      // Get all files from source repo
      const sourceTree = await getRepoTree(sourceOwner, sourceRepoName);
      const sourceFiles = sourceTree.filter(f => f.type === "blob");

      if (sourceFiles.length === 0) {
        toast({
          title: "No files to import",
          description: "The source repository appears to be empty.",
          variant: "destructive",
        });
        setStep("configure-folder");
        return;
      }

      // Fetch content for all source files and prefix paths
      const filesToPush: { path: string; content: string }[] = [];
      const prefix = folderPrefix.replace(/^\/+|\/+$/g, ""); // trim slashes

      for (const file of sourceFiles) {
        const result = await getFileContent(sourceOwner, sourceRepoName, file.path);
        if (result.content) {
          filesToPush.push({
            path: `${prefix}/${file.path}`,
            content: result.content,
          });
        }
      }

      console.log("Folder sync - files to push:", filesToPush.length, filesToPush.map(f => f.path));

      // Push to target repo via edge function
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: {
          action: "push-files",
          owner: targetOwner,
          repo: targetRepoName,
          files: filesToPush,
          message: `VibeBridge: import from ${sourceRepo.full_name}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setMergedRepo(targetRepo);

      await createBridge({
        github_repo_url: targetRepo.html_url,
        repo_name: targetRepo.name,
        platforms: ["folder-sync"],
        source_repo_url: sourceRepo.html_url,
        source_repo_name: sourceRepo.full_name,
        merge_mode: "folder",
        folder_prefix: prefix,
      });

      toast({
        title: "Sync Complete!",
        description: `Imported ${filesToPush.length} files into ${targetRepo.full_name}/${prefix}/`,
      });
    } catch (e: any) {
      toast({
        title: "Sync Failed",
        description: e.message,
        variant: "destructive",
      });
      setStep("configure-folder");
    }
  };

  const stepLabels: Record<Step, string> = {
    "select-repos": "Select Repositories",
    "configure-folder": "Configure Folder",
    "syncing": mergedRepo ? "Complete" : "Syncing...",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UserHeader />

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        {/* Header with back button and step indicator */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderSync className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{stepLabels[step]}</span>
          </div>
        </div>

        {/* Step: Select Repos */}
        {step === "select-repos" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Link Two Repositories</h1>
              <p className="text-muted-foreground">
                Choose the source repo (e.g. AI Studio) and target repo (e.g. Lovable) to sync.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 flex-1">
              {/* Source Repo */}
              <div className="glass p-6 rounded-xl">
                <Label className="mb-2 block text-lg font-semibold">
                  Source Repository
                  {sourceRepo && (
                    <span className="ml-2 text-primary font-normal text-base">
                      — {sourceRepo.full_name}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  The repo to import from (e.g., AI Studio export)
                </p>
                <RepoPicker
                  hasToken={hasToken}
                  onSelectRepo={setSourceRepo}
                  selectedRepoId={sourceRepo?.id ?? null}
                />
              </div>

              {/* Target Repo */}
              <div className="glass p-6 rounded-xl">
                <Label className="mb-2 block text-lg font-semibold">
                  Target Repository
                  {targetRepo && (
                    <span className="ml-2 text-primary font-normal text-base">
                      — {targetRepo.full_name}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  The canonical repo (e.g., Lovable project)
                </p>
                <RepoPicker
                  hasToken={hasToken}
                  onSelectRepo={setTargetRepo}
                  selectedRepoId={targetRepo?.id ?? null}
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button
                variant="glow"
                onClick={handleFolderModeNext}
                disabled={!sourceRepo || !targetRepo}
              >
                Configure Folder
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Configure Folder */}
        {step === "configure-folder" && sourceRepo && targetRepo && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Configure Folder Path</h1>
              <p className="text-muted-foreground">
                All files from <span className="font-medium text-primary">{sourceRepo.full_name}</span> will be 
                imported into <span className="font-medium text-primary">{targetRepo.full_name}</span> under a subfolder.
              </p>
            </div>

            <div className="glass p-6 rounded-xl space-y-6 max-w-2xl">
              <div>
                <Label htmlFor="folder-prefix" className="text-base font-semibold">
                  Target Folder Path
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Source files will be placed in this folder inside the target repo
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
                  <Input
                    id="folder-prefix"
                    value={folderPrefix}
                    onChange={(e) => setFolderPrefix(e.target.value.replace(/^\/+/, ""))}
                    placeholder="src/ai-studio"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">/</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium mb-2">Preview</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {targetRepo.full_name}/<span className="text-primary">{folderPrefix || "src/ai-studio"}</span>/
                  <span className="text-foreground">*</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This will not overwrite existing files outside this folder
                </p>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-medium text-amber-600 mb-1">Note</h4>
                <p className="text-sm text-muted-foreground">
                  If files already exist at this path, they will be updated. This is similar to 
                  running <code className="text-xs bg-muted px-1 rounded">git subtree pull</code>.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setStep("select-repos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="glow"
                onClick={handleFolderModeSync}
                disabled={!folderPrefix || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <FolderTree className="w-4 h-4 mr-2" />
                    Import to Folder
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Syncing / Complete */}
        {step === "syncing" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {mergedRepo ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <FolderSync className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-2">Sync Complete!</h2>
                <p className="text-muted-foreground mb-8">
                  Files imported into{" "}
                  <span className="font-mono text-primary">
                    {mergedRepo.full_name}/{folderPrefix}/
                  </span>
                </p>
                
                {/* Check if target has known origin platform */}
                {(() => {
                  const originUrl = getOriginPlatformUrl(mergedRepo.html_url, mergedRepo.description);
                  const platform = detectPlatform(mergedRepo.html_url, mergedRepo.description);
                  
                  if (originUrl && platform) {
                    return (
                      <div className="mb-6 p-4 rounded-xl border border-border bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-3">
                          This repo originated from <span className="font-medium" style={{ color: platform.color }}>{platform.name}</span>
                        </p>
                        <Button
                          variant="glow"
                          onClick={() => window.open(originUrl, "_blank")}
                        >
                          <Undo2 className="w-4 h-4 mr-2" />
                          Return to {platform.name}
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => window.open(mergedRepo.html_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/view-project?repo=${encodeURIComponent(mergedRepo.full_name)}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Project
                  </Button>
                  <Button variant="glow" onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                <h2 className="font-heading text-2xl font-bold">Syncing Files...</h2>
                <p className="text-muted-foreground mt-2">
                  This may take a moment
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Merge;
