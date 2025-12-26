import { useState } from "react";
import { 
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Github,
  BookOpen,
  Terminal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompatibilityAnalysis } from "./CompatibilityAnalysis";
import type { ProjectInfo } from "./ProjectUrlInput";
import { useToast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface MigrationGuideProps {
  source: Platform;
  destination: Platform;
  projectInfo: ProjectInfo | null;
  projectUrl: string;
  onClose: () => void;
}

interface MigrationStep {
  title: string;
  description: string;
  command?: string;
  link?: { url: string; label: string };
}

const getMigrationSteps = (source: Platform, destination: Platform, projectUrl: string): MigrationStep[] => {
  const steps: MigrationStep[] = [
    {
      title: "1. Export to GitHub",
      description: source.id === "github" 
        ? "Your project is already on GitHub. Make sure all changes are committed and pushed."
        : `Connect your ${source.name} project to GitHub and push all changes.`,
      link: source.id !== "github" ? { 
        url: `https://docs.${source.id}.dev/github`, 
        label: `${source.name} GitHub integration docs` 
      } : undefined,
    },
    {
      title: "2. Clone the repository",
      description: "Clone your GitHub repository to your local machine or the new platform.",
      command: projectUrl.includes("github.com") 
        ? `git clone ${projectUrl}.git`
        : `git clone https://github.com/your-username/your-repo.git`,
    },
    {
      title: "3. Remove platform-specific files",
      description: `Delete configuration files specific to ${source.name} that won't work on ${destination.name}.`,
      command: `rm -f ${source.id}.config.js .${source.id}rc`,
    },
    {
      title: "4. Update dependencies",
      description: "Remove old platform SDKs and install fresh dependencies.",
      command: `rm -rf node_modules package-lock.json\nnpm install`,
    },
    {
      title: "5. Configure environment variables",
      description: `Add your environment variables to ${destination.name}'s dashboard. API keys, database URLs, and OAuth secrets need to be re-added manually.`,
    },
    {
      title: "6. Import to destination",
      description: `Import your GitHub repository into ${destination.name}.`,
      link: { 
        url: getImportUrl(destination.id), 
        label: `Import to ${destination.name}` 
      },
    },
    {
      title: "7. Test and verify",
      description: "Run your application and verify all features work correctly. Check database connections, authentication, and API integrations.",
    },
  ];

  return steps;
};

const getImportUrl = (platformId: string): string => {
  const urls: Record<string, string> = {
    lovable: "https://lovable.dev/projects/github-import",
    bolt: "https://bolt.new/import",
    replit: "https://replit.com/new/github",
    cursor: "https://cursor.sh",
    v0: "https://v0.dev",
    windsurf: "https://windsurf.dev",
    "google-ai": "https://aistudio.google.com",
    base44: "https://base44.app",
  };
  return urls[platformId] || "#";
};

export const MigrationGuide = ({ 
  source, 
  destination, 
  projectInfo,
  projectUrl,
  onClose 
}: MigrationGuideProps) => {
  const [activeTab, setActiveTab] = useState<"compatibility" | "steps">("compatibility");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  const steps = getMigrationSteps(source, destination, projectUrl);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="glass rounded-2xl max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${source.color}20` }}
            >
              {source.icon}
            </div>
            <ArrowRight className="w-6 h-6 text-primary" />
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${destination.color}20` }}
            >
              {destination.icon}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-semibold text-foreground">
              {projectInfo?.name || "Migration Guide"}
            </p>
            <p className="text-sm text-muted-foreground">
              {source.name} → {destination.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          <Button
            variant={activeTab === "compatibility" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("compatibility")}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Compatibility
          </Button>
          <Button
            variant={activeTab === "steps" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("steps")}
          >
            <Terminal className="w-4 h-4 mr-2" />
            Migration Steps
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "compatibility" && (
          <CompatibilityAnalysis source={source} destination={destination} />
        )}

        {activeTab === "steps" && (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="glass rounded-xl border border-border p-4"
              >
                <h4 className="font-heading font-semibold text-foreground mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {step.description}
                </p>
                
                {step.command && (
                  <div className="relative bg-background/50 rounded-lg p-3 font-mono text-sm">
                    <pre className="text-foreground whitespace-pre-wrap">{step.command}</pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(step.command!)}
                    >
                      {copiedCommand === step.command ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}

                {step.link && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.open(step.link!.url, "_blank")}
                  >
                    {step.link.label}
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(projectUrl.includes("github.com") ? projectUrl : "#", "_blank")}
          >
            <Github className="w-4 h-4 mr-2" />
            View on GitHub
          </Button>
          <Button
            variant="glow"
            onClick={() => window.open(getImportUrl(destination.id), "_blank")}
          >
            Open {destination.name}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
