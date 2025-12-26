import { useState, useCallback } from "react";
import { ArrowRight, Zap, GitBranch, BookOpen, Code2, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformCard } from "@/components/PlatformCard";
import { TransferFlow } from "@/components/TransferFlow";
import { StepIndicator } from "@/components/StepIndicator";
import { HeroBackground } from "@/components/HeroBackground";
import { ProjectUrlInput, type ProjectInfo } from "@/components/ProjectUrlInput";
import { MigrationGuide } from "@/components/MigrationGuide";
import { useToast } from "@/hooks/use-toast";

const platforms = [
  { id: "lovable", name: "Lovable", icon: "💜", color: "#9b87f5" },
  { id: "bolt", name: "Bolt.new", icon: "⚡", color: "#FFD700" },
  { id: "google-ai", name: "Google AI Studio", icon: "🌐", color: "#4285F4" },
  { id: "base44", name: "Base44", icon: "🔷", color: "#0EA5E9" },
  { id: "cursor", name: "Cursor", icon: "▲", color: "#00D4AA" },
  { id: "replit", name: "Replit", icon: "🔶", color: "#F26207" },
  { id: "v0", name: "v0.dev", icon: "◆", color: "#ffffff" },
  { id: "windsurf", name: "Windsurf", icon: "🌊", color: "#06B6D4" },
];

const steps = [
  { id: 1, title: "GitHub URL", description: "Paste your repo link" },
  { id: 2, title: "Source Platform", description: "Where it's from" },
  { id: 3, title: "Destination", description: "Where to migrate" },
  { id: 4, title: "Analyze", description: "View migration guide" },
];

const features = [
  { icon: GitBranch, title: "GitHub-First", description: "Works with any GitHub-connected project across platforms" },
  { icon: BookOpen, title: "Compatibility Analysis", description: "See exactly what needs to change before you migrate" },
  { icon: Zap, title: "Step-by-Step Guide", description: "Clear instructions and commands for each migration step" },
  { icon: Code2, title: "Platform Insights", description: "Understand config differences between AI coding tools" },
];

const Index = () => {
  const [source, setSource] = useState<typeof platforms[0] | null>(null);
  const [destination, setDestination] = useState<typeof platforms[0] | null>(null);
  const [projectUrl, setProjectUrl] = useState("");
  const [isProjectValid, setIsProjectValid] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  const currentStep = !isProjectValid ? 1 : !source ? 2 : !destination ? 3 : 4;

  const handleValidationChange = useCallback((isValid: boolean, info?: ProjectInfo) => {
    setIsProjectValid(isValid);
    setProjectInfo(info || null);
  }, []);

  const handleAnalyze = () => {
    if (source && destination && isProjectValid) {
      setShowGuide(true);
    }
  };

  const resetSelection = () => {
    setSource(null);
    setDestination(null);
    setProjectUrl("");
    setIsProjectValid(false);
    setProjectInfo(null);
    setShowGuide(false);
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">VibeShift</span>
          </div>
          <Button variant="glass" size="sm">
            <Github className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Migrate Your <span className="gradient-text">Vibe Coding</span> Projects
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze compatibility and get step-by-step migration guides for moving 
            GitHub-connected projects between AI coding platforms.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Transfer Flow Visualization */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <TransferFlow source={source} destination={destination} />
        </div>

        {/* Migration Guide Modal */}
        {showGuide && source && destination && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <MigrationGuide
              source={source}
              destination={destination}
              projectInfo={projectInfo}
              projectUrl={projectUrl}
              onClose={resetSelection}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-5xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* GitHub URL Input - First Step */}
          <div className="glass p-6 rounded-2xl mb-8">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
              Enter GitHub Repository URL
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Paste the GitHub URL of your project. This works with any platform that syncs to GitHub.
            </p>
            <ProjectUrlInput
              value={projectUrl}
              onChange={setProjectUrl}
              onValidationChange={handleValidationChange}
            />
          </div>

          {/* Platform Selection */}
          <div className={`grid md:grid-cols-2 gap-8 ${!isProjectValid ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Source Selection */}
            <div>
              <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Original Platform
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Which platform was this project built on?
              </p>
              <div className="grid gap-3">
                {platforms.map((platform) => (
                  <PlatformCard
                    key={`source-${platform.id}`}
                    platform={platform}
                    isSelected={source?.id === platform.id}
                    onClick={() => {
                      setSource(platform);
                      if (destination?.id === platform.id) {
                        setDestination(null);
                      }
                    }}
                    disabled={destination?.id === platform.id}
                  />
                ))}
              </div>
            </div>

            {/* Destination Selection */}
            <div className={!source ? 'opacity-50 pointer-events-none' : ''}>
              <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                Destination Platform
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Where do you want to migrate this project?
              </p>
              <div className="grid gap-3">
                {platforms.map((platform) => (
                  <PlatformCard
                    key={`dest-${platform.id}`}
                    platform={platform}
                    isSelected={destination?.id === platform.id}
                    onClick={() => setDestination(platform)}
                    disabled={source?.id === platform.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Button
            variant="glow"
            size="xl"
            onClick={handleAnalyze}
            disabled={!source || !destination || !isProjectValid}
            className="min-w-[200px]"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Analyze Compatibility
          </Button>
          {(source || destination || projectUrl) && (
            <Button variant="ghost" size="lg" onClick={resetSelection}>
              Reset Selection
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            How <span className="gradient-text">VibeShift</span> Helps
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
          <p>© 2024 VibeShift. All rights reserved.</p>
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
