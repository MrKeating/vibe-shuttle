import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface PlatformCardProps {
  platform: Platform;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const PlatformCard = ({ platform, isSelected, onClick, disabled }: PlatformCardProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "glass relative p-6 rounded-xl transition-all duration-300 group cursor-pointer w-full",
        "hover:scale-[1.02] hover:border-primary/50",
        isSelected && "border-primary glow scale-[1.02]",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
            "transition-transform duration-300 group-hover:scale-110"
          )}
          style={{ backgroundColor: `${platform.color}20` }}
        >
          {platform.icon}
        </div>
        <div className="text-left">
          <h3 className="font-heading font-semibold text-foreground">{platform.name}</h3>
          <p className="text-sm text-muted-foreground">AI Coding Platform</p>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary animate-pulse-slow" />
      )}
    </button>
  );
};
