import { GitMerge, Zap, GitBranch, LogIn, CheckCircle2, Eye, FolderSync } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/HeroBackground";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: GitMerge, title: "Smart Merge", description: "Intelligently combine files from two repos with conflict detection" },
  { icon: Eye, title: "Diff Preview", description: "See side-by-side comparison of conflicting files before merging" },
  { icon: FolderSync, title: "Flexible Output", description: "Create a new repo or push merged code to an existing one" },
  { icon: CheckCircle2, title: "Conflict Resolution", description: "Choose which version to keep for each conflicting file" },
];

const steps = [
  { number: "1", title: "Connect GitHub", description: "Add your Personal Access Token to access your repositories" },
  { number: "2", title: "Select Two Repos", description: "Pick the source and target repositories you want to merge" },
  { number: "3", title: "Review & Resolve", description: "Preview file differences and resolve any conflicts" },
  { number: "4", title: "Merge & Deploy", description: "Create a new merged repo or push to an existing one" },
];

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
            <span className="font-heading font-bold text-xl">VibeMerge</span>
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
            Merge Two Repos, <span className="gradient-text">One Click</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Built something in Lovable and the same thing in Google AI Studio? 
            Merge both GitHub repos into one unified codebase with smart conflict resolution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="glow"
              size="xl"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="min-w-[200px]"
            >
              <GitMerge className="w-5 h-5 mr-2" />
              Start Merging
            </Button>
          </div>
        </div>

        {/* How it Works */}
        <section className="max-w-5xl mx-auto mb-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            How <span className="gradient-text">VibeMerge</span> Works
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
        <section className="max-w-4xl mx-auto mb-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="glass p-8 rounded-2xl border border-primary/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="font-heading text-xl font-semibold mb-3">
                  Perfect for Vibe Coders
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you've built the same app with different AI tools — Lovable for the UI, 
                  Google AI Studio for backend logic — VibeMerge intelligently combines them. 
                  Review conflicts side-by-side and pick the best of both worlds.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Lovable", "Google AI Studio", "Bolt.new", "Cursor", "Replit", "v0"].map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {tool}
                    </span>
                  ))}
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
        <section className="max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            Why Use <span className="gradient-text">VibeMerge</span>?
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
          <p>© 2024 VibeMerge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;