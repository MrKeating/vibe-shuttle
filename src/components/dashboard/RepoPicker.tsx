import { useState, useEffect } from "react";
import { Github, Lock, Globe, Search, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGitHub } from "@/hooks/useGitHub";
import { cn } from "@/lib/utils";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

interface RepoPickerProps {
  hasToken: boolean;
  onSelectRepo: (repo: GitHubRepo) => void;
  selectedRepoId: number | null;
}

export const RepoPicker = ({ hasToken, onSelectRepo, selectedRepoId }: RepoPickerProps) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { listRepos } = useGitHub();

  useEffect(() => {
    if (hasToken) {
      loadRepos();
    }
  }, [hasToken]);

  const loadRepos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRepos();
      setRepos(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load repositories");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!hasToken) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <Github className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Connect your GitHub account to select repositories
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Click the GitHub icon in the header to add your Personal Access Token
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent("vibemerge:open-github"))}
        >
          Open GitHub Settings
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading repositories...</span>
      </div>
    );
  }

  if (error) {
    const normalized = error.toLowerCase();
    const isBadCredentials =
      normalized.includes("bad credentials") ||
      normalized.includes("token invalid") ||
      normalized.includes("invalid or expired") ||
      normalized.includes("401");
    return (
      <div className="glass p-6 rounded-xl text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive" />
        <p className="text-sm text-destructive mb-2">
          {isBadCredentials ? "Your GitHub token is invalid or expired" : error}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {isBadCredentials
            ? "Reconnect your GitHub token to continue."
            : "Please try again or reconnect your GitHub account"}
        </p>
        <div className="flex items-center justify-center gap-3">
          {isBadCredentials && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent("vibemerge:open-github"))}
            >
              Reconnect GitHub
            </Button>
          )}
          <button onClick={loadRepos} className="text-xs text-primary hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[280px] rounded-lg border border-border">
        <div className="p-2 space-y-1">
          {filteredRepos.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No repositories found
            </p>
          ) : (
            filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedRepoId === repo.id
                    ? "bg-primary/20 border border-primary/50"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="mt-0.5">
                  {repo.private ? (
                    <Lock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{repo.full_name}</p>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {repo.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        {filteredRepos.length} of {repos.length} repositories
      </p>
    </div>
  );
};
