import { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SetupStep {
  title: string;
  description: string;
  command?: string;
  link?: string;
  linkText?: string;
}

interface ConfigFile {
  name: string;
  status: "can-coexist" | "may-conflict" | "platform-specific";
  note: string;
  platforms: string[];
}

const configFiles: ConfigFile[] = [
  { 
    name: "package.json", 
    status: "can-coexist", 
    note: "Shared across all platforms - dependencies work everywhere",
    platforms: ["all"]
  },
  { 
    name: "vite.config.ts", 
    status: "can-coexist", 
    note: "Works with Lovable, Bolt, v0, Cursor, Windsurf",
    platforms: ["lovable", "bolt", "v0", "cursor", "windsurf"]
  },
  { 
    name: "tailwind.config.ts", 
    status: "can-coexist", 
    note: "Universal Tailwind config works everywhere",
    platforms: ["all"]
  },
  { 
    name: ".replit", 
    status: "platform-specific", 
    note: "Replit-only config - safe to keep, ignored by others",
    platforms: ["replit"]
  },
  { 
    name: "replit.nix", 
    status: "platform-specific", 
    note: "Replit Nix environment - safe to keep",
    platforms: ["replit"]
  },
  { 
    name: ".cursorrules", 
    status: "platform-specific", 
    note: "Cursor AI instructions - safe to keep",
    platforms: ["cursor"]
  },
  { 
    name: ".windsurfrules", 
    status: "platform-specific", 
    note: "Windsurf AI instructions - safe to keep",
    platforms: ["windsurf"]
  },
  { 
    name: "supabase/", 
    status: "can-coexist", 
    note: "Supabase config works with any platform",
    platforms: ["all"]
  },
];

const getSetupSteps = (platformId: string): SetupStep[] => {
  const steps: Record<string, SetupStep[]> = {
    lovable: [
      { title: "Connect GitHub", description: "In Lovable, go to Settings → GitHub and connect your repository" },
      { title: "Sync project", description: "Lovable will automatically sync with your GitHub repo" },
    ],
    bolt: [
      { title: "Import from GitHub", description: "Use Bolt's GitHub import feature to connect your repo" },
      { title: "Configure environment", description: "Add any required environment variables in Bolt's settings" },
    ],
    cursor: [
      { title: "Clone repository", description: "Clone the repo locally using git", command: "git clone <your-repo-url>" },
      { title: "Open in Cursor", description: "Open the cloned folder in Cursor IDE" },
      { title: "Install dependencies", description: "Run npm install to set up the project", command: "npm install" },
    ],
    windsurf: [
      { title: "Clone repository", description: "Clone the repo locally using git", command: "git clone <your-repo-url>" },
      { title: "Open in Windsurf", description: "Open the cloned folder in Windsurf IDE" },
      { title: "Install dependencies", description: "Run npm install to set up the project", command: "npm install" },
    ],
    replit: [
      { title: "Import from GitHub", description: "Click 'Create Repl' → 'Import from GitHub'" },
      { title: "Configure run command", description: "Set the run command to 'npm run dev'" },
      { title: "Add secrets", description: "Add environment variables in Replit's Secrets tab" },
    ],
    v0: [
      { title: "Import project", description: "Use v0's project import feature with your GitHub URL" },
      { title: "Generate components", description: "Use v0 to generate UI components, then export to your repo" },
    ],
    "google-ai": [
      { title: "Open in AI Studio", description: "Import your project into Google AI Studio" },
      { title: "Configure API keys", description: "Add any required Google Cloud API keys" },
    ],
    base44: [
      { title: "Import project", description: "Use Base44's import feature to connect your GitHub repo" },
      { title: "Configure database", description: "Set up any required database connections" },
    ],
    huggingface: [
      { title: "Clone repository", description: "Clone the repo locally using git", command: "git clone <your-repo-url>" },
      { title: "Install dependencies", description: "Run npm install to set up the project", command: "npm install" },
      { title: "Add Hugging Face token", description: "Get your access token from Hugging Face settings", link: "https://huggingface.co/settings/tokens", linkText: "Get Token" },
      { title: "Use transformers.js", description: "Import @huggingface/transformers for in-browser AI models" },
    ],
  };
  
  return steps[platformId] || [];
};

interface MultiToolSetupProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  repoUrl: string;
}

export const MultiToolSetup = ({ platforms, selectedPlatforms, repoUrl }: MultiToolSetupProps) => {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const { toast } = useToast();
  
  const selected = platforms.filter(p => selectedPlatforms.includes(p.id));
  
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command.replace("<your-repo-url>", repoUrl || "<your-repo-url>"));
    toast({ title: "Copied to clipboard" });
  };

  if (selected.length === 0) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-muted-foreground">Select platforms to see setup instructions</p>
      </div>
    );
  }

  // Get relevant config files
  const relevantConfigs = configFiles.filter(c => 
    c.platforms.includes("all") || 
    c.platforms.some(p => selectedPlatforms.includes(p))
  );

  return (
    <div className="space-y-6">
      {/* Config Coexistence */}
      <div className="glass p-6 rounded-xl border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          Config File Compatibility
        </h3>
        <div className="space-y-2">
          {relevantConfigs.map((config) => (
            <div key={config.name} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex-shrink-0 mt-0.5">
                {config.status === "can-coexist" && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
                {config.status === "may-conflict" && (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                {config.status === "platform-specific" && (
                  <Info className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-mono text-sm text-foreground">{config.name}</p>
                <p className="text-xs text-muted-foreground">{config.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Setup Instructions */}
      <div className="space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Setup Instructions</h3>
        {selected.map((platform) => {
          const steps = getSetupSteps(platform.id);
          const isExpanded = expandedPlatform === platform.id;
          
          return (
            <div key={platform.id} className="glass rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    {platform.icon}
                  </div>
                  <span className="font-heading font-medium text-foreground">{platform.name}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="border-t border-border p-4 space-y-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        {step.command && (
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 text-xs bg-secondary/50 px-3 py-2 rounded font-mono text-foreground">
                              {step.command.replace("<your-repo-url>", repoUrl || "<your-repo-url>")}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyCommand(step.command!)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {step.link && (
                          <a 
                            href={step.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            {step.linkText || "Learn more"}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
