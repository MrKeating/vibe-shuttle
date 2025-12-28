import { 
  Sparkles, 
  Code2, 
  Palette, 
  Server, 
  Zap, 
  Users, 
  Rocket,
  Terminal,
  Database,
  GitBranch
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface PlatformStrength {
  strength: string;
  icon: React.ComponentType<{ className?: string }>;
}

const platformStrengths: Record<string, { tagline: string; strengths: PlatformStrength[]; bestFor: string }> = {
  lovable: {
    tagline: "AI-first full-stack development",
    strengths: [
      { strength: "Rapid prototyping & UI generation", icon: Sparkles },
      { strength: "Built-in backend (Lovable Cloud)", icon: Database },
      { strength: "Real-time preview & collaboration", icon: Users },
    ],
    bestFor: "Building complete apps from scratch with AI assistance",
  },
  bolt: {
    tagline: "Lightning-fast code generation",
    strengths: [
      { strength: "Quick component scaffolding", icon: Zap },
      { strength: "Multi-file generation", icon: Code2 },
      { strength: "Fast iteration cycles", icon: Rocket },
    ],
    bestFor: "Rapid prototyping and exploring ideas quickly",
  },
  cursor: {
    tagline: "AI-powered code editor",
    strengths: [
      { strength: "Deep codebase understanding", icon: Code2 },
      { strength: "Complex refactoring", icon: Terminal },
      { strength: "Full IDE experience", icon: GitBranch },
    ],
    bestFor: "Complex logic, debugging, and code architecture",
  },
  windsurf: {
    tagline: "Agentic IDE experience",
    strengths: [
      { strength: "Multi-step task automation", icon: Rocket },
      { strength: "Deep context awareness", icon: Code2 },
      { strength: "Local development power", icon: Terminal },
    ],
    bestFor: "Autonomous multi-file changes and refactoring",
  },
  replit: {
    tagline: "Cloud development environment",
    strengths: [
      { strength: "Instant deployment", icon: Server },
      { strength: "Built-in hosting & database", icon: Database },
      { strength: "Multiplayer collaboration", icon: Users },
    ],
    bestFor: "Testing deployments and backend logic",
  },
  v0: {
    tagline: "UI component generation",
    strengths: [
      { strength: "Beautiful UI components", icon: Palette },
      { strength: "Shadcn/Tailwind native", icon: Sparkles },
      { strength: "Quick iteration on design", icon: Rocket },
    ],
    bestFor: "Generating polished UI components and layouts",
  },
  "google-ai": {
    tagline: "Google's AI development platform",
    strengths: [
      { strength: "Gemini model integration", icon: Sparkles },
      { strength: "Google Cloud ecosystem", icon: Server },
      { strength: "Advanced AI capabilities", icon: Zap },
    ],
    bestFor: "AI-heavy features and Google Cloud integration",
  },
  base44: {
    tagline: "Visual app builder",
    strengths: [
      { strength: "No-code capabilities", icon: Palette },
      { strength: "Database integration", icon: Database },
      { strength: "Quick app deployment", icon: Rocket },
    ],
    bestFor: "Visual app building with minimal coding",
  },
};

interface PlatformStrengthsProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  className?: string;
}

export const PlatformStrengths = ({ platforms, selectedPlatforms, className }: PlatformStrengthsProps) => {
  const selected = platforms.filter(p => selectedPlatforms.includes(p.id));
  
  if (selected.length === 0) {
    return (
      <div className={cn("glass p-8 rounded-2xl text-center", className)}>
        <p className="text-muted-foreground">Select platforms above to see their strengths and best use cases</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", selected.length > 1 ? "md:grid-cols-2" : "", className)}>
      {selected.map((platform) => {
        const info = platformStrengths[platform.id];
        if (!info) return null;
        
        return (
          <div 
            key={platform.id} 
            className="glass p-6 rounded-xl border border-border hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${platform.color}20` }}
              >
                {platform.icon}
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">{info.tagline}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {info.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <s.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{s.strength}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">Best for:</span> {info.bestFor}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
