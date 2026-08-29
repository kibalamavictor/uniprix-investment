export interface Env {
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  CMS_USERNAME: string;
  CMS_AUTH_SALT: string;
  CMS_PASSWORD_HASH: string;
  CMS_GITHUB_TOKEN: string;
  CMS_SESSION_SECRET: string;
  ALLOWED_ORIGINS: string;
}

interface JwtPayload {
  sub: string;
  exp: number;
}

const ALLOWED_PATHS = ["_data/site.json", "data/cms/", "media/"];
const SESSION_LONG_SEC = 7 * 24 * 60 * 60;
const SESSION_SHORT_SEC = 8 * 60 * 60;

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function getOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allowed = getOrigins(env);
  const match = allowed.includes(origin) ? origin : allowed[0] || "";
  return {
    "access-control-allow-origin": match,
    "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

function isAllowedPath(path: string): boolean {
  if (!path || path.includes("..") || path.startsWith("/")) return false;
  return ALLOWED_PATHS.some((prefix) => path === prefix || path.startsWith(prefix));
}

function base64urlEncode(data: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}${password}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64urlEncode(signature)}`;
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlDecode(signature),
    new TextEncoder().encode(unsigned),
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as JwtPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function requireAuth(request: Request, env: Env): Promise<JwtPayload | Response> {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return json({ error: "Unauthorized" }, 401);

  const payload = await verifyJwt(token, env.CMS_SESSION_SECRET);
  if (!payload) return json({ error: "Session expired" }, 401);
  return payload;
}

async function githubFetch(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`);
  url.searchParams.set("ref", env.GITHUB_BRANCH);

  return fetch(url.toString(), {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.CMS_GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "uniprix-cms-api",
      ...(init.headers || {}),
    },
  });
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  let body: { username?: string; password?: string; remember?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (username !== env.CMS_USERNAME) {
    return json({ error: "Invalid username or password" }, 401);
  }

  const hash = await hashPassword(password, env.CMS_AUTH_SALT);
  if (hash !== env.CMS_PASSWORD_HASH) {
    return json({ error: "Invalid username or password" }, 401);
  }

  const ttl = body.remember ? SESSION_LONG_SEC : SESSION_SHORT_SEC;
  const token = await signJwt(
    { sub: username, exp: Math.floor(Date.now() / 1000) + ttl },
    env.CMS_SESSION_SECRET,
  );

  return json({
    token,
    user: username,
    expires: Date.now() + ttl * 1000,
  });
}

async function handleGetFile(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const path = new URL(request.url).searchParams.get("path") || "";
  if (!isAllowedPath(path)) return json({ error: "Path not allowed" }, 403);

  const gh = await githubFetch(env, path);
  const data = await gh.json().catch(() => ({}));

  if (!gh.ok) {
    const msg = (data as { message?: string }).message;
    return json(
      { error: msg || `GitHub API error (${gh.status})` },
      gh.status,
    );
  }

  return json(data, gh.status);
}

async function handleListDir(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const path = new URL(request.url).searchParams.get("path") || "";
  if (!isAllowedPath(path)) return json({ error: "Path not allowed" }, 403);

  const gh = await githubFetch(env, path);
  const data = await gh.json().catch(() => ({}));

  if (!gh.ok) {
    const msg = (data as { message?: string }).message;
    return json({ error: msg || `GitHub API error (${gh.status})` }, gh.status);
  }

  return json(data, gh.status);
}

async function handlePutFile(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: { path?: string; content?: string; message?: string; sha?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const path = body.path || "";
  if (!isAllowedPath(path)) return json({ error: "Path not allowed" }, 403);
  if (!body.content) return json({ error: "Missing content" }, 400);

  const payload: Record<string, string> = {
    message: body.message || `CMS: update ${path}`,
    content: body.content,
    branch: env.GITHUB_BRANCH,
  };
  if (body.sha) payload.sha = body.sha;

  const gh = await githubFetch(env, path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await gh.json().catch(() => ({}));
  if (!gh.ok) {
    return json({ error: (data as { message?: string }).message || "Save failed" }, gh.status);
  }

  return json(data, gh.status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    try {
      let response: Response;

      if (request.method === "POST" && url.pathname === "/auth/login") {
        response = await handleLogin(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/file") {
        response = await handleGetFile(request, env);
      } else if (request.method === "GET" && url.pathname === "/api/dir") {
        response = await handleListDir(request, env);
      } else if (request.method === "PUT" && url.pathname === "/api/file") {
        response = await handlePutFile(request, env);
      } else if (request.method === "GET" && url.pathname === "/health") {
        response = json({ ok: true });
      } else {
        response = json({ error: "Not found" }, 404);
      }

      return withCors(response, request, env);
    } catch {
      return withCors(json({ error: "Server error" }, 500), request, env);
    }
  },
};
