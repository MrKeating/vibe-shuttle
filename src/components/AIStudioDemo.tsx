import { AI_STUDIO_VERSION, AI_STUDIO_SYNCED_AT } from "@/ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Layers, Clock } from "lucide-react";

/**
 * Demo component showing how to import and use AI Studio code.
 * 
 * This demonstrates the three ways to import from ai-studio:
 * 1. import { Something } from "@/ai"           - Main bridge entrypoint
 * 2. import { specific } from "@ai/module"      - Direct alias (Vite)
 * 3. import { thing } from "@/ai-studio/file"   - Full path
 */
const AIStudioDemo = () => {
  // Format the sync timestamp if available
  const formatSyncTime = (isoString?: string) => {
    if (!isoString) return "Not synced yet";
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <CardTitle>AI Studio Bridge</CardTitle>
        </div>
        <CardDescription>
          Code synced from Google AI Studio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code className="h-4 w-4" />
            <span>Version</span>
          </div>
          <Badge variant="secondary">{AI_STUDIO_VERSION}</Badge>
        </div>

        {/* Last sync time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last Synced</span>
          </div>
          <span className="text-sm">
            {formatSyncTime(AI_STUDIO_SYNCED_AT)}
          </span>
        </div>

        {/* Import examples */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Import examples:</p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`// Main entrypoint
import { Something } from "@/ai";

// Direct module
import { fn } from "@ai/utils";

// Full path
import { X } from "@/ai-studio/x";`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIStudioDemo;
