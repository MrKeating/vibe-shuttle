import { useState, useEffect } from "react";
import { Link2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProjectUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean, projectInfo?: ProjectInfo) => void;
}

export interface ProjectInfo {
  name: string;
  owner: string;
  files: number;
  lastUpdated: string;
  isGitHub: boolean;
}

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export const ProjectUrlInput = ({ 
  value, 
  onChange, 
  onValidationChange
}: ProjectUrlInputProps) => {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!value.trim()) {
      setStatus("idle");
      setProjectInfo(null);
      setError("");
      onValidationChange(false);
      return;
    }

    const validateUrl = async () => {
      setStatus("validating");
      setError("");
      
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const isGitHubUrl = githubUrlPattern.test(value.trim());

      if (isGitHubUrl) {
        // Simulate fetching project info from GitHub
        const mockProjectInfo: ProjectInfo = {
          name: extractProjectName(value),
          owner: extractOwner(value),
          files: Math.floor(Math.random() * 100) + 20,
          lastUpdated: "2 days ago",
          isGitHub: true,
        };
        
        setProjectInfo(mockProjectInfo);
        setStatus("valid");
        onValidationChange(true, mockProjectInfo);
      } else {
        setStatus("invalid");
        setError("Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)");
        onValidationChange(false);
      }
    };

    const debounceTimer = setTimeout(validateUrl, 500);
    return () => clearTimeout(debounceTimer);
  }, [value, onValidationChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://github.com/username/repository"
          className={cn(
            "pl-12 pr-12 h-14 glass border-border bg-secondary/50 text-base",
            "placeholder:text-muted-foreground focus-visible:ring-primary",
            status === "valid" && "border-primary/50",
            status === "invalid" && "border-destructive/50"
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {status === "validating" && (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
          {status === "valid" && (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          )}
          {status === "invalid" && (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
        </div>
      </div>

      {/* Validation feedback */}
      {status === "invalid" && error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Project info preview */}
      {status === "valid" && projectInfo && (
        <div className="glass p-4 rounded-xl border border-primary/20 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground">{projectInfo.name}</p>
                <p className="text-sm text-muted-foreground">by {projectInfo.owner}</p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{projectInfo.files} files</p>
              <p>Updated {projectInfo.lastUpdated}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function extractProjectName(url: string): string {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1]?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Project";
}

function extractOwner(url: string): string {
  const match = url.match(/@?([\w-]+)\//);
  if (match) return match[1];
  const parts = url.split("/").filter(Boolean);
  return parts.length > 2 ? parts[2] : "Unknown";
}
