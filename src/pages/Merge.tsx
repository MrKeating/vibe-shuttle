import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitMerge, Loader2, ArrowRight, ArrowLeft, ExternalLink, FolderPlus } from "lucide-react";
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

type Step = "select-repos" | "preview-diff" | "configure-output" | "merging";
type OutputType = "new-repo" | "existing-repo";

const Merge = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-repos");
  const [sourceRepo, setSourceRepo] = useState<GitHubRepo | null>(null);
  const [targetRepo, setTargetRepo] = useState<GitHubRepo | null>(null);
  const [conflicts, setConflicts] = useState<FileConflict[]>([]);
  const [outputType, setOutputType] = useState<OutputType>("new-repo");
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [destinationRepo, setDestinationRepo] = useState<GitHubRepo | null>(null);
  const [mergedRepo, setMergedRepo] = useState<GitHubRepo | null>(null);
  const { toast } = useToast();
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, analyzeRepos, executeMerge, getFileContent } = useMerge();
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

  const handleMerge = async () => {
    if (!sourceRepo || !targetRepo) return;

    setStep("merging");

    try {
      const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");

      const filesToPush: { path: string; content: string }[] = [];

      for (const conflict of conflicts) {
        let content: string | null = null;

        if (conflict.resolved && conflict.resolvedContent !== undefined) {
          content = conflict.resolvedContent;
        } else if (conflict.status === "added") {
          const result = await getFileContent(sourceOwner, sourceRepoName, conflict.path);
          content = result.content || "";
        } else if (conflict.status === "deleted") {
          continue;
        } else if (conflict.status === "conflict") {
          const result = await getFileContent(sourceOwner, sourceRepoName, conflict.path);
          content = result.content || "";
        }

        if (content !== null) {
          filesToPush.push({ path: conflict.path, content });
        }
      }

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

  const stepLabels = {
    "select-repos": "Select Repositories",
    "preview-diff": "Review Changes",
    "configure-output": "Configure Output",
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

        {/* Step: Select Repos */}
        {step === "select-repos" && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">Select Repositories to Merge</h1>
              <p className="text-muted-foreground">Choose two GitHub repositories to merge together.</p>
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
                  Files from this repo will be merged into the target
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
                  This repo's structure will be the base for merging
                </p>
                <RepoPicker
                  hasToken={hasToken}
                  onSelectRepo={setTargetRepo}
                  selectedRepoId={targetRepo?.id ?? null}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
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
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => window.open(mergedRepo.html_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on GitHub
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
