import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  FileCode, 
  Database, 
  Settings, 
  Upload,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "./ProjectUrlInput";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TransferWizardProps {
  source: Platform;
  destination: Platform;
  projectInfo: ProjectInfo | null;
  projectUrl: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface TransferStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "in-progress" | "completed" | "error";
  details?: string;
}

const initialSteps: Omit<TransferStep, "status" | "details">[] = [
  { id: "analyze", title: "Analyzing Project", description: "Scanning project structure and dependencies", icon: FileCode },
  { id: "export", title: "Exporting Data", description: "Extracting files, configs, and metadata", icon: Database },
  { id: "transform", title: "Transforming Code", description: "Adapting code for destination platform", icon: Settings },
  { id: "upload", title: "Uploading Project", description: "Transferring to destination platform", icon: Upload },
];

export const TransferWizard = ({ 
  source, 
  destination, 
  projectInfo,
  projectUrl,
  onComplete, 
  onCancel 
}: TransferWizardProps) => {
  const [steps, setSteps] = useState<TransferStep[]>(
    initialSteps.map(s => ({ ...s, status: "pending" as const }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const startTransfer = async () => {
    setIsTransferring(true);
    setHasError(false);
    addLog(`Starting transfer from ${source.name} to ${destination.name}`);
    addLog(`Project: ${projectInfo?.name || 'Unknown'} (${projectUrl})`);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      
      // Set current step to in-progress
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: "in-progress" } : s
      ));
      
      addLog(`${steps[i].title}...`);

      // Simulate step execution with progress updates
      const stepDuration = 1500 + Math.random() * 1000;
      const progressPerStep = 100 / steps.length;
      const startProgress = i * progressPerStep;
      
      await simulateProgress(startProgress, startProgress + progressPerStep, stepDuration);

      // Add step-specific details
      const details = getStepDetails(steps[i].id, projectInfo);
      
      // Complete the step
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: "completed", details } : s
      ));
      
      addLog(`✓ ${steps[i].title} completed`);
    }

    addLog(`Transfer complete! Project is now available on ${destination.name}`);
    setIsComplete(true);
    setIsTransferring(false);
  };

  const simulateProgress = (start: number, end: number, duration: number): Promise<void> => {
    return new Promise(resolve => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(start + (end - start) * (elapsed / duration), end);
        setOverallProgress(progress);
        
        if (elapsed >= duration) {
          clearInterval(interval);
          setOverallProgress(end);
          resolve();
        }
      }, 50);
    });
  };

  const getStepDetails = (stepId: string, info: ProjectInfo | null): string => {
    switch (stepId) {
      case "analyze":
        return `Found ${info?.files || 45} files, 12 components, 3 pages`;
      case "export":
        return "Exported 2.3 MB of project data";
      case "transform":
        return `Converted imports and configs for ${destination.name}`;
      case "upload":
        return `Successfully created project on ${destination.name}`;
      default:
        return "";
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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
            {projectInfo?.name || "Project Transfer"}
          </p>
          <p className="text-sm text-muted-foreground">
            {source.name} → {destination.name}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
              step.status === "in-progress" && "bg-primary/10 border border-primary/20",
              step.status === "completed" && "bg-primary/5",
              step.status === "pending" && "opacity-50"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              step.status === "completed" && "bg-primary text-primary-foreground",
              step.status === "in-progress" && "bg-primary/20 text-primary",
              step.status === "pending" && "bg-muted text-muted-foreground",
              step.status === "error" && "bg-destructive text-destructive-foreground"
            )}>
              {step.status === "completed" && <CheckCircle2 className="w-5 h-5" />}
              {step.status === "in-progress" && <Loader2 className="w-5 h-5 animate-spin" />}
              {step.status === "pending" && <step.icon className="w-5 h-5" />}
              {step.status === "error" && <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-semibold text-foreground">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {step.details && (
                <p className="text-xs text-primary mt-1">{step.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Log Output */}
      {logs.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-medium text-foreground mb-2">Transfer Log</p>
          <div className="bg-background/50 rounded-lg p-4 max-h-40 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="text-muted-foreground">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {!isTransferring && !isComplete && (
          <>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="glow" onClick={startTransfer}>
              Start Transfer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
        
        {isTransferring && (
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground">
              Transfer in progress. Please don't close this window.
            </p>
          </div>
        )}
        
        {isComplete && (
          <>
            <Button variant="ghost" onClick={onCancel}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Transfer Another
            </Button>
            <Button variant="glow" onClick={onComplete}>
              View on {destination.name}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
