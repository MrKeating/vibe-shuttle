import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, GitBranch, CheckCircle2, Loader2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBridges } from "@/hooks/useBridges";
import { useAuthConnection } from "@/hooks/useAuthConnection";
import { useGitHub } from "@/hooks/useGitHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RepoOption {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
}

const CreateBridge = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { createBridge, canCreateBridge } = useBridges();
  const { connection } = useAuthConnection();
  const { listRepos, loading: githubLoading } = useGitHub();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [bridgeName, setBridgeName] = useState("");
  const [canonicalRepo, setCanonicalRepo] = useState("");
  const [canonicalBranch, setCanonicalBranch] = useState("main");
  const [lovableRepo, setLovableRepo] = useState("");
  const [lovableBranch, setLovableBranch] = useState("main");
  const [lovablePrefix, setLovablePrefix] = useState("lovable");
  const [aistudioRepo, setAistudioRepo] = useState("");
  const [aistudioBranch, setAistudioBranch] = useState("main");
  const [aistudioPrefix, setAistudioPrefix] = useState("ai-studio");
  const [squashPolicy, setSquashPolicy] = useState(true);
  const [autoMerge, setAutoMerge] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!connection) {
      navigate("/connect-github");
    }
  }, [connection, navigate]);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await listRepos();
        setRepos(data || []);
      } catch (error) {
        console.error("Failed to fetch repos:", error);
      }
    };
    if (connection) {
      fetchRepos();
    }
  }, [connection]);

  const validatePrefix = (prefix: string): boolean => {
    // Safe folder name: alphanumeric, dashes, underscores only
    return /^[a-zA-Z0-9_-]+$/.test(prefix);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!bridgeName.trim()) {
        toast({ title: "Enter a bridge name", variant: "destructive" });
        return;
      }
      if (!canonicalRepo) {
        toast({ title: "Select a canonical repo", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!lovableRepo) {
        toast({ title: "Select a Lovable repo", variant: "destructive" });
        return;
      }
      if (!aistudioRepo) {
        toast({ title: "Select an AI Studio repo", variant: "destructive" });
        return;
      }
      if (lovableRepo === aistudioRepo) {
        toast({ title: "Platform repos must be different", variant: "destructive" });
        return;
      }
      if (lovableRepo === canonicalRepo || aistudioRepo === canonicalRepo) {
        toast({ title: "Platform repos cannot be the same as canonical", variant: "destructive" });
        return;
      }
    }
    if (step === 3) {
      if (!validatePrefix(lovablePrefix)) {
        toast({ title: "Invalid Lovable prefix. Use only letters, numbers, dashes, underscores.", variant: "destructive" });
        return;
      }
      if (!validatePrefix(aistudioPrefix)) {
        toast({ title: "Invalid AI Studio prefix. Use only letters, numbers, dashes, underscores.", variant: "destructive" });
        return;
      }
      if (lovablePrefix === aistudioPrefix) {
        toast({ title: "Prefixes must be different", variant: "destructive" });
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    if (!canCreateBridge) {
      toast({
        title: "Bridge Limit Reached",
        description: "Upgrade to Pro for unlimited bridges.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bridge = await createBridge({
        name: bridgeName,
        canonical_repo: canonicalRepo,
        canonical_branch: canonicalBranch,
        lovable_repo: lovableRepo,
        lovable_branch: lovableBranch,
        lovable_prefix: lovablePrefix,
        aistudio_repo: aistudioRepo,
        aistudio_branch: aistudioBranch,
        aistudio_prefix: aistudioPrefix,
        squash_policy: squashPolicy,
        auto_merge: autoMerge,
        auth_connection_id: connection?.id,
      });

      toast({
        title: "Bridge Created",
        description: "Now set up the subtrees in your canonical repo.",
      });

      navigate(`/bridge/${bridge.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to Create Bridge",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRepoDefaultBranch = (repoFullName: string): string => {
    const repo = repos.find((r) => r.full_name === repoFullName);
    return repo?.default_branch || "main";
  };

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="glass p-8 rounded-2xl">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-8 h-0.5 ${
                      step > s ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Name & Canonical */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Create a New Bridge
                </h2>
                <p className="text-muted-foreground">
                  Name your bridge and select the canonical (source of truth) repo
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bridge Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Project"
                    value={bridgeName}
                    onChange={(e) => setBridgeName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Canonical Repository (Source of Truth)</Label>
                  <Select value={canonicalRepo} onValueChange={(v) => {
                    setCanonicalRepo(v);
                    setCanonicalBranch(getRepoDefaultBranch(v));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select canonical repo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={canonicalBranch}
                    onChange={(e) => setCanonicalBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platform Repos */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Platform Repositories
                </h2>
                <p className="text-muted-foreground">
                  Select the Lovable and AI Studio repos to sync
                </p>
              </div>

              <div className="space-y-6">
                {/* Lovable Repo */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💜</span>
                    <Label className="text-purple-400">Lovable Repository</Label>
                  </div>
                  <Select value={lovableRepo} onValueChange={(v) => {
                    setLovableRepo(v);
                    setLovableBranch(getRepoDefaultBranch(v));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lovable repo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={lovableBranch}
                    onChange={(e) => setLovableBranch(e.target.value)}
                    placeholder="Branch (default: main)"
                  />
                </div>

                {/* AI Studio Repo */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <Label className="text-blue-400">AI Studio Repository</Label>
                  </div>
                  <Select value={aistudioRepo} onValueChange={(v) => {
                    setAistudioRepo(v);
                    setAistudioBranch(getRepoDefaultBranch(v));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Studio repo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((repo) => (
                        <SelectItem key={repo.id} value={repo.full_name}>
                          {repo.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={aistudioBranch}
                    onChange={(e) => setAistudioBranch(e.target.value)}
                    placeholder="Branch (default: main)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Prefixes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Folder Prefixes
                </h2>
                <p className="text-muted-foreground">
                  These folders will be created in your canonical repo as subtrees
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Lovable Prefix</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Folder in canonical repo where Lovable code lives</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Input
                      value={lovablePrefix}
                      onChange={(e) => setLovablePrefix(e.target.value)}
                      placeholder="lovable"
                    />
                    <span className="text-muted-foreground">/</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>AI Studio Prefix</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Folder in canonical repo where AI Studio code lives</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/</span>
                    <Input
                      value={aistudioPrefix}
                      onChange={(e) => setAistudioPrefix(e.target.value)}
                      placeholder="ai-studio"
                    />
                    <span className="text-muted-foreground">/</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings & Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="font-heading text-2xl font-bold mb-2">
                  Review & Settings
                </h2>
                <p className="text-muted-foreground">
                  Confirm your bridge configuration
                </p>
              </div>

              {/* Review */}
              <div className="space-y-3 p-4 rounded-xl bg-secondary/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bridge Name</span>
                  <span className="font-medium">{bridgeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Canonical</span>
                  <span className="font-mono text-xs">{canonicalRepo}:{canonicalBranch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lovable</span>
                  <span className="font-mono text-xs">/{lovablePrefix}/ ← {lovableRepo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Studio</span>
                  <span className="font-mono text-xs">/{aistudioPrefix}/ ← {aistudioRepo}</span>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Keep history compact</Label>
                    <p className="text-xs text-muted-foreground">
                      Use --squash when syncing (recommended)
                    </p>
                  </div>
                  <Switch checked={squashPolicy} onCheckedChange={setSquashPolicy} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-merge safe PRs</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically merge PRs with no conflicts
                    </p>
                  </div>
                  <Switch checked={autoMerge} onCheckedChange={setAutoMerge} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Bridge
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBridge;
