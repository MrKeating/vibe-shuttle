import { GitBranch, ExternalLink, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bridge } from "@/hooks/useBridges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  lovable: { name: "Lovable", icon: "💜", color: "#9b87f5" },
  bolt: { name: "Bolt.new", icon: "⚡", color: "#FFD700" },
  "google-ai": { name: "Google AI Studio", icon: "🌐", color: "#4285F4" },
  base44: { name: "Base44", icon: "🔷", color: "#0EA5E9" },
  cursor: { name: "Cursor", icon: "▲", color: "#00D4AA" },
  replit: { name: "Replit", icon: "🔶", color: "#F26207" },
  v0: { name: "v0.dev", icon: "◆", color: "#ffffff" },
  windsurf: { name: "Windsurf", icon: "🌊", color: "#06B6D4" },
  huggingface: { name: "Hugging Face", icon: "🤗", color: "#FFD21E" },
};

interface BridgeCardProps {
  bridge: Bridge;
  onDelete: (id: string) => void;
}

export const BridgeCard = ({ bridge, onDelete }: BridgeCardProps) => {
  const createdDate = new Date(bridge.created_at).toLocaleDateString();
  const hasConfig = !!bridge.config_created_at;

  return (
    <div className="glass p-6 rounded-xl border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">{bridge.repo_name}</h3>
            <a
              href={bridge.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bridge</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the bridge for "{bridge.repo_name}". The .vibebridge/ folder in your
                repository will also be removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(bridge.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Platforms */}
      <div className="flex flex-wrap gap-2 mb-4">
        {bridge.platforms.map((platformId) => {
          const platform = PLATFORM_INFO[platformId];
          if (!platform) return null;
          return (
            <Badge
              key={platformId}
              variant="secondary"
              className="gap-1"
              style={{ backgroundColor: `${platform.color}20` }}
            >
              <span>{platform.icon}</span>
              {platform.name}
            </Badge>
          );
        })}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {hasConfig ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span>Config active</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              <span>Pending setup</span>
            </>
          )}
        </div>
        <span>Created {createdDate}</span>
      </div>
    </div>
  );
};
