import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGitHub } from "@/hooks/useGitHub";

interface GitHubPatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentPat?: string;
}

export const GitHubPatDialog = ({
  open,
  onOpenChange,
  onSuccess,
  currentPat,
}: GitHubPatDialogProps) => {
  const [pat, setPat] = useState("");
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [githubUser, setGithubUser] = useState<{ username: string; avatar_url: string } | null>(null);
  const { toast } = useToast();
  const { validateToken } = useGitHub();

  const handleValidate = async () => {
    if (!pat.trim()) return;

    setValidating(true);
    try {
      // First save the PAT temporarily to validate
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

       const { error: updateError } = await supabase
         .from("profiles")
         .update({ github_pat: pat.trim() })
         .eq("id", user.id);

       if (updateError) throw updateError;

      // Now validate
      const result = await validateToken();
      setGithubUser({ username: result.username, avatar_url: result.avatar_url });
      setValidated(true);
      toast({
        title: "Token validated!",
        description: `Connected as ${result.username}`,
      });
    } catch (error: any) {
      // Clear the invalid PAT
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ github_pat: currentPat || null })
          .eq("id", user.id);
      }
      toast({
        title: "Invalid token",
        description: "Please check your Personal Access Token and try again.",
        variant: "destructive",
      });
      setValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!validated) {
      await handleValidate();
      return;
    }

    setSaving(true);
    try {
      toast({
        title: "GitHub connected!",
        description: `Successfully connected as ${githubUser?.username}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPat("");
    setValidated(false);
    setGithubUser(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Connect GitHub
          </DialogTitle>
          <DialogDescription>
            Add your GitHub Personal Access Token to enable repository access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pat">Personal Access Token</Label>
            <Input
              id="pat"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={pat}
              onChange={(e) => {
                setPat(e.target.value);
                setValidated(false);
              }}
            />
          </div>

          {validated && githubUser && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Connected as <strong>{githubUser.username}</strong>
              </span>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Required scopes for your token:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><code>repo</code> - Full control of repositories</li>
              <li><code>read:user</code> - Read user profile data</li>
            </ul>
          </div>

          <a
            href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=VibeMerge"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Create a new token on GitHub
          </a>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!pat.trim() || saving || validating}>
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : validated ? (
              "Done"
            ) : (
              "Validate & Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
