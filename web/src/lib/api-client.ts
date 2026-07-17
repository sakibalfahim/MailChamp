export type EmailRecord = {
  id: string;
  user_id: string;
  status: "draft" | "sent" | "archived";
  subject: string;
  body_html: string;
  body_text: string;
  intent?: string | null;
  key_facts: string[];
  tone?: string | null;
  strategy?: "advanced" | "naive" | null;
  to_address?: string | null;
  created_at: string;
  updated_at: string;
};

export type GenerateResult = {
  subject: string;
  body_text: string;
  body_html: string;
  model_used?: string;
};

const CLIENT_TIMEOUT_MS = 90_000;

async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
  retries = 1,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (retries > 0 && (res.status >= 500 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetchWithRetry(input, init, retries - 1);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetchWithRetry(input, init, retries - 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetchWithRetry(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error ?? body;
    } catch {
      /* keep raw */
    }
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const mailApi = {
  list: (status?: string) =>
    apiFetch(`/emails${status ? `?status=${encodeURIComponent(status)}` : ""}`) as Promise<{
      emails: EmailRecord[];
    }>,
  get: (id: string) => apiFetch(`/emails/${id}`) as Promise<EmailRecord>,
  create: (body: Partial<EmailRecord>) =>
    apiFetch("/emails", { method: "POST", body: JSON.stringify(body) }) as Promise<EmailRecord>,
  patch: (id: string, body: Partial<EmailRecord>) =>
    apiFetch(`/emails/${id}`, { method: "PATCH", body: JSON.stringify(body) }) as Promise<EmailRecord>,
  delete: (id: string) => apiFetch(`/emails/${id}`, { method: "DELETE" }),
  generate: (body: {
    intent: string;
    key_facts: string[];
    tone: string;
    strategy: "advanced" | "naive";
  }) =>
    apiFetch("/emails/generate", { method: "POST", body: JSON.stringify(body) }) as Promise<GenerateResult>,
};
