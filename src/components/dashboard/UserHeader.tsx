import { useState } from "react";
import { LogOut, Crown, Layers, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { GitHubPatDialog } from "./GitHubPatDialog";

export const UserHeader = () => {
  const { user, profile, logout } = useAuth();
  const [patDialogOpen, setPatDialogOpen] = useState(false);

  if (!user) return null;

  const displayName = profile?.github_username || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || undefined;
  const isPaid = profile?.is_paid || false;

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-xl">VibeBridge</span>
        </Link>

        <div className="flex items-center gap-4">
          {isPaid ? (
            <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-500">
              <Crown className="w-3 h-3" />
              Pro
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              Free Plan
            </Badge>
          )}

          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">{displayName}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setPatDialogOpen(true)} title="GitHub Settings">
            <Github className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <GitHubPatDialog
        open={patDialogOpen}
        onOpenChange={setPatDialogOpen}
        onSuccess={() => setPatDialogOpen(false)}
      />
    </header>
  );
};
