import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Crown, Sparkles, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBridges } from "@/hooks/useBridges";
import { useAuthConnection } from "@/hooks/useAuthConnection";
import { UserHeader } from "@/components/dashboard/UserHeader";
import { BridgeCard } from "@/components/dashboard/BridgeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { bridges, isLoading, deleteBridge, bridgeLimit } = useBridges();
  const { connection, isLoading: connectionLoading } = useAuthConnection();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const isPaid = profile?.is_paid || false;

  return (
    <div className="min-h-screen bg-background">
      <UserHeader />

      <main className="container mx-auto px-4 py-8">
        {/* GitHub Connection Warning */}
        {!connectionLoading && !connection && (
          <Alert className="mb-6 border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>GitHub Not Connected</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Connect your GitHub account to create bridges.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/connect-github")}
                className="ml-4"
              >
                Connect GitHub
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-1">Your Bridges</h1>
            <p className="text-muted-foreground">
              {bridges.length} of {bridgeLimit === Infinity ? "∞" : bridgeLimit} bridge
              {bridgeLimit !== 1 ? "s" : ""} active
            </p>
          </div>
          <Button
            variant="glow"
            className="gap-2"
            onClick={() => navigate("/bridge/new")}
            disabled={!connection}
          >
            <ArrowRightLeft className="w-4 h-4" />
            New Bridge
          </Button>
        </div>

        {/* Upgrade Banner */}
        {!isPaid && (
          <div className="glass p-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-foreground mb-1">
                  Upgrade to Pro for Unlimited Bridges
                </h3>
                <p className="text-sm text-muted-foreground">
                  One-time payment of $29. Sync unlimited repositories and unlock priority support.
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-yellow-500 text-yellow-950 font-medium hover:bg-yellow-400 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Bridges Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : bridges.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold mb-2">No bridges yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first bridge to sync between Lovable and AI Studio using a canonical repo.
            </p>
            <Button
              variant="glow"
              className="gap-2"
              onClick={() => navigate("/bridge/new")}
              disabled={!connection}
            >
              <ArrowRightLeft className="w-4 h-4" />
              New Bridge
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bridges.map((bridge) => (
              <BridgeCard key={bridge.id} bridge={bridge} onDelete={deleteBridge} />
            ))}
          </div>
        )}

        {/* Tips Section */}
        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-xl">
              <h3 className="font-medium text-sm mb-1">3-Repo Architecture</h3>
              <p className="text-xs text-muted-foreground">
                Canonical repo contains /lovable and /ai-studio folders as git subtrees.
              </p>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="font-medium text-sm mb-1">Bidirectional Sync</h3>
              <p className="text-xs text-muted-foreground">
                Changes flow both ways via PRs. Never force-push, always review.
              </p>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="font-medium text-sm mb-1">Ownership Boundaries</h3>
              <p className="text-xs text-muted-foreground">
                Lovable owns /lovable/**, AI Studio owns /ai-studio/**. No conflicts.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
