import { useState } from "react";
import { ArrowRight, Zap, Shield, Clock, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformCard } from "@/components/PlatformCard";
import { TransferFlow } from "@/components/TransferFlow";
import { StepIndicator } from "@/components/StepIndicator";
import { HeroBackground } from "@/components/HeroBackground";
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
  { id: 1, title: "Select Source", description: "Choose where your project is" },
  { id: 2, title: "Select Destination", description: "Choose where to transfer" },
  { id: 3, title: "Transfer", description: "Migrate your project" },
];

const features = [
  { icon: Zap, title: "Instant Transfer", description: "Move your projects in seconds with our optimized pipeline" },
  { icon: Shield, title: "Secure Migration", description: "Your code stays private and encrypted during transfer" },
  { icon: Clock, title: "Version History", description: "Keep your git history and project timeline intact" },
  { icon: Code2, title: "Full Compatibility", description: "Support for all major vibe coding platforms" },
];

const Index = () => {
  const [source, setSource] = useState<typeof platforms[0] | null>(null);
  const [destination, setDestination] = useState<typeof platforms[0] | null>(null);
  const { toast } = useToast();

  const currentStep = !source ? 1 : !destination ? 2 : 3;

  const handleTransfer = () => {
    if (source && destination) {
      toast({
        title: "Transfer Initiated",
        description: `Preparing to transfer from ${source.name} to ${destination.name}...`,
      });
    }
  };

  const resetSelection = () => {
    setSource(null);
    setDestination(null);
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
            Documentation
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up">
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Transfer Your <span className="gradient-text">Vibe Coding</span> Projects
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly migrate your AI-built projects between platforms. 
            From Lovable to Bolt, Cursor to Replit — switch without losing a single line.
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

        {/* Platform Selection */}
        <div className="max-w-5xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Source Selection */}
            <div>
              <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                Select Source Platform
              </h2>
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
            <div>
              <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Select Destination Platform
              </h2>
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
            onClick={handleTransfer}
            disabled={!source || !destination}
            className="min-w-[200px]"
          >
            Start Transfer
            <ArrowRight className="w-5 h-5" />
          </Button>
          {(source || destination) && (
            <Button variant="ghost" size="lg" onClick={resetSelection}>
              Reset Selection
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-12">
            Why Choose <span className="gradient-text">VibeShift</span>
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
