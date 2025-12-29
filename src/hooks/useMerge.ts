import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FileTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface FileConflict {
  path: string;
  sourceContent: string | null;
  targetContent: string | null;
  status: "added" | "modified" | "deleted" | "conflict";
  resolved?: boolean;
  resolvedContent?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export const useMerge = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callGitHubApi = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke("github-api", {
      body: { action, ...params },
    });

    if (error) {
      const body = (error as any)?.context?.body;
      let msg: string | undefined;

      if (body) {
        try {
          const parsed = typeof body === "string" ? JSON.parse(body) : body;
          msg = parsed?.error || parsed?.message;
        } catch {
          // ignore
        }
      }

      throw new Error(msg || (error as any)?.message || "GitHub API error");
    }

    if ((data as any)?.error) throw new Error((data as any).error);

    return data;
  };

  const getRepoTree = async (owner: string, repo: string, branch?: string): Promise<FileTreeItem[]> => {
    return await callGitHubApi("get-tree", { owner, repo, branch });
  };

  const getFileContent = async (owner: string, repo: string, path: string, branch?: string): Promise<{ exists: boolean; content?: string }> => {
    return await callGitHubApi("get-file-content", { owner, repo, path, branch });
  };

  const createRepo = async (name: string, description: string, isPrivate: boolean): Promise<GitHubRepo> => {
    return await callGitHubApi("create-repo", { name, description, isPrivate });
  };

  const pushFiles = async (
    owner: string,
    repo: string,
    files: { path: string; content: string }[],
    message: string,
    branch?: string
  ) => {
    return await callGitHubApi("push-files", { owner, repo, files, message, branch });
  };

  const analyzeRepos = async (
    sourceRepo: GitHubRepo,
    targetRepo: GitHubRepo
  ): Promise<FileConflict[]> => {
    setLoading(true);
    try {
      const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
      const [targetOwner, targetRepoName] = targetRepo.full_name.split("/");

      // Get file trees from both repos
      const [sourceTree, targetTree] = await Promise.all([
        getRepoTree(sourceOwner, sourceRepoName),
        getRepoTree(targetOwner, targetRepoName),
      ]);

      // Filter to only files (not directories)
      const sourceFiles = sourceTree.filter(f => f.type === "blob");
      const targetFiles = targetTree.filter(f => f.type === "blob");

      const sourcePathSet = new Set(sourceFiles.map(f => f.path));
      const targetPathSet = new Set(targetFiles.map(f => f.path));
      const targetFilesMap = new Map(targetFiles.map(f => [f.path, f]));

      const conflicts: FileConflict[] = [];

      // Check source files
      for (const sourceFile of sourceFiles) {
        if (targetPathSet.has(sourceFile.path)) {
          // File exists in both - check if different
          const targetFile = targetFilesMap.get(sourceFile.path)!;
          if (sourceFile.sha !== targetFile.sha) {
            conflicts.push({
              path: sourceFile.path,
              sourceContent: null,
              targetContent: null,
              status: "conflict",
            });
          }
        } else {
          // File only in source - will be added
          conflicts.push({
            path: sourceFile.path,
            sourceContent: null,
            targetContent: null,
            status: "added",
          });
        }
      }

      // Check for files only in target
      for (const targetFile of targetFiles) {
        if (!sourcePathSet.has(targetFile.path)) {
          conflicts.push({
            path: targetFile.path,
            sourceContent: null,
            targetContent: null,
            status: "deleted",
          });
        }
      }

      // Sort by status priority (conflicts first) then by path
      conflicts.sort((a, b) => {
        const priority = { conflict: 0, modified: 1, added: 2, deleted: 3 };
        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return a.path.localeCompare(b.path);
      });

      return conflicts;
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadFileContents = async (
    conflict: FileConflict,
    sourceRepo: GitHubRepo,
    targetRepo: GitHubRepo
  ): Promise<FileConflict> => {
    const [sourceOwner, sourceRepoName] = sourceRepo.full_name.split("/");
    const [targetOwner, targetRepoName] = targetRepo.full_name.split("/");

    const [sourceResult, targetResult] = await Promise.all([
      conflict.status !== "deleted"
        ? getFileContent(sourceOwner, sourceRepoName, conflict.path)
        : Promise.resolve({ exists: false } as { exists: boolean; content?: string }),
      conflict.status !== "added"
        ? getFileContent(targetOwner, targetRepoName, conflict.path)
        : Promise.resolve({ exists: false } as { exists: boolean; content?: string }),
    ]);

    return {
      ...conflict,
      sourceContent: sourceResult.exists && sourceResult.content ? sourceResult.content : null,
      targetContent: targetResult.exists && targetResult.content ? targetResult.content : null,
    };
  };

  const executeMerge = async (
    sourceRepo: GitHubRepo,
    targetRepo: GitHubRepo | null,
    newRepoName: string | null,
    files: { path: string; content: string }[],
    isPrivate: boolean = false
  ) => {
    setLoading(true);
    try {
      let destinationRepo: GitHubRepo;

      if (newRepoName) {
        // Create new repo
        destinationRepo = await createRepo(
          newRepoName,
          `Merged from ${sourceRepo.full_name}`,
          isPrivate
        );
        // Wait a moment for repo to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (targetRepo) {
        destinationRepo = targetRepo;
      } else {
        throw new Error("Must specify either a new repo name or target repo");
      }

      const [owner, repo] = destinationRepo.full_name.split("/");

      // Push all merged files
      await pushFiles(owner, repo, files, "Merge repos via VibeMerge");

      toast({
        title: "Merge Complete!",
        description: `Successfully merged to ${destinationRepo.full_name}`,
      });

      return destinationRepo;
    } catch (error: any) {
      toast({
        title: "Merge Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    analyzeRepos,
    loadFileContents,
    executeMerge,
    getRepoTree,
    getFileContent,
  };
};