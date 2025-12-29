import { useState, useCallback } from "react";
import { Layers, Zap, GitBranch, LogIn, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlatformCard } from "@/components/PlatformCard";
import { StepIndicator } from "@/components/StepIndicator";
import { HeroBackground } from "@/components/HeroBackground";
import { ProjectUrlInput, type ProjectInfo } from "@/components/ProjectUrlInput";
import { PlatformStrengths } from "@/components/PlatformStrengths";
import { MultiToolSetup } from "@/components/MultiToolSetup";
import { useAuth } from "@/contexts/AuthContext";

const platforms = [
  { id: "lovable", name: "Lovable", icon: "💜", color: "#9b87f5" },
  { id: "bolt", name: "Bolt.new", icon: "⚡", color: "#FFD700" },
  { id: "google-ai", name: "Google AI Studio", icon: "🌐", color: "#4285F4" },
  { id: "base44", name: "Base44", icon: "🔷", color: "#0EA5E9" },
  { id: "cursor", name: "Cursor", icon: "▲", color: "#00D4AA" },
  { id: "replit", name: "Replit", icon: "🔶", color: "#F26207" },
  { id: "v0", name: "v0.dev", icon: "◆", color: "#ffffff" },
  { id: "windsurf", name: "Windsurf", icon: "🌊", color: "#06B6D4" },
  { id: "huggingface", name: "Hugging Face", icon: "🤗", color: "#FFD21E" },
];

const steps = [
  { id: 1, title: "GitHub Repo", description: "Your project hub" },
  { id: 2, title: "Select Tools", description: "Choose platforms" },
  { id: 3, title: "View Setup", description: "Get started" },
];

const features = [
  { icon: GitBranch, title: "GitHub as Hub", description: "Your repo is the central source of truth - work from any platform" },
  { icon: Layers, title: "Multi-Tool Workflow", description: "Use each tool for what it does best, all on the same project" },
  { icon: Zap, title: "Config Coexistence", description: "Platform-specific files can safely live together in your repo" },
  { icon: CheckCircle2, title: "Seamless Switching", description: "Jump between tools without breaking your project" },
];

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [projectUrl, setProjectUrl] = useState("");
  const [isProjectValid, setIsProjectValid] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const currentStep = !isProjectValid ? 1 : selectedPlatforms.length === 0 ? 2 : 3;

  const handleValidationChange = useCallback((isValid: boolean, info?: ProjectInfo) => {
    setIsProjectValid(isValid);
    setProjectInfo(info || null);
  }, []);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleShowSetup = () => {
    if (selectedPlatforms.length > 0 && isProjectValid) {
      setShowSetup(true);
    }
  };

  const resetSelection = () => {
    setSelectedPlatforms([]);
    setProjectUrl("");
    setIsProjectValid(false);
    setProjectInfo(null);
    setShowSetup(false);
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">VibeBridge</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="glow" size="sm" onClick={() => navigate("/dashboard")}>
                <Layers className="w-4 h-4 mr-2" />
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
            One Repo, <span className="gradient-text">Multiple AI Tools</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Use GitHub as your central hub. Work on the same project with Lovable, Cursor, Bolt, 
            and more — each tool for what it does best.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Setup Modal */}
        {showSetup && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass w-full max-w-4xl my-8 rounded-2xl border border-border max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">Multi-Tool Setup Guide</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure your project for {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowSetup(false)}>Close</Button>
              </div>
              <div className="p-6">
                <MultiToolSetup 
                  platforms={platforms}
                  selectedPlatforms={selectedPlatforms}
                  repoUrl={projectUrl}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-5xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* GitHub URL Input - Step 1 */}
          <div className="glass p-6 rounded-2xl mb-8">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              Enter GitHub Repository URL
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              This is your project's central hub. All platforms will sync to this repo.
            </p>
            <ProjectUrlInput
              value={projectUrl}
              onChange={setProjectUrl}
              onValidationChange={handleValidationChange}
            />
          </div>

          {/* Platform Selection - Step 2 */}
          <div className={`glass p-6 rounded-2xl mb-8 ${!isProjectValid ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
              Select Your Tools
              {selectedPlatforms.length > 0 && (
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {selectedPlatforms.length} selected
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose all the AI coding platforms you want to use with this project. Mix and match based on their strengths.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {platforms.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatforms.includes(platform.id)}
                  onClick={() => togglePlatform(platform.id)}
                />
              ))}
            </div>
            
            {/* Platform Strengths */}
            <PlatformStrengths 
              platforms={platforms}
              selectedPlatforms={selectedPlatforms}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Button
            variant="glow"
            size="xl"
            onClick={handleShowSetup}
            disabled={selectedPlatforms.length === 0 || !isProjectValid}
            className="min-w-[200px]"
          >
            <Layers className="w-5 h-5 mr-2" />
            View Setup Guide
          </Button>
          {(selectedPlatforms.length > 0 || projectUrl) && (
            <Button variant="ghost" size="lg" onClick={resetSelection}>
              Reset Selection
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
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
