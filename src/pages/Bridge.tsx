import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitMerge,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Eye,
  Undo2,
  Crown,
  Plus,
  X,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepoPicker } from "@/components/dashboard/RepoPicker";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMerge, type GitHubRepo } from "@/hooks/useMerge";
import { useBridges } from "@/hooks/useBridges";
import {
  detectPlatform,
  determineDestination,
  getPlatformFolderName,
  type RepoWithPlatform,
  type PlatformInfo,
} from "@/lib/platformDetection";
import { Badge } from "@/components/ui/badge";

type Step = "select-repos" | "confirm-destination" | "syncing";

interface SelectedRepo extends GitHubRepo {
  platform: PlatformInfo | null;
  isDestination: boolean;
}

const Bridge = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-repos");
  const [selectedRepos, setSelectedRepos] = useState<SelectedRepo[]>([]);
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

  // Auto-determine destination based on platform hierarchy
  const destinationRepo = useMemo(() => {
    if (selectedRepos.length === 0) return null;

    const reposWithPlatform: RepoWithPlatform[] = selectedRepos.map((r) => ({
      repoUrl: r.html_url,
      repoName: r.full_name,
      description: r.description,
      platform: r.platform,
    }));

    const destination = determineDestination(reposWithPlatform);
    return destination
      ? selectedRepos.find((r) => r.html_url === destination.repoUrl) || null
      : null;
  }, [selectedRepos]);

  const sourceRepos = useMemo(() => {
    if (!destinationRepo) return [];
    return selectedRepos.filter((r) => r.id !== destinationRepo.id);
  }, [selectedRepos, destinationRepo]);

  const handleSelectRepo = (repo: GitHubRepo) => {
    // Check if already selected
    if (selectedRepos.some((r) => r.id === repo.id)) {
      toast({
        title: "Already Selected",
        description: "This repo is already in your bridge.",
        variant: "destructive",
      });
      return;
    }

    const platform = detectPlatform(repo.html_url, repo.description);
    setSelectedRepos((prev) => [
      ...prev,
      { ...repo, platform, isDestination: false },
    ]);
  };

  const handleRemoveRepo = (repoId: number) => {
    setSelectedRepos((prev) => prev.filter((r) => r.id !== repoId));
  };

  const handleNext = () => {
    if (selectedRepos.length < 2) {
      toast({
        title: "Need More Repos",
        description: "Select at least 2 repos to create a bridge.",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm-destination");
  };

  const handleCreateBridge = async () => {
    if (!destinationRepo || sourceRepos.length === 0) return;

    setStep("syncing");

    try {
      const [destOwner, destRepoName] = destinationRepo.full_name.split("/");

      // For each source repo, fetch files and push to destination in its own folder
      for (const sourceRepo of sourceRepos) {
        const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
        const folderName = sourceRepo.platform
          ? getPlatformFolderName(sourceRepo.platform)
          : sourceRepoName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const folderPrefix = `src/${folderName}`;

        // Get all files from source repo
        const sourceTree = await getRepoTree(sourceOwner, sourceRepoName);
        const sourceFiles = sourceTree.filter((f) => f.type === "blob");

        if (sourceFiles.length === 0) continue;

        // Fetch content for all source files
        const filesToPush: { path: string; content: string }[] = [];
        for (const file of sourceFiles) {
          const result = await getFileContent(
            sourceOwner,
            sourceRepoName,
            file.path
          );
          if (result.content) {
            filesToPush.push({
              path: `${folderPrefix}/${file.path}`,
              content: result.content,
            });
          }
        }

        if (filesToPush.length === 0) continue;

        // Push to destination repo via edge function
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.functions.invoke("github-api", {
          body: {
            action: "push-files",
            owner: destOwner,
            repo: destRepoName,
            files: filesToPush,
            message: `VibeBridge: import from ${sourceRepo.full_name} → /${folderPrefix}/`,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
      }

      // Create bridge record with all source repos
      await createBridge({
        github_repo_url: destinationRepo.html_url,
        repo_name: destinationRepo.name,
        platforms: sourceRepos
          .map((r) => r.platform?.id || "unknown")
          .filter(Boolean),
        source_repo_url: sourceRepos[0]?.html_url || null,
        source_repo_name: sourceRepos.map((r) => r.full_name).join(","),
        merge_mode: "multi-repo",
        folder_prefix: sourceRepos
          .map((r) =>
            r.platform
              ? `src/${getPlatformFolderName(r.platform)}`
              : `src/${r.name.toLowerCase()}`
          )
          .join(","),
      });

      setMergedRepo(destinationRepo);

      toast({
        title: "Bridge Created!",
        description: `Connected ${sourceRepos.length} repos to ${destinationRepo.name}`,
      });
    } catch (e: any) {
      toast({
        title: "Bridge Creation Failed",
        description: e.message,
        variant: "destructive",
      });
      setStep("confirm-destination");
    }
  };

  const stepLabels: Record<Step, string> = {
    "select-repos": "Select Repositories",
    "confirm-destination": "Confirm Destination",
    syncing: mergedRepo ? "Complete" : "Creating Bridge...",
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
              <h1 className="font-heading text-2xl font-bold mb-2">
                Create a Multi-Repo Bridge
              </h1>
              <p className="text-muted-foreground">
                Select 2 or more GitHub repos to connect. The highest priority
                platform becomes the destination.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 flex-1">
              {/* Repo Picker */}
              <div className="glass p-6 rounded-xl">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Repositories
                </h3>
                <RepoPicker
                  hasToken={hasToken}
                  onSelectRepo={handleSelectRepo}
                  selectedRepoId={null}
                />
              </div>

              {/* Selected Repos */}
              <div className="glass p-6 rounded-xl">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Selected Repos ({selectedRepos.length})
                </h3>

                {selectedRepos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No repos selected yet</p>
                    <p className="text-sm">Select at least 2 repos to create a bridge</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRepos.map((repo) => {
                      const isDestination = destinationRepo?.id === repo.id;
                      return (
                        <div
                          key={repo.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isDestination
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isDestination && (
                                <Crown className="w-5 h-5 text-primary" />
                              )}
                              <div>
                                <p className="font-medium">{repo.full_name}</p>
                                {repo.platform && (
                                  <Badge
                                    variant="outline"
                                    style={{
                                      borderColor: repo.platform.color,
                                      color: repo.platform.color,
                                    }}
                                    className="mt-1"
                                  >
                                    {repo.platform.name}
                                    {isDestination && " (Destination)"}
                                  </Badge>
                                )}
                                {!repo.platform && (
                                  <Badge variant="secondary" className="mt-1">
                                    Unknown Platform
                                    {isDestination && " (Destination)"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRepo(repo.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button
                variant="glow"
                onClick={handleNext}
                disabled={selectedRepos.length < 2}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Confirm Destination */}
        {step === "confirm-destination" && destinationRepo && (
          <div className="flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold mb-2">
                Confirm Bridge Configuration
              </h1>
              <p className="text-muted-foreground">
                Review the destination and source repos before creating the bridge.
              </p>
            </div>

            <div className="space-y-6 max-w-3xl">
              {/* Destination */}
              <div className="glass p-6 rounded-xl border-2 border-primary">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-6 h-6 text-primary" />
                  <h3 className="font-heading font-semibold text-lg">
                    Destination (Main App)
                  </h3>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="font-medium text-lg">{destinationRepo.full_name}</p>
                  {destinationRepo.platform && (
                    <Badge
                      style={{
                        backgroundColor: destinationRepo.platform.color,
                        color: "#fff",
                      }}
                      className="mt-2"
                    >
                      {destinationRepo.platform.name} — Priority #
                      {destinationRepo.platform.priority}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    All source repos will contribute code to this repository.
                  </p>
                </div>
              </div>

              {/* Sources */}
              <div className="glass p-6 rounded-xl">
                <h3 className="font-heading font-semibold text-lg mb-4">
                  Contributing Repos ({sourceRepos.length})
                </h3>
                <div className="space-y-3">
                  {sourceRepos.map((repo) => {
                    const folderName = repo.platform
                      ? getPlatformFolderName(repo.platform)
                      : repo.name.toLowerCase();
                    return (
                      <div
                        key={repo.id}
                        className="p-4 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{repo.full_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              → <code className="text-primary">src/{folderName}/</code>
                            </p>
                          </div>
                          {repo.platform && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: repo.platform.color,
                                color: repo.platform.color,
                              }}
                            >
                              {repo.platform.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-medium text-amber-600 mb-1">How it works</h4>
                <p className="text-sm text-muted-foreground">
                  Each source repo's code will be synced into its own folder inside
                  the destination. You can sync changes in both directions from the
                  bridge detail page.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-border mt-6">
              <Button variant="ghost" onClick={() => setStep("select-repos")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button variant="glow" onClick={handleCreateBridge} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <GitMerge className="w-4 h-4 mr-2" />
                    Create Bridge
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
                  <GitMerge className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Bridge Created!
                </h2>
                <p className="text-muted-foreground mb-8">
                  {sourceRepos.length} repos are now connected to{" "}
                  <span className="font-mono text-primary">{mergedRepo.full_name}</span>
                </p>

                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => window.open(mergedRepo.html_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                  <Button variant="glow" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                <h2 className="font-heading text-2xl font-bold">Creating Bridge...</h2>
                <p className="text-muted-foreground mt-2">
                  Syncing files from {sourceRepos.length} repos
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bridge;
