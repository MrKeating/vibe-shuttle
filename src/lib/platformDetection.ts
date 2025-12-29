// Platform detection utilities for determining repo origin

export interface PlatformInfo {
  name: string;
  id: string;
  color: string;
  getProjectUrl: (repoUrl: string) => string | null;
}

const PLATFORMS: PlatformInfo[] = [
  {
    name: "Lovable",
    id: "lovable",
    color: "#9b87f5",
    getProjectUrl: (repoUrl: string) => {
      // Lovable repos typically have lovable in the name or a specific pattern
      // For now, we check if the repo URL contains lovable indicators
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        // Check for lovable project patterns
        if (repo.toLowerCase().includes('lovable') || 
            repoUrl.includes('lovable.app') ||
            owner.toLowerCase().includes('lovable')) {
          return `https://lovable.dev/projects/${repo}`;
        }
      }
      return null;
    }
  },
  {
    name: "Bolt",
    id: "bolt",
    color: "#FF6B35",
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        // Bolt.new repos often have bolt in the name
        if (repo.toLowerCase().includes('bolt') || 
            owner.toLowerCase().includes('bolt')) {
          return `https://bolt.new/projects/${repo}`;
        }
      }
      return null;
    }
  },
  {
    name: "Replit",
    id: "replit",
    color: "#F26207",
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        // Replit repos may have replit in the name
        if (repo.toLowerCase().includes('replit') || 
            owner.toLowerCase().includes('replit')) {
          return `https://replit.com/@${owner}/${repo}`;
        }
      }
      return null;
    }
  },
  {
    name: "StackBlitz",
    id: "stackblitz",
    color: "#1389FD",
    getProjectUrl: (repoUrl: string) => {
      // StackBlitz can open any GitHub repo
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://stackblitz.com/github/${owner}/${repo}`;
      }
      return null;
    }
  },
  {
    name: "CodeSandbox",
    id: "codesandbox",
    color: "#151515",
    getProjectUrl: (repoUrl: string) => {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return `https://codesandbox.io/s/github/${owner}/${repo}`;
      }
      return null;
    }
  }
];

/**
 * Detect the platform a repo originated from based on URL patterns
 */
export function detectPlatform(repoUrl: string, repoDescription?: string | null): PlatformInfo | null {
  const urlLower = repoUrl.toLowerCase();
  const descLower = (repoDescription || '').toLowerCase();
  
  // Check description first for explicit platform mentions
  for (const platform of PLATFORMS) {
    if (descLower.includes(platform.id) || descLower.includes(platform.name.toLowerCase())) {
      return platform;
    }
  }
  
  // Check URL patterns
  for (const platform of PLATFORMS) {
    const projectUrl = platform.getProjectUrl(repoUrl);
    if (projectUrl && platform.id !== 'stackblitz' && platform.id !== 'codesandbox') {
      // Only return if it's a specific platform match (not generic ones)
      return platform;
    }
  }
  
  return null;
}

/**
 * Get the URL to redirect back to the origin platform
 */
export function getOriginPlatformUrl(repoUrl: string, repoDescription?: string | null): string | null {
  const platform = detectPlatform(repoUrl, repoDescription);
  if (platform) {
    return platform.getProjectUrl(repoUrl);
  }
  return null;
}

/**
 * Get all available platforms that can open a repo
 */
export function getAvailablePlatforms(repoUrl: string): { platform: PlatformInfo; url: string }[] {
  const results: { platform: PlatformInfo; url: string }[] = [];
  
  for (const platform of PLATFORMS) {
    const url = platform.getProjectUrl(repoUrl);
    if (url) {
      results.push({ platform, url });
    }
  }
  
  return results;
}
