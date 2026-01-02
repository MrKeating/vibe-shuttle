import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Github, Key, CheckCircle2, Loader2, Shield, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthConnection } from "@/hooks/useAuthConnection";
import { useGitHub } from "@/hooks/useGitHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ConnectGitHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connection, savePatConnection, disconnect } = useAuthConnection();
  const { toast } = useToast();

  const [showPatForm, setShowPatForm] = useState(false);
  const [pat, setPat] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    username?: string;
    avatar_url?: string;
  } | null>(null);

  const handlePatChange = (value: string) => {
    setPat(value);
    setValidationResult(null);
  };

  const handleValidatePat = async () => {
    if (!pat.trim()) return;

    setIsValidating(true);
    try {
      // Temporarily save PAT to profile for validation
      await supabase
        .from("profiles")
        .update({ github_pat: pat })
        .eq("id", user?.id);

      // Call GitHub API to validate
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: { action: "validate-token" },
      });

      if (error) throw error;

      if (data?.valid) {
        setValidationResult({
          valid: true,
          username: data.username,
          avatar_url: data.avatar_url,
        });
      } else {
        setValidationResult({ valid: false });
        toast({
          title: "Invalid Token",
          description: "The token could not be validated. Check scopes and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setValidationResult({ valid: false });
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSavePat = async () => {
    if (!validationResult?.valid || !validationResult.username) return;

    try {
      await savePatConnection(pat, validationResult.username, validationResult.avatar_url || "");
      toast({
        title: "GitHub Connected",
        description: `Connected as ${validationResult.username}`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    // Also clear from profile
    await supabase
      .from("profiles")
      .update({ github_pat: null, github_username: null })
      .eq("id", user?.id);
    toast({
      title: "Disconnected",
      description: "GitHub connection removed.",
    });
  };

  if (connection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="glass p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-2">GitHub Connected</h1>
            <p className="text-muted-foreground mb-4">
              Connected as <strong>{connection.github_username}</strong>
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Connection type: {connection.type === "github_app" ? "GitHub App" : "Personal Access Token"}
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="glass p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-2">Connect GitHub</h1>
            <p className="text-muted-foreground">
              Choose how you'd like to connect your GitHub account
            </p>
          </div>

          {!showPatForm ? (
            <div className="space-y-4">
              {/* GitHub App - Recommended */}
              <button
                className="w-full p-6 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-left group"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "GitHub App installation is not yet available. Please use PAT for now.",
                  });
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-semibold">Connect GitHub</h3>
                      <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Install the Repo Bridge GitHub App for secure, scoped access.
                      No tokens to manage.
                    </p>
                  </div>
                </div>
              </button>

              {/* PAT Fallback */}
              <button
                className="w-full p-6 rounded-xl border border-border hover:border-primary/30 transition-all text-left group"
                onClick={() => setShowPatForm(true)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Key className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold mb-1">
                      Advanced: Personal Access Token
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Use a classic PAT if your org blocks app installations.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPatForm(false);
                  setPat("");
                  setValidationResult(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to options
              </Button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pat">Personal Access Token</Label>
                  <Input
                    id="pat"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={pat}
                    onChange={(e) => handlePatChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required scopes: <code>repo</code>, <code>read:user</code>
                  </p>
                </div>

                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Repo%20Bridge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Create a new token on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>

                {validationResult?.valid && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <img
                      src={validationResult.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-sm">{validationResult.username}</p>
                      <p className="text-xs text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Token validated
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!validationResult?.valid ? (
                    <Button
                      className="flex-1"
                      onClick={handleValidatePat}
                      disabled={!pat.trim() || isValidating}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Validate Token"
                      )}
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={handleSavePat}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Connect GitHub
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectGitHub;
