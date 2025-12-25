import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-heading font-semibold text-sm transition-all duration-300",
                currentStep > step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground glow"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <p className={cn(
              "text-xs mt-2 font-medium transition-colors hidden md:block",
              currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 md:w-20 h-0.5 mx-2 transition-colors duration-300",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
