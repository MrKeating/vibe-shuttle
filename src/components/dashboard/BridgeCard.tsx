import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  GitBranch,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";
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

interface BridgeCardProps {
  bridge: Bridge;
  onDelete: (id: string) => void;
}

export const BridgeCard = ({ bridge, onDelete }: BridgeCardProps) => {
  const navigate = useNavigate();
  const createdDate = new Date(bridge.created_at).toLocaleDateString();

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    navigate(`/bridge/${bridge.id}`);
  };

  const getGitHubUrl = (repo: string) => `https://github.com/${repo}`;

  return (
    <div
      onClick={handleClick}
      className="glass p-6 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {bridge.name}
            </h3>
            <p className="text-xs text-muted-foreground">3-Repo Bridge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bridge</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the bridge "{bridge.name}". This action
                  cannot be undone.
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
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Repo Structure */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            Canonical
          </Badge>
          <a
            href={getGitHubUrl(bridge.canonical_repo)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {bridge.canonical_repo}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            Lovable
          </Badge>
          <span className="text-muted-foreground font-mono">/{bridge.lovable_prefix}/</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            AI Studio
          </Badge>
          <span className="text-muted-foreground font-mono">/{bridge.aistudio_prefix}/</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {bridge.setup_complete ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span>Active</span>
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 text-warning" />
              <span>Setup Pending</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          <span>{bridge.canonical_branch}</span>
        </div>
      </div>
    </div>
  );
};
