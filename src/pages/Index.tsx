import { GitMerge, Zap, GitBranch, LogIn, CheckCircle2, Layers, ArrowRightLeft, Crown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/HeroBackground";
import { useAuth } from "@/contexts/AuthContext";
import { PLATFORMS } from "@/lib/platformDetection";

const features = [
  {
    icon: Layers,
    title: "Multi-Repo Bridge",
    description: "Connect multiple GitHub repos from different platforms into one unified project",
  },
  {
    icon: Crown,
    title: "Smart Destination",
    description: "Automatically detects the best destination based on platform hierarchy",
  },
  {
    icon: ArrowRightLeft,
    title: "Bidirectional Sync",
    description: "Changes flow both ways — update any repo and sync across all connected repos",
  },
  {
    icon: CheckCircle2,
    title: "Folder Isolation",
    description: "Each source repo gets its own folder — no conflicts, clean organization",
  },
];

const steps = [
  {
    number: "1",
    title: "Connect GitHub",
    description: "Add your Personal Access Token to access your repositories",
  },
  {
    number: "2",
    title: "Select Repos",
    description: "Choose multiple repos from different vibe coding platforms",
  },
  {
    number: "3",
    title: "Auto-Detect Destination",
    description: "The highest priority platform becomes the main app destination",
  },
  {
    number: "4",
    title: "Sync & Collaborate",
    description: "All repos contribute to the destination — sync changes in any direction",
  },
];

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Only show top platforms for display
  const displayPlatforms = PLATFORMS.slice(0, 6);

  return (
    <div className="min-h-screen relative">
      <HeroBackground />

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <GitMerge className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">VibeBridge</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="glow" size="sm" onClick={() => navigate("/dashboard")}>
                <GitMerge className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <Button variant="glow" size="sm" onClick={() => navigate("/auth")}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Bridge Multiple Repos{" "}
            <span className="gradient-text">Into One Project</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Work on the same project across Lovable, Bolt, Replit, Cursor, and more.
            Connect GitHub repos, choose a destination platform, and sync code bidirectionally.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="glow"
              size="xl"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="min-w-[200px]"
            >
              <GitMerge className="w-5 h-5 mr-2" />
              Start Bridging
            </Button>
          </div>
        </div>

        {/* Platform Priority Display */}
        <section
          className="max-w-4xl mx-auto mb-20 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="glass p-6 rounded-2xl border border-primary/20">
            <h3 className="font-heading text-lg font-semibold mb-4 text-center">
              Platform Hierarchy
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              The highest priority platform automatically becomes your destination
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {displayPlatforms.map((platform, index) => (
                <div
                  key={platform.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border"
                  style={{
                    borderColor: `${platform.color}40`,
                    backgroundColor: `${platform.color}10`,
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: platform.color, color: "#fff" }}
                  >
                    {index + 1}
                  </span>
                  <span className="font-medium" style={{ color: platform.color }}>
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section
          className="max-w-5xl mx-auto mb-20 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            How <span className="gradient-text">VibeBridge</span> Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="glass p-6 rounded-xl relative"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                  {step.number}
                </div>
                <h3 className="font-heading font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case */}
        <section
          className="max-w-4xl mx-auto mb-20 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="glass p-8 rounded-2xl border border-primary/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="font-heading text-xl font-semibold mb-3">
                  Built for Vibe Coders
                </h3>
                <p className="text-muted-foreground mb-4">
                  Working across multiple AI coding platforms? VibeBridge lets your team
                  use their favorite tools while keeping everything synced. Lovable becomes
                  the main destination, with Bolt, Replit, and others contributing via their
                  own folders.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Perfect for teams using different vibe coding tools</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <GitMerge className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          className="max-w-5xl mx-auto animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            Why Use <span className="gradient-text">VibeBridge</span>?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/30"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-8 mt-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 VibeBridge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
