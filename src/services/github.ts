
interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export const getGitHubConfig = (): GitHubConfig | null => {
  const stored = localStorage.getItem('github_config');
  return stored ? JSON.parse(stored) : null;
};

export const saveGitHubConfig = (config: GitHubConfig) => {
  localStorage.setItem('github_config', JSON.stringify(config));
};

export const fetchFileSha = async (path: string, config: GitHubConfig): Promise<string | null> => {
  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`GitHub API Error: ${res.statusText}`);
    }
    const json = await res.json();
    return json.sha;
  } catch (e) {
    console.error('Error fetching SHA:', e);
    return null;
  }
};

export const updateFile = async (
  path: string,
  content: string, // Base64 encoded for images, or regular string for text
  message: string,
  config: GitHubConfig,
  isBase64: boolean = false
) => {
  const sha = await fetchFileSha(path, config);
  
  const body: any = {
    message,
    content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))), // Handle UTF-8 strings
    branch: config.branch,
  };
  
  if (sha) {
    body.sha = sha;
  }

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update file: ${err}`);
  }
  
  return await res.json();
};
