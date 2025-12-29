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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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

    const githubToken = profile.github_pat;
    const { action, ...params } = await req.json();

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
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function githubFetch(token: string, endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "VibeBridge-App",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `GitHub API error: ${response.status}`);
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
