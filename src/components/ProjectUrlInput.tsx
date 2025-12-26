import { useState, useEffect } from "react";
import { Link2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProjectUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (isValid: boolean, projectInfo?: ProjectInfo) => void;
  platformId: string | null;
}

export interface ProjectInfo {
  name: string;
  owner: string;
  files: number;
  lastUpdated: string;
}

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

const platformUrlPatterns: Record<string, RegExp> = {
  lovable: /^https?:\/\/(www\.)?lovable\.dev\/projects\/[\w-]+$/,
  bolt: /^https?:\/\/(www\.)?bolt\.new\/[\w-]+\/[\w-]+$/,
  "google-ai": /^https?:\/\/(www\.)?(aistudio\.google\.com|studio\.ai\.google)\/[\w/-]+$/,
  base44: /^https?:\/\/(www\.)?base44\.app\/projects\/[\w-]+$/,
  cursor: /^https?:\/\/(www\.)?cursor\.sh\/[\w-]+$/,
  replit: /^https?:\/\/(www\.)?replit\.com\/@[\w-]+\/[\w-]+$/,
  v0: /^https?:\/\/(www\.)?v0\.dev\/[\w-]+$/,
  windsurf: /^https?:\/\/(www\.)?windsurf\.dev\/projects\/[\w-]+$/,
  github: /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+$/,
};

const getPlaceholder = (platformId: string | null): string => {
  const placeholders: Record<string, string> = {
    lovable: "https://lovable.dev/projects/your-project",
    bolt: "https://bolt.new/username/project-name",
    "google-ai": "https://aistudio.google.com/app/prompts/...",
    base44: "https://base44.app/projects/your-project",
    cursor: "https://cursor.sh/your-project",
    replit: "https://replit.com/@username/project-name",
    v0: "https://v0.dev/your-project",
    windsurf: "https://windsurf.dev/projects/your-project",
  };
  return placeholders[platformId || ""] || "Enter your project URL or GitHub repository URL";
};

export const ProjectUrlInput = ({ 
  value, 
  onChange, 
  onValidationChange, 
  platformId 
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if URL matches GitHub or platform pattern
      const isGitHubUrl = platformUrlPatterns.github.test(value);
      const isPlatformUrl = platformId && platformUrlPatterns[platformId]?.test(value);
      
      // More lenient validation - accept any valid URL-like structure
      const isValidUrl = /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/[\w./-]*)*$/i.test(value);

      if (isGitHubUrl || isPlatformUrl || isValidUrl) {
        // Simulate fetching project info
        const mockProjectInfo: ProjectInfo = {
          name: extractProjectName(value),
          owner: extractOwner(value),
          files: Math.floor(Math.random() * 100) + 20,
          lastUpdated: "2 days ago",
        };
        
        setProjectInfo(mockProjectInfo);
        setStatus("valid");
        onValidationChange(true, mockProjectInfo);
      } else {
        setStatus("invalid");
        setError("Please enter a valid project URL");
        onValidationChange(false);
      }
    };

    const debounceTimer = setTimeout(validateUrl, 500);
    return () => clearTimeout(debounceTimer);
  }, [value, platformId, onValidationChange]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder(platformId)}
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
            <div>
              <p className="font-heading font-semibold text-foreground">{projectInfo.name}</p>
              <p className="text-sm text-muted-foreground">by {projectInfo.owner}</p>
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
