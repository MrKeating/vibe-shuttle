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
        "glass relative p-4 rounded-xl transition-all duration-300 group cursor-pointer w-full",
        "hover:scale-[1.02] hover:border-primary/50",
        isSelected && "border-primary glow scale-[1.02]",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <div className="flex items-center gap-3">
        <div 
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
            "transition-transform duration-300 group-hover:scale-110"
          )}
          style={{ backgroundColor: `${platform.color}20` }}
        >
          {platform.icon}
        </div>
        <h3 className="font-heading font-semibold text-foreground text-sm">{platform.name}</h3>
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary animate-pulse-slow" />
      )}
    </button>
  );
};
