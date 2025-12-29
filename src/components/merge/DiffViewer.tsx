import { useState } from "react";
import { Check, X, ArrowRight, FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { FileConflict, GitHubRepo } from "@/hooks/useMerge";
import { useMerge } from "@/hooks/useMerge";

interface DiffViewerProps {
  conflicts: FileConflict[];
  sourceRepo: GitHubRepo;
  targetRepo: GitHubRepo;
  onResolve: (path: string, content: string, keepSource: boolean) => void;
  onResolveAll: (keepSource: boolean) => void;
}

export const DiffViewer = ({
  conflicts,
  sourceRepo,
  targetRepo,
  onResolve,
  onResolveAll,
}: DiffViewerProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    conflicts.find(c => c.status === "conflict")?.path || conflicts[0]?.path || null
  );
  const [loadedContents, setLoadedContents] = useState<Record<string, FileConflict>>({});
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const { loadFileContents } = useMerge();

  const selectedConflict = selectedFile
    ? loadedContents[selectedFile] || conflicts.find(c => c.path === selectedFile)
    : null;

  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    
    // Load content if not already loaded
    if (!loadedContents[path]) {
      const conflict = conflicts.find(c => c.path === path);
      if (conflict && (conflict.status === "conflict" || conflict.status === "modified")) {
        setLoadingFile(path);
        try {
          const loaded = await loadFileContents(conflict, sourceRepo, targetRepo);
          setLoadedContents(prev => ({ ...prev, [path]: loaded }));
        } catch (e) {
          console.error("Failed to load file:", e);
        } finally {
          setLoadingFile(null);
        }
      }
    }
  };

  const getStatusColor = (status: FileConflict["status"]) => {
    switch (status) {
      case "conflict":
        return "text-amber-500 bg-amber-500/10";
      case "added":
        return "text-green-500 bg-green-500/10";
      case "deleted":
        return "text-red-500 bg-red-500/10";
      case "modified":
        return "text-blue-500 bg-blue-500/10";
    }
  };

  const getStatusLabel = (status: FileConflict["status"]) => {
    switch (status) {
      case "conflict":
        return "Conflict";
      case "added":
        return "New";
      case "deleted":
        return "Removed";
      case "modified":
        return "Modified";
    }
  };

  const conflictCount = conflicts.filter(c => c.status === "conflict" && !c.resolved).length;
  const resolvedCount = conflicts.filter(c => c.resolved).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="text-sm">
          <span className="text-muted-foreground">Files: </span>
          <span className="font-medium">{conflicts.length}</span>
          {conflictCount > 0 && (
            <>
              <span className="text-muted-foreground ml-3">Conflicts: </span>
              <span className="font-medium text-amber-500">{conflictCount}</span>
            </>
          )}
          {resolvedCount > 0 && (
            <>
              <span className="text-muted-foreground ml-3">Resolved: </span>
              <span className="font-medium text-green-500">{resolvedCount}</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolveAll(true)}
            className="text-xs"
          >
            Keep All Source
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolveAll(false)}
            className="text-xs"
          >
            Keep All Target
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File list sidebar */}
        <div className="w-64 border-r border-border flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {conflicts.map((conflict) => (
                <button
                  key={conflict.path}
                  onClick={() => handleSelectFile(conflict.path)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                    selectedFile === conflict.path
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-muted/50",
                    conflict.resolved && "opacity-60"
                  )}
                >
                  <FileCode className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-xs">{conflict.path}</p>
                  </div>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0",
                      getStatusColor(conflict.status)
                    )}
                  >
                    {conflict.resolved ? "✓" : getStatusLabel(conflict.status)}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Diff content */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConflict ? (
            <>
              {/* File header */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm">{selectedConflict.path}</span>
                </div>
                {selectedConflict.status === "conflict" && !selectedConflict.resolved && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onResolve(
                          selectedConflict.path,
                          selectedConflict.sourceContent || "",
                          true
                        )
                      }
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Use Source
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onResolve(
                          selectedConflict.path,
                          selectedConflict.targetContent || "",
                          false
                        )
                      }
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Use Target
                    </Button>
                  </div>
                )}
              </div>

              {/* Side by side diff */}
              {loadingFile === selectedConflict.path ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading file contents...</span>
                </div>
              ) : selectedConflict.status === "conflict" ||
                selectedConflict.status === "modified" ? (
                <div className="flex-1 flex min-h-0">
                  {/* Source side */}
                  <div className="flex-1 flex flex-col border-r border-border">
                    <div className="px-3 py-2 bg-green-500/10 border-b border-border text-xs font-medium text-green-600">
                      Source: {sourceRepo.name}
                    </div>
                    <ScrollArea className="flex-1">
                      <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                        {selectedConflict.sourceContent || (
                          <span className="text-muted-foreground italic">
                            Content not loaded. Select file to view.
                          </span>
                        )}
                      </pre>
                    </ScrollArea>
                  </div>

                  {/* Target side */}
                  <div className="flex-1 flex flex-col">
                    <div className="px-3 py-2 bg-blue-500/10 border-b border-border text-xs font-medium text-blue-600">
                      Target: {targetRepo.name}
                    </div>
                    <ScrollArea className="flex-1">
                      <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                        {selectedConflict.targetContent || (
                          <span className="text-muted-foreground italic">
                            Content not loaded. Select file to view.
                          </span>
                        )}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    {selectedConflict.status === "added" && (
                      <p>
                        This file is <span className="text-green-500">new</span> from the source
                        repo and will be added.
                      </p>
                    )}
                    {selectedConflict.status === "deleted" && (
                      <p>
                        This file only exists in target repo and will be{" "}
                        <span className="text-red-500">removed</span> from the merge.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a file to view differences
            </div>
          )}
        </div>
      </div>
    </div>
  );
};