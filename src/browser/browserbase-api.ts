const BROWSERBASE_API_BASE = "https://api.browserbase.com/v1";

export type BrowserBaseSession = {
  id: string;
  connectUrl: string;
  status: string;
};

export async function createBrowserBaseSession(params: {
  apiKey: string;
  projectId: string;
}): Promise<BrowserBaseSession> {
  const res = await fetch(`${BROWSERBASE_API_BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BB-API-Key": params.apiKey,
    },
    body: JSON.stringify({ projectId: params.projectId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BrowserBase create session failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    id?: string;
    connectUrl?: string;
    status?: string;
  };
  const connectUrl = (data.connectUrl ?? "").trim();
  if (!data.id || !connectUrl) {
    throw new Error("BrowserBase create session: missing id or connectUrl");
  }
  return {
    id: data.id,
    connectUrl,
    status: data.status ?? "RUNNING",
  };
}

export async function releaseBrowserBaseSession(params: {
  apiKey: string;
  projectId: string;
  sessionId: string;
}): Promise<void> {
  const res = await fetch(`${BROWSERBASE_API_BASE}/sessions/${params.sessionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BB-API-Key": params.apiKey,
    },
    body: JSON.stringify({ projectId: params.projectId, status: "REQUEST_RELEASE" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BrowserBase release session failed: ${res.status} ${text}`);
  }
}
