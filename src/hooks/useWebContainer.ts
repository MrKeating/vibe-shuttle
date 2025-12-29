import { useState, useEffect, useRef, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export interface ProjectFile {
  path: string;
  content: string;
}

interface UseWebContainerResult {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  previewUrl: string | null;
  terminal: string[];
  loadFiles: (files: ProjectFile[]) => Promise<void>;
  updateFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
}

export const useWebContainer = (): UseWebContainerResult => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<string[]>([]);
  
  const containerRef = useRef<WebContainer | null>(null);
  const bootedRef = useRef(false);

  const appendTerminal = useCallback((text: string) => {
    setTerminal(prev => [...prev.slice(-100), text]);
  }, []);

  useEffect(() => {
    const boot = async () => {
      if (bootedRef.current) return;
      bootedRef.current = true;

      try {
        appendTerminal("Booting WebContainer...");
        const container = await WebContainer.boot();
        containerRef.current = container;
        
        // Listen for server-ready events
        container.on("server-ready", (port, url) => {
          appendTerminal(`Server ready on port ${port}`);
          setPreviewUrl(url);
        });

        appendTerminal("WebContainer ready!");
        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        console.error("WebContainer boot error:", err);
        setError(err instanceof Error ? err.message : "Failed to boot WebContainer");
        setIsLoading(false);
      }
    };

    boot();
  }, [appendTerminal]);

  const loadFiles = useCallback(async (files: ProjectFile[]) => {
    const container = containerRef.current;
    if (!container) {
      throw new Error("WebContainer not ready");
    }

    setIsLoading(true);
    appendTerminal("Loading project files...");

    try {
      // Build file system tree
      const fsTree: Record<string, any> = {};
      
      for (const file of files) {
        const parts = file.path.split("/");
        let current = fsTree;
        
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = { directory: {} };
          }
          current = current[part].directory;
        }
        
        const fileName = parts[parts.length - 1];
        current[fileName] = { file: { contents: file.content } };
      }

      await container.mount(fsTree);
      appendTerminal(`Loaded ${files.length} files`);

      // Check if package.json exists and install dependencies
      const hasPackageJson = files.some(f => f.path === "package.json");
      if (hasPackageJson) {
        appendTerminal("Installing dependencies...");
        const installProcess = await container.spawn("npm", ["install"]);
        
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            appendTerminal(data);
          }
        }));

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          appendTerminal(`npm install failed with code ${installExitCode}`);
        } else {
          appendTerminal("Dependencies installed!");
          
          // Start dev server
          appendTerminal("Starting dev server...");
          const devProcess = await container.spawn("npm", ["run", "dev"]);
          
          devProcess.output.pipeTo(new WritableStream({
            write(data) {
              appendTerminal(data);
            }
          }));
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Error loading files:", err);
      appendTerminal(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setError(err instanceof Error ? err.message : "Failed to load files");
      setIsLoading(false);
    }
  }, [appendTerminal]);

  const updateFile = useCallback(async (path: string, content: string) => {
    const container = containerRef.current;
    if (!container) {
      throw new Error("WebContainer not ready");
    }

    try {
      await container.fs.writeFile(path, content);
      appendTerminal(`Updated: ${path}`);
    } catch (err) {
      console.error("Error updating file:", err);
      appendTerminal(`Error updating ${path}: ${err instanceof Error ? err.message : "Unknown"}`);
      throw err;
    }
  }, [appendTerminal]);

  const deleteFile = useCallback(async (path: string) => {
    const container = containerRef.current;
    if (!container) {
      throw new Error("WebContainer not ready");
    }

    try {
      await container.fs.rm(path);
      appendTerminal(`Deleted: ${path}`);
    } catch (err) {
      console.error("Error deleting file:", err);
      appendTerminal(`Error deleting ${path}: ${err instanceof Error ? err.message : "Unknown"}`);
      throw err;
    }
  }, [appendTerminal]);

  return {
    isReady,
    isLoading,
    error,
    previewUrl,
    terminal,
    loadFiles,
    updateFile,
    deleteFile,
  };
};
