// Platform detection utilities for determining repo origin and destination priority

export interface PlatformInfo {
  name: string;
  id: string;
  color: string;
  icon?: string;
  priority: number; // Lower = higher priority (1 = destination)
  getProjectUrl: (repoUrl: string) => string | null;
  detectFromRepo: (repoUrl: string, description?: string | null) => boolean;
}

// Platform hierarchy: Lovable > Bolt > Replit > Cursor > v0 > StackBlitz > CodeSandbox
export const PLATFORMS: PlatformInfo[] = [
  {
    name: "Lovable",
    id: "lovable",
    color: "#9b87f5",
    priority: 1, // Highest priority - default destination
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://lovable.dev/projects/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return (
        urlLower.includes("lovable") ||
        descLower.includes("lovable") ||
        descLower.includes("built with lovable")
      );
    },
  },
  {
    name: "Bolt.new",
    id: "bolt",
    color: "#FF6B35",
    priority: 2,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://bolt.new/~/github.com/${owner}/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return (
        urlLower.includes("bolt") ||
        descLower.includes("bolt.new") ||
        descLower.includes("bolt-")
      );
    },
  },
  {
    name: "Replit",
    id: "replit",
    color: "#F26207",
    priority: 3,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://replit.com/@${owner}/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return urlLower.includes("replit") || descLower.includes("replit");
    },
  },
  {
    name: "Cursor",
    id: "cursor",
    color: "#00D4FF",
    priority: 4,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `cursor://open?url=${encodeURIComponent(repoUrl)}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return urlLower.includes("cursor") || descLower.includes("cursor");
    },
  },
  {
    name: "v0",
    id: "v0",
    color: "#000000",
    priority: 5,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://v0.dev/chat?repo=${owner}/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return descLower.includes("v0.dev") || descLower.includes("vercel v0");
    },
  },
  {
    name: "Google AI Studio",
    id: "aistudio",
    color: "#4285F4",
    priority: 6,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://aistudio.google.com`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return (
        urlLower.includes("aistudio") ||
        urlLower.includes("ai-studio") ||
        descLower.includes("ai studio") ||
        descLower.includes("google ai")
      );
    },
  },
  {
    name: "StackBlitz",
    id: "stackblitz",
    color: "#1389FD",
    priority: 7,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://stackblitz.com/github/${owner}/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return urlLower.includes("stackblitz") || descLower.includes("stackblitz");
    },
  },
  {
    name: "CodeSandbox",
    id: "codesandbox",
    color: "#151515",
    priority: 8,
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://codesandbox.io/s/github/${owner}/${repo}`;
      }
      return null;
    },
    detectFromRepo: (repoUrl: string, description?: string | null) => {
      const urlLower = repoUrl.toLowerCase();
      const descLower = (description || "").toLowerCase();
      return urlLower.includes("codesandbox") || descLower.includes("codesandbox");
    },
  },
];

/**
 * Detect the platform a repo originated from based on URL patterns and description
 */
export function detectPlatform(
  repoUrl: string,
  repoDescription?: string | null
): PlatformInfo | null {
  for (const platform of PLATFORMS) {
    if (platform.detectFromRepo(repoUrl, repoDescription)) {
      return platform;
    }
  }
  return null;
}

/**
 * Get platform by ID
 */
export function getPlatformById(id: string): PlatformInfo | null {
  return PLATFORMS.find((p) => p.id === id) || null;
}

/**
 * Given multiple repos with their detected platforms, determine which should be the destination
 * Returns the repo with the highest priority (lowest priority number)
 */
export interface RepoWithPlatform {
  repoUrl: string;
  repoName: string;
  description?: string | null;
  platform: PlatformInfo | null;
}

export function determineDestination(
  repos: RepoWithPlatform[]
): RepoWithPlatform | null {
  if (repos.length === 0) return null;

  // Sort by platform priority (lower = higher priority)
  const sorted = [...repos].sort((a, b) => {
    const priorityA = a.platform?.priority ?? 999;
    const priorityB = b.platform?.priority ?? 999;
    return priorityA - priorityB;
  });

  return sorted[0];
}

/**
 * Get the URL to redirect back to the origin platform
 */
export function getOriginPlatformUrl(
  repoUrl: string,
  repoDescription?: string | null
): string | null {
  const platform = detectPlatform(repoUrl, repoDescription);
  if (platform) {
    return platform.getProjectUrl(repoUrl);
  }
  return null;
}

/**
 * Get all available platforms that can open a repo
 */
export function getAvailablePlatforms(
  repoUrl: string
): { platform: PlatformInfo; url: string }[] {
  const results: { platform: PlatformInfo; url: string }[] = [];

  for (const platform of PLATFORMS) {
    const url = platform.getProjectUrl(repoUrl);
    if (url) {
      results.push({ platform, url });
    }
  }

  return results;
}

/**
 * Get folder name for a platform when it contributes to the destination
 */
export function getPlatformFolderName(platform: PlatformInfo): string {
  return platform.id; // e.g., "bolt", "replit", "aistudio"
}
