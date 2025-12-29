import { useState } from "react";
import { GitMerge, Plus, Loader2, ArrowRight, ExternalLink, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RepoPicker } from "@/components/dashboard/RepoPicker";
import { DiffViewer } from "@/components/merge/DiffViewer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMerge, type FileConflict, type GitHubRepo } from "@/hooks/useMerge";

type Step = "select-repos" | "preview-diff" | "configure-output" | "merging";
type OutputType = "new-repo" | "existing-repo";

interface CreateMergeDialogProps {
  onMergeComplete?: (repo: GitHubRepo) => void;
}

export const CreateMergeDialog = ({ onMergeComplete }: CreateMergeDialogProps) => {
  const [open, setOpen] = useState(false);
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
  const { profile } = useAuth();
  const { loading, analyzeRepos, executeMerge, getFileContent } = useMerge();

  const hasToken = !!profile?.github_pat;

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
    // Generate suggested repo name
    if (sourceRepo && targetRepo) {
      setNewRepoName(`${sourceRepo.name}-${targetRepo.name}-merged`);
    }
    setStep("configure-output");
  };

  const handleMerge = async () => {
    if (!sourceRepo || !targetRepo) return;

    setStep("merging");

    try {
      // Build final file list
      const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
      const [targetOwner, targetRepoName] = targetRepo.full_name.split("/");

      const filesToPush: { path: string; content: string }[] = [];

      for (const conflict of conflicts) {
        let content: string | null = null;

        if (conflict.resolved && conflict.resolvedContent !== undefined) {
          content = conflict.resolvedContent;
        } else if (conflict.status === "added") {
          // New file from source
          const result = await getFileContent(sourceOwner, sourceRepoName, conflict.path);
          content = result.content || "";
        } else if (conflict.status === "deleted") {
          // Skip - file won't be included
          continue;
        } else if (conflict.status === "conflict") {
          // Unresolved conflict - default to source
          const result = await getFileContent(sourceOwner, sourceRepoName, conflict.path);
          content = result.content || "";
        }

        if (content !== null) {
          filesToPush.push({ path: conflict.path, content });
        }
      }

      // Also include files from target that don't conflict
      // (files that exist only in target and weren't in our conflicts as "deleted")

      const result = await executeMerge(
        sourceRepo,
        outputType === "existing-repo" ? destinationRepo : null,
        outputType === "new-repo" ? newRepoName : null,
        filesToPush,
        isPrivate
      );

      setMergedRepo(result);
      onMergeComplete?.(result);

      toast({
        title: "Merge Complete!",
        description: `Your merged repository is ready at ${result.full_name}`,
      });
    } catch (e) {
      setStep("configure-output");
    }
  };

  const resetDialog = () => {
    setStep("select-repos");
    setSourceRepo(null);
    setTargetRepo(null);
    setConflicts([]);
    setOutputType("new-repo");
    setNewRepoName("");
    setIsPrivate(false);
    setDestinationRepo(null);
    setMergedRepo(null);
  };

  const unresolvedConflicts = conflicts.filter(
    (c) => c.status === "conflict" && !c.resolved
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetDialog();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="glow" className="gap-2">
          <GitMerge className="w-4 h-4" />
          Merge Repos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-primary" />
            {step === "select-repos" && "Select Repositories to Merge"}
            {step === "preview-diff" && "Review Changes"}
            {step === "configure-output" && "Configure Output"}
            {step === "merging" && (mergedRepo ? "Merge Complete!" : "Merging...")}
          </DialogTitle>
          <DialogDescription>
            {step === "select-repos" &&
              "Choose two GitHub repositories to merge together."}
            {step === "preview-diff" &&
              "Review file differences and resolve conflicts before merging."}
            {step === "configure-output" &&
              "Choose where to save the merged repository."}
            {step === "merging" &&
              (mergedRepo
                ? "Your repositories have been merged successfully."
                : "Please wait while we merge your repositories...")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {step === "select-repos" && (
            <div className="space-y-6 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Source Repo */}
                <div>
                  <Label className="mb-2 block">
                    Source Repository
                    {sourceRepo && (
                      <span className="ml-2 text-primary font-normal">
                        — {sourceRepo.full_name}
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Files from this repo will be merged into the target
                  </p>
                  <RepoPicker
                    hasToken={hasToken}
                    onSelectRepo={setSourceRepo}
                    selectedRepoId={sourceRepo?.id ?? null}
                  />
                </div>

                {/* Target Repo */}
                <div>
                  <Label className="mb-2 block">
                    Target Repository
                    {targetRepo && (
                      <span className="ml-2 text-primary font-normal">
                        — {targetRepo.full_name}
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    This repo's structure will be the base for merging
                  </p>
                  <RepoPicker
                    hasToken={hasToken}
                    onSelectRepo={setTargetRepo}
                    selectedRepoId={targetRepo?.id ?? null}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setOpen(false)}>
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

          {step === "preview-diff" && sourceRepo && targetRepo && (
            <div className="flex flex-col h-[60vh]">
              <DiffViewer
                conflicts={conflicts}
                sourceRepo={sourceRepo}
                targetRepo={targetRepo}
                onResolve={handleResolve}
                onResolveAll={handleResolveAll}
              />
              <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                <Button variant="ghost" onClick={() => setStep("select-repos")}>
                  Back
                </Button>
                <div className="flex gap-2 items-center">
                  {unresolvedConflicts > 0 && (
                    <span className="text-sm text-amber-500">
                      {unresolvedConflicts} unresolved conflict
                      {unresolvedConflicts > 1 ? "s" : ""}
                    </span>
                  )}
                  <Button variant="glow" onClick={handleProceedToOutput}>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "configure-output" && (
            <div className="space-y-6 py-4">
              {/* Output type selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setOutputType("new-repo")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    outputType === "new-repo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <FolderPlus className="w-6 h-6 mb-2 text-primary" />
                  <h3 className="font-medium">Create New Repository</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a brand new repo with the merged code
                  </p>
                </button>

                <button
                  onClick={() => setOutputType("existing-repo")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    outputType === "existing-repo"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <GitMerge className="w-6 h-6 mb-2 text-primary" />
                  <h3 className="font-medium">Push to Existing Repository</h3>
                  <p className="text-sm text-muted-foreground">
                    Merge into an existing repo you select
                  </p>
                </button>
              </div>

              {outputType === "new-repo" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="repo-name">Repository Name</Label>
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
                <div>
                  <Label className="mb-2 block">
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

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep("preview-diff")}>
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

          {step === "merging" && (
            <div className="flex flex-col items-center justify-center py-12">
              {mergedRepo ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <GitMerge className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Merge Successful!</h3>
                  <p className="text-muted-foreground mb-6">
                    Your merged repository is ready at{" "}
                    <span className="font-mono text-primary">
                      {mergedRepo.full_name}
                    </span>
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open(mergedRepo.html_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on GitHub
                    </Button>
                    <Button variant="glow" onClick={() => setOpen(false)}>
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-semibold">Merging Repositories...</h3>
                  <p className="text-muted-foreground">
                    This may take a moment
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};