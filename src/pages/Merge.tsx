import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitMerge, Loader2, ArrowRight, ArrowLeft, ExternalLink, FolderPlus, Eye, Undo2, FolderTree, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RepoPicker } from "@/components/dashboard/RepoPicker";
import { DiffViewer } from "@/components/merge/DiffViewer";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMerge, type FileConflict, type GitHubRepo } from "@/hooks/useMerge";
import { useBridges } from "@/hooks/useBridges";
import { detectPlatform, getOriginPlatformUrl } from "@/lib/platformDetection";

type Step = "select-mode" | "select-repos" | "preview-diff" | "configure-output" | "configure-folder" | "merging";
type OutputType = "new-repo" | "existing-repo";
type MergeMode = "standard" | "folder";

const Merge = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-mode");
  const [mergeMode, setMergeMode] = useState<MergeMode>("folder");
  const [sourceRepo, setSourceRepo] = useState<GitHubRepo | null>(null);
  const [targetRepo, setTargetRepo] = useState<GitHubRepo | null>(null);
  const [conflicts, setConflicts] = useState<FileConflict[]>([]);
  const [outputType, setOutputType] = useState<OutputType>("new-repo");
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [destinationRepo, setDestinationRepo] = useState<GitHubRepo | null>(null);
  const [mergedRepo, setMergedRepo] = useState<GitHubRepo | null>(null);
  const [folderPrefix, setFolderPrefix] = useState("ai-studio");
  const { toast } = useToast();
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, analyzeRepos, executeMerge, getFileContent, getRepoTree } = useMerge();
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

  const handleAnalyze = async () => {
    if (!sourceRepo || !targetRepo) return;

    try {
      const result = await analyzeRepos(sourceRepo, targetRepo);
      setConflicts(result);
      setStep("preview-diff");
    } catch (e) {
      // Error already handled in hook
    }
  };

  const handleResolve = (path: string, content: string, keepSource: boolean) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.path === path
          ? { ...c, resolved: true, resolvedContent: content }
          : c
      )
    );
  };

  const handleResolveAll = (keepSource: boolean) => {
    setConflicts((prev) =>
      prev.map((c) => {
        if (c.status === "conflict") {
          return {
            ...c,
            resolved: true,
            resolvedContent: keepSource ? c.sourceContent || "" : c.targetContent || "",
          };
        }
        return c;
      })
    );
  };

  const handleProceedToOutput = () => {
    if (sourceRepo && targetRepo) {
      setNewRepoName(`${sourceRepo.name}-${targetRepo.name}-merged`);
    }
    setStep("configure-output");
  };

  // Folder Mode: skip diff, go directly to folder config
  const handleFolderModeNext = () => {
    if (sourceRepo && targetRepo) {
      setStep("configure-folder");
    }
  };

  // Folder Mode merge - get all source files, prefix with folder, push to target
  const handleFolderModeMerge = async () => {
    if (!sourceRepo || !targetRepo) return;

    setStep("merging");

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

      console.log("Folder mode - files to push:", filesToPush.length, filesToPush.map(f => f.path));

      // Push to target repo (existing repo)
      const result = await executeMerge(
        sourceRepo,
        targetRepo, // always push to existing target in folder mode
        null, // no new repo
        filesToPush,
        false
      );

      setMergedRepo(result);

      await createBridge({
        github_repo_url: result.html_url,
        repo_name: result.name,
        platforms: ["folder-sync"],
        source_repo_url: sourceRepo.html_url,
        source_repo_name: sourceRepo.full_name,
        merge_mode: "folder",
        folder_prefix: prefix,
      });

      toast({
        title: "Folder Sync Complete!",
        description: `Source repo imported into ${result.full_name}/${prefix}/`,
      });
    } catch (e) {
      setStep("configure-folder");
    }
  };

  const handleMerge = async () => {
    if (!sourceRepo || !targetRepo) return;

    setStep("merging");

    try {
      const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
      const [targetOwner, targetRepoName] = targetRepo.full_name.split("/");

      const filesToPush: { path: string; content: string }[] = [];

      // Build list of all files we need to include
      // Start with target repo's files as base, then overlay source changes
      const targetFilePaths = new Set(
        conflicts
          .filter(c => c.status === "deleted" || c.status === "conflict")
          .map(c => c.path)
      );

      // For files only in target (marked as "deleted" in our diff), keep them
      for (const conflict of conflicts) {
        if (conflict.status === "deleted") {
          // This file exists only in target - fetch from target and include it
          const result = await getFileContent(targetOwner, targetRepoName, conflict.path);
          if (result.content) {
            filesToPush.push({ path: conflict.path, content: result.content });
          }
        }
      }

      // For files in source (added, modified, or conflict)
      for (const conflict of conflicts) {
        let content: string | null = null;

        if (conflict.status === "deleted") {
          // Already handled above
          continue;
        }

        if (conflict.resolved && conflict.resolvedContent !== undefined) {
          // User manually resolved this conflict
          content = conflict.resolvedContent;
        } else if (conflict.status === "added" || conflict.status === "conflict") {
          // For added files or unresolved conflicts, use source version
          const result = await getFileContent(sourceOwner, sourceRepoName, conflict.path);
          content = result.content || "";
        }

        if (content !== null && content !== "") {
          filesToPush.push({ path: conflict.path, content });
        }
      }

      if (filesToPush.length === 0) {
        toast({
          title: "Nothing to merge",
          description: "No files found to merge. Both repositories may be empty or identical.",
          variant: "destructive",
        });
        setStep("configure-output");
        return;
      }

      console.log("Files to push:", filesToPush.length, filesToPush.map(f => f.path));

      const result = await executeMerge(
        sourceRepo,
        outputType === "existing-repo" ? destinationRepo : null,
        outputType === "new-repo" ? newRepoName : null,
        filesToPush,
        isPrivate
      );

      setMergedRepo(result);

      // Create a bridge record
      await createBridge({
        github_repo_url: result.html_url,
        repo_name: result.name,
        platforms: ["merged"],
        source_repo_url: sourceRepo.html_url,
        source_repo_name: sourceRepo.full_name,
        merge_mode: "standard",
      });

      toast({
        title: "Merge Complete!",
        description: `Your merged repository is ready at ${result.full_name}`,
      });
    } catch (e) {
      setStep("configure-output");
    }
  };

  const unresolvedConflicts = conflicts.filter(
    (c) => c.status === "conflict" && !c.resolved
  ).length;

  const stepLabels: Record<Step, string> = {
    "select-mode": "Choose Mode",
    "select-repos": "Select Repositories",
    "preview-diff": "Review Changes",
    "configure-output": "Configure Output",
    "configure-folder": "Configure Folder",
    "merging": mergedRepo ? "Complete" : "Merging...",
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
            <GitMerge className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">{stepLabels[step]}</span>
          </div>
        </div>

        {/* Step: Select Mode */}
        {step === "select-mode" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Choose Merge Mode</h1>
              <p className="text-muted-foreground">Select how you want to combine your repositories.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 flex-1 max-w-4xl mx-auto">
              {/* Folder Mode */}
              <button
                onClick={() => setMergeMode("folder")}
                className={`p-8 rounded-xl border-2 text-left transition-all ${
                  mergeMode === "folder"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-background"
                }`}
              >
                <FolderTree className="w-12 h-12 mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Folder Mode (Subtree)</h3>
                <p className="text-muted-foreground mb-4">
                  Import source repo into a subfolder of the target repo. Perfect for syncing 
                  AI Studio code into Lovable under <code className="text-primary">/ai-studio/</code>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• No file conflicts - code lives in separate folders</li>
                  <li>• Target repo stays intact</li>
                  <li>• Can re-run to update the folder</li>
                </ul>
              </button>

              {/* Standard Mode */}
              <button
                onClick={() => setMergeMode("standard")}
                className={`p-8 rounded-xl border-2 text-left transition-all ${
                  mergeMode === "standard"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-background"
                }`}
              >
                <Layers className="w-12 h-12 mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Standard Merge</h3>
                <p className="text-muted-foreground mb-4">
                  Compare files and merge at root level. Useful when you want to combine 
                  two codebases into one unified project.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Compare and resolve conflicts</li>
                  <li>• Files merged at root level</li>
                  <li>• Create new repo or push to existing</li>
                </ul>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button variant="glow" onClick={() => setStep("select-repos")}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Select Repos */}
        {step === "select-repos" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">
                {mergeMode === "folder" ? "Select Repositories for Folder Sync" : "Select Repositories to Merge"}
              </h1>
              <p className="text-muted-foreground">
                {mergeMode === "folder" 
                  ? "Choose the source (AI Studio) and target (Lovable) repositories."
                  : "Choose two GitHub repositories to merge together."
                }
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
                  {mergeMode === "folder"
                    ? "The repo to import (e.g., AI Studio export)"
                    : "Files from this repo will be merged into the target"
                  }
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
                  {mergeMode === "folder"
                    ? "The canonical repo (e.g., Lovable project)"
                    : "This repo's structure will be the base for merging"
                  }
                </p>
                <RepoPicker
                  hasToken={hasToken}
                  onSelectRepo={setTargetRepo}
                  selectedRepoId={targetRepo?.id ?? null}
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setStep("select-mode")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
                {mergeMode === "folder" ? (
                  <Button
                    variant="glow"
                    onClick={handleFolderModeNext}
                    disabled={!sourceRepo || !targetRepo}
                  >
                    Configure Folder
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant="glow"
                    onClick={handleAnalyze}
                    disabled={!sourceRepo || !targetRepo || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Differences
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview Diff */}
        {step === "preview-diff" && sourceRepo && targetRepo && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <h1 className="font-heading text-2xl font-bold mb-2">Review Changes</h1>
              <p className="text-muted-foreground">
                Review file differences and resolve conflicts before merging.
              </p>
            </div>

            <div className="flex-1 min-h-0 glass rounded-xl p-4 overflow-hidden">
              <DiffViewer
                conflicts={conflicts}
                sourceRepo={sourceRepo}
                targetRepo={targetRepo}
                onResolve={handleResolve}
                onResolveAll={handleResolveAll}
              />
            </div>

            <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-border mt-4">
              <Button variant="ghost" onClick={() => setStep("select-repos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-3 items-center">
                {unresolvedConflicts > 0 && (
                  <span className="text-sm text-amber-500">
                    {unresolvedConflicts} unresolved conflict
                    {unresolvedConflicts > 1 ? "s" : ""}
                  </span>
                )}
                <Button variant="glow" onClick={handleProceedToOutput}>
                  Choose Output
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Configure Folder (Folder Mode only) */}
        {step === "configure-folder" && sourceRepo && targetRepo && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Configure Folder Sync</h1>
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
                    placeholder="ai-studio"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">/</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium mb-2">Preview</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {targetRepo.full_name}/<span className="text-primary">{folderPrefix || "ai-studio"}</span>/
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
                onClick={handleFolderModeMerge}
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

        {/* Step: Configure Output */}
        {step === "configure-output" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Configure Output</h1>
              <p className="text-muted-foreground">Choose where to save the merged repository.</p>
            </div>

            <div className="space-y-6 flex-1">
              {/* Output type selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setOutputType("new-repo")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    outputType === "new-repo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  }`}
                >
                  <FolderPlus className="w-8 h-8 mb-3 text-primary" />
                  <h3 className="font-semibold text-lg">Create New Repository</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a brand new repo with the merged code
                  </p>
                </button>

                <button
                  onClick={() => setOutputType("existing-repo")}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    outputType === "existing-repo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-background"
                  }`}
                >
                  <GitMerge className="w-8 h-8 mb-3 text-primary" />
                  <h3 className="font-semibold text-lg">Push to Existing Repository</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Merge into an existing repo you select
                  </p>
                </button>
              </div>

              {outputType === "new-repo" && (
                <div className="glass p-6 rounded-xl space-y-4">
                  <div>
                    <Label htmlFor="repo-name" className="text-base">Repository Name</Label>
                    <Input
                      id="repo-name"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      placeholder="my-merged-project"
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="private"
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="private">Make repository private</Label>
                  </div>
                </div>
              )}

              {outputType === "existing-repo" && (
                <div className="glass p-6 rounded-xl">
                  <Label className="mb-3 block text-base">
                    Destination Repository
                    {destinationRepo && (
                      <span className="ml-2 text-primary font-normal">
                        — {destinationRepo.full_name}
                      </span>
                    )}
                  </Label>
                  <RepoPicker
                    hasToken={hasToken}
                    onSelectRepo={setDestinationRepo}
                    selectedRepoId={destinationRepo?.id ?? null}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setStep("preview-diff")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                variant="glow"
                onClick={handleMerge}
                disabled={
                  (outputType === "new-repo" && !newRepoName) ||
                  (outputType === "existing-repo" && !destinationRepo)
                }
              >
                <GitMerge className="w-4 h-4 mr-2" />
                Merge Repositories
              </Button>
            </div>
          </div>
        )}

        {/* Step: Merging */}
        {step === "merging" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {mergedRepo ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <GitMerge className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-2">Merge Successful!</h2>
                <p className="text-muted-foreground mb-8">
                  Your merged repository is ready at{" "}
                  <span className="font-mono text-primary">
                    {mergedRepo.full_name}
                  </span>
                </p>
                
                {/* Check if pushed to existing repo with known origin */}
                {outputType === "existing-repo" && destinationRepo && (() => {
                  const originUrl = getOriginPlatformUrl(destinationRepo.html_url, destinationRepo.description);
                  const platform = detectPlatform(destinationRepo.html_url, destinationRepo.description);
                  
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
                <h2 className="font-heading text-2xl font-bold">Merging Repositories...</h2>
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
