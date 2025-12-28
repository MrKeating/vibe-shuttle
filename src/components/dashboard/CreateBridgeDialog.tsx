import { useState } from "react";
import { Layers, Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectUrlInput, type ProjectInfo } from "@/components/ProjectUrlInput";
import { PlatformCard } from "@/components/PlatformCard";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
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

interface CreateBridgeDialogProps {
  onCreateBridge: (data: {
    github_repo_url: string;
    repo_name: string;
    platforms: string[];
  }) => Promise<unknown>;
  canCreate: boolean;
}

export const CreateBridgeDialog = ({ onCreateBridge, canCreate }: CreateBridgeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [projectUrl, setProjectUrl] = useState("");
  const [isProjectValid, setIsProjectValid] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleValidationChange = (isValid: boolean, info?: ProjectInfo) => {
    setIsProjectValid(isValid);
    setProjectInfo(info || null);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleCreate = async () => {
    if (!projectInfo || selectedPlatforms.length === 0) return;

    setIsCreating(true);
    try {
      await onCreateBridge({
        github_repo_url: projectUrl,
        repo_name: projectInfo.name,
        platforms: selectedPlatforms,
      });
      toast({ title: "Bridge created!", description: `${projectInfo.name} is now bridged.` });
      setOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Failed to create bridge", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectUrl("");
    setIsProjectValid(false);
    setProjectInfo(null);
    setSelectedPlatforms([]);
  };

  if (!canCreate) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="glow" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Bridge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription>
              You've reached the limit of 1 bridge on the free plan. Upgrade to Pro for unlimited
              bridges and priority support.
            </DialogDescription>
          </DialogHeader>
          <Button variant="glow" className="w-full mt-4">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro - $29 one-time
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Bridge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Create New Bridge
          </DialogTitle>
          <DialogDescription>
            Connect a GitHub repository to multiple AI coding platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* GitHub URL Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">GitHub Repository</label>
            <ProjectUrlInput
              value={projectUrl}
              onChange={setProjectUrl}
              onValidationChange={handleValidationChange}
            />
          </div>

          {/* Platform Selection */}
          <div className={!isProjectValid ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-sm font-medium mb-2 block">
              Select Platforms ({selectedPlatforms.length} selected)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatforms.includes(platform.id)}
                  onClick={() => togglePlatform(platform.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="glow"
            onClick={handleCreate}
            disabled={!isProjectValid || selectedPlatforms.length === 0 || isCreating}
          >
            {isCreating ? "Creating..." : "Create Bridge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
