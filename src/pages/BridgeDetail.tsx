import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings2,
  Play,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Bridge, SyncRun, useBridges } from "@/hooks/useBridges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BridgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { getSyncRuns, updateBridge } = useBridges();
  const { toast } = useToast();

  const [bridge, setBridge] = useState<Bridge | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [isRunningSync, setIsRunningSync] = useState<string | null>(null);

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

      setBridge(data as Bridge);
      setIsLoading(false);
    };

    if (isAuthenticated) {
      fetchBridge();
    }
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchRuns = async () => {
      if (!bridge) return;
      setIsLoadingRuns(true);
      try {
        const runs = await getSyncRuns(bridge.id);
        setSyncRuns(runs);
      } catch (error) {
        console.error("Failed to fetch sync runs:", error);
      } finally {
        setIsLoadingRuns(false);
      }
    };
    fetchRuns();
  }, [bridge]);

  const getGitHubUrl = (repo: string) => `https://github.com/${repo}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "conflict":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      error: "destructive",
      conflict: "outline",
      running: "secondary",
      queued: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleTriggerSync = async (direction: "INBOUND" | "OUTBOUND", platform: "lovable" | "aistudio") => {
    if (!bridge || !user) return;

    const syncKey = `${direction}-${platform}`;
    setIsRunningSync(syncKey);

    try {
      // Create a sync run record
      const sourceRepo = direction === "INBOUND"
        ? (platform === "lovable" ? bridge.lovable_repo : bridge.aistudio_repo)
        : bridge.canonical_repo;
      const destRepo = direction === "INBOUND"
        ? bridge.canonical_repo
        : (platform === "lovable" ? bridge.lovable_repo : bridge.aistudio_repo);

      const { data: syncRun, error } = await supabase
        .from("sync_runs")
        .insert({
          bridge_id: bridge.id,
          user_id: user.id,
          direction,
          source_repo: sourceRepo,
          dest_repo: destRepo,
          status: "queued",
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would trigger an edge function
      // For now, we'll simulate the sync process
      toast({
        title: "Sync Triggered",
        description: `${direction} sync for ${platform} has been queued.`,
      });

      // Refresh sync runs
      const runs = await getSyncRuns(bridge.id);
      setSyncRuns(runs);
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningSync(null);
    }
  };

  const handleTriggerSetup = async () => {
    if (!bridge || !user) return;

    setIsRunningSync("SETUP");

    try {
      const { error } = await supabase
        .from("sync_runs")
        .insert({
          bridge_id: bridge.id,
          user_id: user.id,
          direction: "SETUP",
          source_repo: bridge.canonical_repo,
          dest_repo: bridge.canonical_repo,
          status: "queued",
        });

      if (error) throw error;

      toast({
        title: "Setup Triggered",
        description: "Subtree initialization has been queued. A PR will be created in your canonical repo.",
      });

      const runs = await getSyncRuns(bridge.id);
      setSyncRuns(runs);
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningSync(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!bridge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">{bridge.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              {bridge.canonical_branch}
              {!bridge.setup_complete && (
                <Badge variant="outline" className="text-warning border-warning/50">
                  Setup Pending
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Setup Banner */}
        {!bridge.setup_complete && (
          <Card className="mb-6 border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Setup Required
              </CardTitle>
              <CardDescription>
                Initialize git subtrees in your canonical repo to start syncing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will create a PR in <strong>{bridge.canonical_repo}</strong> that adds:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                <li>• <code className="bg-secondary px-1 rounded">/{bridge.lovable_prefix}/</code> ← subtree from {bridge.lovable_repo}</li>
                <li>• <code className="bg-secondary px-1 rounded">/{bridge.aistudio_prefix}/</code> ← subtree from {bridge.aistudio_repo}</li>
              </ul>
              <Button
                onClick={handleTriggerSetup}
                disabled={isRunningSync === "SETUP"}
              >
                {isRunningSync === "SETUP" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Setup PR...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Create Setup PR
                  </>
                )}
              </Button>
              {bridge.setup_pr_url && (
                <a
                  href={bridge.setup_pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-sm text-primary hover:underline"
                >
                  View Setup PR <ExternalLink className="w-3 h-3 inline" />
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Repo Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Canonical */}
          <Card className="border-yellow-500/30">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit bg-yellow-500/10 text-yellow-400 border-yellow-500/30 mb-2">
                Canonical (Source of Truth)
              </Badge>
              <CardTitle className="text-lg">{bridge.canonical_repo.split("/")[1]}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {bridge.canonical_repo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={getGitHubUrl(bridge.canonical_repo)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>

          {/* Lovable */}
          <Card className="border-purple-500/30">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit bg-purple-500/10 text-purple-400 border-purple-500/30 mb-2">
                💜 Lovable
              </Badge>
              <CardTitle className="text-lg">{bridge.lovable_repo.split("/")[1]}</CardTitle>
              <CardDescription className="font-mono text-xs">
                /{bridge.lovable_prefix}/
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href={getGitHubUrl(bridge.lovable_repo)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerSync("INBOUND", "lovable")}
                  disabled={!!isRunningSync || !bridge.setup_complete}
                >
                  {isRunningSync === "INBOUND-lovable" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3 h-3" />
                  )}
                  <span className="ml-1">Pull</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerSync("OUTBOUND", "lovable")}
                  disabled={!!isRunningSync || !bridge.setup_complete}
                >
                  {isRunningSync === "OUTBOUND-lovable" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-3 h-3" />
                  )}
                  <span className="ml-1">Push</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Studio */}
          <Card className="border-blue-500/30">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/30 mb-2">
                🌐 AI Studio
              </Badge>
              <CardTitle className="text-lg">{bridge.aistudio_repo.split("/")[1]}</CardTitle>
              <CardDescription className="font-mono text-xs">
                /{bridge.aistudio_prefix}/
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href={getGitHubUrl(bridge.aistudio_repo)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerSync("INBOUND", "aistudio")}
                  disabled={!!isRunningSync || !bridge.setup_complete}
                >
                  {isRunningSync === "INBOUND-aistudio" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="w-3 h-3" />
                  )}
                  <span className="ml-1">Pull</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerSync("OUTBOUND", "aistudio")}
                  disabled={!!isRunningSync || !bridge.setup_complete}
                >
                  {isRunningSync === "OUTBOUND-aistudio" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="w-3 h-3" />
                  )}
                  <span className="ml-1">Push</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sync History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const runs = await getSyncRuns(bridge.id);
                  setSyncRuns(runs);
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRuns ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : syncRuns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sync runs yet. Trigger a sync to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Source → Dest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PR</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {run.direction.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {run.source_repo.split("/")[1]} → {run.dest_repo.split("/")[1]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          {getStatusBadge(run.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.pr_url ? (
                          <a
                            href={run.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            #{run.pr_number} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(run.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BridgeDetail;
