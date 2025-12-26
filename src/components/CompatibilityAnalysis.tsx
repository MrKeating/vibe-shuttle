import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCode, 
  Database, 
  Settings, 
  Package,
  Key,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CompatibilityItem {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    name: string;
    status: "compatible" | "needs-change" | "incompatible";
    note: string;
  }[];
}

interface CompatibilityAnalysisProps {
  source: Platform;
  destination: Platform;
}

const getCompatibilityData = (sourceId: string, destId: string): CompatibilityItem[] => {
  // Platform-specific compatibility rules
  const rules: CompatibilityItem[] = [
    {
      category: "Project Structure",
      icon: Folder,
      items: [
        { 
          name: "src/ directory", 
          status: "compatible", 
          note: "Standard React structure works across platforms" 
        },
        { 
          name: "public/ assets", 
          status: "compatible", 
          note: "Static assets transfer without changes" 
        },
        { 
          name: "Component files", 
          status: "compatible", 
          note: "React components are portable" 
        },
      ],
    },
    {
      category: "Configuration Files",
      icon: Settings,
      items: [
        { 
          name: "vite.config.ts", 
          status: destId === "replit" ? "needs-change" : "compatible", 
          note: destId === "replit" ? "Replit uses its own bundler config" : "Vite config is widely supported" 
        },
        { 
          name: "tailwind.config.ts", 
          status: "compatible", 
          note: "Tailwind CSS works on all platforms" 
        },
        { 
          name: "tsconfig.json", 
          status: "compatible", 
          note: "TypeScript config is portable" 
        },
        { 
          name: `${sourceId}.config.js`, 
          status: "needs-change", 
          note: `Platform-specific config needs removal or conversion` 
        },
      ],
    },
    {
      category: "Dependencies",
      icon: Package,
      items: [
        { 
          name: "package.json", 
          status: "compatible", 
          note: "Dependencies work across platforms" 
        },
        { 
          name: "Platform SDK", 
          status: sourceId !== destId ? "needs-change" : "compatible", 
          note: sourceId !== destId ? `Remove ${sourceId} SDK, add ${destId} SDK if needed` : "No SDK changes needed" 
        },
        { 
          name: "Lock files", 
          status: "needs-change", 
          note: "Delete and regenerate lock files on new platform" 
        },
      ],
    },
    {
      category: "Backend & Database",
      icon: Database,
      items: [
        { 
          name: "Supabase integration", 
          status: "compatible", 
          note: "Supabase works on any platform via npm package" 
        },
        { 
          name: "Edge functions", 
          status: "needs-change", 
          note: "Platform-specific serverless functions need rewriting" 
        },
        { 
          name: "Database schema", 
          status: "compatible", 
          note: "External database connections remain intact" 
        },
      ],
    },
    {
      category: "Environment & Secrets",
      icon: Key,
      items: [
        { 
          name: ".env files", 
          status: "needs-change", 
          note: "Re-add environment variables in new platform's dashboard" 
        },
        { 
          name: "API keys", 
          status: "needs-change", 
          note: "Secrets must be manually configured on new platform" 
        },
        { 
          name: "OAuth callbacks", 
          status: "needs-change", 
          note: "Update redirect URLs in OAuth provider settings" 
        },
      ],
    },
    {
      category: "Code Patterns",
      icon: FileCode,
      items: [
        { 
          name: "React components", 
          status: "compatible", 
          note: "Standard React code works everywhere" 
        },
        { 
          name: "Import aliases (@/)", 
          status: destId === "cursor" || destId === "windsurf" ? "needs-change" : "compatible", 
          note: destId === "cursor" || destId === "windsurf" ? "Verify path aliases work in local IDE" : "Import aliases are configured" 
        },
        { 
          name: "Platform-specific APIs", 
          status: "needs-change", 
          note: "Remove or replace platform-specific helper functions" 
        },
      ],
    },
  ];

  return rules;
};

export const CompatibilityAnalysis = ({ source, destination }: CompatibilityAnalysisProps) => {
  const compatibilityData = getCompatibilityData(source.id, destination.id);
  
  const summary = {
    compatible: compatibilityData.flatMap(c => c.items).filter(i => i.status === "compatible").length,
    needsChange: compatibilityData.flatMap(c => c.items).filter(i => i.status === "needs-change").length,
    incompatible: compatibilityData.flatMap(c => c.items).filter(i => i.status === "incompatible").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="glass p-4 rounded-xl border border-border">
        <h3 className="font-heading font-semibold text-foreground mb-3">Compatibility Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-heading font-bold text-xl">{summary.compatible}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ready to go</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-warning mb-1">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-heading font-bold text-xl">{summary.needsChange}</span>
            </div>
            <p className="text-xs text-muted-foreground">Need changes</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-destructive mb-1">
              <XCircle className="w-5 h-5" />
              <span className="font-heading font-bold text-xl">{summary.incompatible}</span>
            </div>
            <p className="text-xs text-muted-foreground">Not supported</p>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-4">
        {compatibilityData.map((category) => (
          <div key={category.category} className="glass rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
              <category.icon className="w-5 h-5 text-primary" />
              <h4 className="font-heading font-semibold text-foreground">{category.category}</h4>
            </div>
            <div className="divide-y divide-border">
              {category.items.map((item) => (
                <div key={item.name} className="flex items-start gap-3 p-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {item.status === "compatible" && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                    {item.status === "needs-change" && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    {item.status === "incompatible" && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      item.status === "compatible" && "text-foreground",
                      item.status === "needs-change" && "text-warning",
                      item.status === "incompatible" && "text-destructive"
                    )}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
