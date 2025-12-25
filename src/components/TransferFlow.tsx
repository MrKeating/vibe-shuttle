import { ArrowRight } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TransferFlowProps {
  source: Platform | null;
  destination: Platform | null;
}

export const TransferFlow = ({ source, destination }: TransferFlowProps) => {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {/* Source */}
      <div className={`
        glass p-6 rounded-2xl min-w-[140px] text-center transition-all duration-500
        ${source ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}
      `}>
        {source ? (
          <>
            <div 
              className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${source.color}20` }}
            >
              {source.icon}
            </div>
            <p className="font-heading font-semibold text-foreground">{source.name}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-xl mx-auto mb-3 bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">?</span>
            </div>
            <p className="font-heading text-muted-foreground">Source</p>
          </>
        )}
      </div>

      {/* Arrow */}
      <div className="relative">
        <svg width="120" height="40" viewBox="0 0 120 40" className="overflow-visible">
          <defs>
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
          <path
            d="M 0 20 Q 60 20 120 20"
            fill="none"
            stroke="url(#arrowGradient)"
            strokeWidth="2"
            strokeDasharray="8 4"
            className={source && destination ? 'animate-flow' : ''}
          />
        </svg>
        <div className={`
          absolute right-0 top-1/2 -translate-y-1/2 translate-x-2
          w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-500
          ${source && destination 
            ? 'bg-primary text-primary-foreground glow' 
            : 'bg-muted text-muted-foreground'}
        `}>
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Destination */}
      <div className={`
        glass p-6 rounded-2xl min-w-[140px] text-center transition-all duration-500
        ${destination ? 'opacity-100 scale-100' : 'opacity-40 scale-95'}
      `}>
        {destination ? (
          <>
            <div 
              className="w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${destination.color}20` }}
            >
              {destination.icon}
            </div>
            <p className="font-heading font-semibold text-foreground">{destination.name}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-xl mx-auto mb-3 bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground">?</span>
            </div>
            <p className="font-heading text-muted-foreground">Destination</p>
          </>
        )}
      </div>
    </div>
  );
};
