import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

interface FileTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    console.log("Auth check:", { userId: user?.id, error: authError?.message });
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's GitHub PAT from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("github_pat")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_pat) {
      return new Response(
        JSON.stringify({ error: "GitHub PAT not configured. Please add your GitHub Personal Access Token." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const githubToken = profile.github_pat.trim();
    const { action, ...params } = await req.json();
    console.log("Action:", action, "Params:", Object.keys(params));

    let result;

    switch (action) {
      case "list-repos":
        result = await listRepos(githubToken);
        break;
      case "get-repo":
        result = await getRepo(githubToken, params.owner, params.repo);
        break;
      case "create-file":
        result = await createFile(githubToken, params.owner, params.repo, params.path, params.content, params.message);
        break;
      case "get-file":
        result = await getFile(githubToken, params.owner, params.repo, params.path);
        break;
      case "validate-token":
        result = await validateToken(githubToken);
        break;
      case "get-tree":
        result = await getRepoTree(githubToken, params.owner, params.repo, params.branch);
        break;
      case "get-file-content":
        result = await getFileContent(githubToken, params.owner, params.repo, params.path, params.branch);
        break;
      case "create-repo":
        result = await createRepo(githubToken, params.name, params.description, params.isPrivate);
        break;
      case "push-files":
        result = await pushFiles(githubToken, params.owner, params.repo, params.files, params.message, params.branch);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const status = error instanceof GitHubApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("Error:", { status, message });

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

class GitHubApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function githubFetch(token: string, endpoint: string, options: RequestInit = {}) {
  const tryFetch = async (scheme: "Bearer" | "token") => {
    const authorization = scheme === "token" ? `token ${token}` : `Bearer ${token}`;
    return await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: authorization,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "VibeMerge-App",
        ...options.headers,
      },
    });
  };

  // Fine-grained PATs commonly work with Bearer; classic PATs commonly work with token.
  let response = await tryFetch("Bearer");
  if (!response.ok && response.status === 401) {
    response = await tryFetch("token");
  }

  if (!response.ok) {
    const raw = await response.text();
    let message = `GitHub API error: ${response.status}`;

    try {
      const parsed = JSON.parse(raw);
      message = parsed?.message || message;

      // GitHub often returns useful details in `errors` even when `message` is generic
      if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
        const details = parsed.errors
          .map((e: any) => {
            const field = e?.field ? `${e.field}: ` : "";
            const msg = e?.message || e?.code || "";
            const code = e?.code ? ` (${e.code})` : "";
            return `${field}${msg}${code}`.trim();
          })
          .filter(Boolean)
          .join("; ");
        if (details) message = `${message} (${details})`;
      }
    } catch {
      if (raw) message = raw;
    }

    if (response.status === 401) {
      throw new GitHubApiError(
        401,
        "GitHub token invalid or expired. Please reconnect your GitHub token."
      );
    }

    throw new GitHubApiError(response.status, message);
  }

  return response.json();
}

async function validateToken(token: string) {
  const user = await githubFetch(token, "/user");
  return { valid: true, username: user.login, avatar_url: user.avatar_url };
}

async function listRepos(token: string): Promise<GitHubRepo[]> {
  const repos = await githubFetch(token, "/user/repos?sort=updated&per_page=100");
  return repos.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    private: repo.private,
    default_branch: repo.default_branch,
  }));
}

async function getRepo(token: string, owner: string, repo: string) {
  return await githubFetch(token, `/repos/${owner}/${repo}`);
}

