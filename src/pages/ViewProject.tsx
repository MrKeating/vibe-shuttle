import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  FileCode, 
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAIChat } from "@/hooks/useAIChat";
import { useMerge } from "@/hooks/useMerge";

interface ProjectFile {
  path: string;
  content: string;
}

const ViewProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, profile } = useAuth();
  
  const repoFullName = searchParams.get("repo");
  const [owner, repoName] = (repoFullName || "").split("/");
  
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["src"]));
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { getRepoTree, getFileContent } = useMerge();
  const { messages, isLoading: chatLoading, sendMessage, error: chatError } = useAIChat();

  // StackBlitz embed URL for the repo
  const stackBlitzUrl = repoFullName 
    ? `https://stackblitz.com/github/${repoFullName}?embed=1&file=src/App.tsx&hideNavigation=1&theme=dark`
    : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load repo files for AI context
  useEffect(() => {
    const fetchFiles = async () => {
      if (!owner || !repoName || !profile?.github_pat) return;
      
      setIsLoadingFiles(true);
      try {
        const tree = await getRepoTree(owner, repoName);
        const fileItems = tree.filter(f => f.type === "blob");
        
        // Fetch content for key files only (to provide AI context)
        const keyFiles = fileItems.filter(f => 
          f.path.endsWith('.tsx') || 
          f.path.endsWith('.ts') || 
          f.path.endsWith('.css') ||
          f.path.endsWith('.json') ||
          f.path === 'package.json'
        ).slice(0, 30);
        
        const fileContents: ProjectFile[] = [];
        
        for (const file of keyFiles) {
          try {
            const result = await getFileContent(owner, repoName, file.path);
            if (result.exists && result.content) {
              fileContents.push({ path: file.path, content: result.content });
            }
          } catch {
            // Skip failed files silently
          }
        }
        
        setFiles(fileContents);
      } catch (e) {
        console.error("Error loading repo:", e);
        toast({
          title: "Error loading project files",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };
    
    fetchFiles();
  }, [owner, repoName, profile?.github_pat]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    
    const input = chatInput;
    setChatInput("");
    
    const edits = await sendMessage(input, files);
    
    if (edits && edits.length > 0) {
      // Update local file state
      for (const edit of edits) {
        if (edit.action === "update" || edit.action === "create") {
          if (edit.content !== undefined) {
            setFiles(prev => {
              const existing = prev.find(f => f.path === edit.path);
              if (existing) {
                return prev.map(f => f.path === edit.path ? { ...f, content: edit.content! } : f);
              }
              return [...prev, { path: edit.path, content: edit.content! }];
            });
          }
        } else if (edit.action === "delete") {
          setFiles(prev => prev.filter(f => f.path !== edit.path));
        }
      }
      
      toast({
        title: "AI suggested changes",
        description: `${edits.length} file edit${edits.length > 1 ? "s" : ""} ready. Copy the code from the chat to apply.`,
      });
    }
  };

  const toggleDir = (dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dir)) {
        next.delete(dir);
      } else {
        next.add(dir);
      }
      return next;
    });
  };

  const refreshPreview = () => {
    if (iframeRef.current && stackBlitzUrl) {
      iframeRef.current.src = stackBlitzUrl;
    }
  };

  // Build file tree structure
  const buildFileTree = () => {
    const tree: Record<string, any> = {};
    
    for (const file of files) {
      const parts = file.path.split("/");
      let current = tree;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { __type: "dir", __children: {} };
        }
        current = current[parts[i]].__children;
      }
      
      current[parts[parts.length - 1]] = { __type: "file", __path: file.path };
    }
    
    return tree;
  };

  const renderTree = (node: Record<string, any>, path = "") => {
    return Object.entries(node)
      .filter(([key]) => !key.startsWith("__"))
      .sort(([, a], [, b]) => {
        if (a.__type === "dir" && b.__type !== "dir") return -1;
        if (a.__type !== "dir" && b.__type === "dir") return 1;
        return 0;
      })
      .map(([name, value]) => {
        const fullPath = path ? `${path}/${name}` : name;
        
        if (value.__type === "dir") {
          const isExpanded = expandedDirs.has(fullPath);
          return (
            <div key={fullPath}>
              <button
                onClick={() => toggleDir(fullPath)}
                className="flex items-center gap-1 w-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>{name}</span>
              </button>
              {isExpanded && (
                <div className="pl-3">
                  {renderTree(value.__children, fullPath)}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <button
            key={fullPath}
            onClick={() => setSelectedFile(value.__path)}
            className={`flex items-center gap-1 w-full px-2 py-1 text-sm rounded truncate ${
              selectedFile === value.__path 
                ? "bg-primary/20 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <FileCode className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{name}</span>
          </button>
        );
      });
  };

  const selectedFileContent = files.find(f => f.path === selectedFile)?.content;

  if (authLoading) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-12 border-b border-border flex items-center px-4 gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 font-mono text-sm text-muted-foreground truncate">
          {repoFullName || "Project"}
        </div>
        <Button variant="ghost" size="sm" onClick={refreshPreview}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        {repoFullName && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`https://github.com/${repoFullName}`, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* File Explorer */}
        <div className="w-56 border-r border-border flex flex-col">
          <div className="p-2 border-b border-border text-xs font-medium text-muted-foreground uppercase">
            Files
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No files loaded</p>
              ) : (
                renderTree(buildFileTree())
              )}
            </div>
          </ScrollArea>
          
          {/* Selected file preview */}
          {selectedFile && selectedFileContent && (
            <div className="border-t border-border h-48 flex flex-col">
              <div className="p-2 text-xs font-mono text-muted-foreground truncate border-b border-border">
                {selectedFile}
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-2 text-xs font-mono whitespace-pre-wrap break-all">
                  {selectedFileContent.slice(0, 2000)}
                  {selectedFileContent.length > 2000 && "..."}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* StackBlitz Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {stackBlitzUrl ? (
            <iframe
              ref={iframeRef}
              src={stackBlitzUrl}
              className="flex-1 w-full border-0"
              title="Project Preview"
              allow="cross-origin-isolated"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>No repository specified</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Chat Sidebar */}
        <div className="w-80 border-l border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-medium">AI Assistant</span>
          </div>

          <ScrollArea className="flex-1" ref={chatScrollRef}>
            <div className="p-3 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <p>Ask me about your project!</p>
                  <p className="mt-2 text-xs">I can suggest code changes.</p>
                  <p className="text-xs mt-1">"Add a dark mode toggle"</p>
                  <p className="text-xs">"Explain the main component"</p>
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground ml-8"
                      : "bg-muted text-foreground mr-4"
                  } rounded-lg p-3`}
                >
                  <div className="whitespace-pre-wrap break-words text-xs">{msg.content}</div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              )}
              
              {chatError && (
                <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                  {chatError}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI..."
                disabled={chatLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProject;