async function createFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
) {
  // Check if file exists first
  let sha: string | undefined;
  try {
    const existing = await githubFetch(token, `/repos/${owner}/${repo}/contents/${path}`);
    sha = existing.sha;
  } catch {
    // File doesn't exist, that's fine
  }

  const base64Content = btoa(content);
  
  return await githubFetch(token, `/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64Content,
      sha,
    }),
  });
}

async function getFile(token: string, owner: string, repo: string, path: string) {
  try {
    const file = await githubFetch(token, `/repos/${owner}/${repo}/contents/${path}`);
    const content = atob(file.content);
    return { exists: true, content, sha: file.sha };
  } catch {
    return { exists: false };
  }
}

// New functions for VibeMerge

async function getRepoTree(token: string, owner: string, repo: string, branch?: string): Promise<FileTreeItem[]> {
  // Get default branch if not specified
  if (!branch) {
    const repoInfo = await githubFetch(token, `/repos/${owner}/${repo}`);
    branch = repoInfo.default_branch;
  }
  
  const tree = await githubFetch(token, `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return tree.tree.map((item: any) => ({
    path: item.path,
    type: item.type,
    sha: item.sha,
    size: item.size,
  }));
}

async function getFileContent(token: string, owner: string, repo: string, path: string, branch?: string) {
  try {
    const ref = branch ? `?ref=${branch}` : "";
    const file = await githubFetch(token, `/repos/${owner}/${repo}/contents/${path}${ref}`);
    
    if (file.type === "file" && file.content) {
      // Decode base64 content
      const content = atob(file.content.replace(/\n/g, ""));
      return { exists: true, content, sha: file.sha, size: file.size };
    }
    
    return { exists: false, error: "Not a file" };
  } catch (error: any) {
    console.error("getFileContent error:", error.message);
    return { exists: false, error: error.message };
  }
}

async function createRepo(token: string, name: string, description: string, isPrivate: boolean) {
  // Validate repo name - GitHub requires specific format
  const validName = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^[._-]+/, "")
    .replace(/[._-]+$/, "");

  if (!validName) {
    throw new GitHubApiError(400, "Invalid repository name. Please choose another name.");
  }

  console.log("Creating repo:", { name, validName, description, isPrivate });

  try {
    return await githubFetch(token, "/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: validName,
        description,
        private: isPrivate,
        auto_init: false, // We'll push files ourselves
      }),
    });
  } catch (error: any) {
    console.error("createRepo error:", error?.message);

    // Make common 422 causes user-friendly
    const msg = String(error?.message || "");
    if (msg.toLowerCase().includes("already exists")) {
      throw new GitHubApiError(422, `Repository "${validName}" already exists. Please choose a different name.`);
    }

    // Re-throw original error (now includes GitHub `errors[]` details from githubFetch)
    throw error;
  }
}

async function pushFiles(
  token: string,
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message: string,
  branch?: string
) {
  console.log("pushFiles starting:", { owner, repo, filesCount: files.length, branch });

  // Get repo info and default branch
  const repoInfo = await githubFetch(token, `/repos/${owner}/${repo}`);
  if (!branch) {
    branch = repoInfo.default_branch || "main";
  }

  // Detect empty repo (no commits yet)
  let latestCommitSha: string | null = null;
  let baseTreeSha: string | null = null;
  let isEmptyRepo = false;

  try {
    const refData = await githubFetch(token, `/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    latestCommitSha = refData.object.sha;

    const commitData = await githubFetch(token, `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
    baseTreeSha = commitData.tree.sha;
    console.log("Existing commit found:", { latestCommitSha, baseTreeSha });
  } catch (error: any) {
    console.log("Empty repo detected, will push via Contents API:", error?.message);
    isEmptyRepo = true;
  }

  // IMPORTANT: GitHub Git Data APIs (/git/trees, /git/blobs, /git/commits) can return
  // "Git Repository is empty" on brand-new repos. For that case, use the Contents API.
  if (isEmptyRepo) {
    let lastCommitSha: string | undefined;

    for (const file of files) {
      const res = await createFile(
        token,
        owner,
        repo,
        file.path,
        file.content,
        `${message}: ${file.path}`
      );
      lastCommitSha = res?.commit?.sha || lastCommitSha;
    }

    return { success: true, commit_sha: lastCommitSha, method: "contents" };
  }

  // Existing repo: use Git Data API to create a single commit
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blob = await githubFetch(token, `/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      });
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      };
    })
  );

  const treePayload: any = { tree: treeItems };
  if (baseTreeSha) treePayload.base_tree = baseTreeSha;

  const newTree = await githubFetch(token, `/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify(treePayload),
  });

  const newCommit = await githubFetch(token, `/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: latestCommitSha ? [latestCommitSha] : [],
    }),
  });

  await githubFetch(token, `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  return { success: true, commit_sha: newCommit.sha, method: "git-data" };
}