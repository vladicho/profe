/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import type { LoginSession, LoginSessionInput } from "./login-registry";
export { LoginRegistry } from "./login-registry";

type AccessIdentity = {
  email: string;
  name: string;
  userId: string;
  loginAt: number;
  ip: string;
  country: string;
  provider: string;
};

type AdminUser = {
  email: string;
  name: string;
  userId: string;
  loginCount: number;
  firstLoginAt: number;
  lastLoginAt: number;
  lastSeenAt: number;
  country: string;
  ip: string;
  provider: string;
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function monthKeys(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - index, 1));
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

function monthKey(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function accessIdentity(ctx: ExecutionContext): Promise<AccessIdentity | null> {
  const identity = await ctx.access?.getIdentity();
  const email = identity?.email?.trim().toLowerCase();
  const loginAt = Number(identity?.iat);
  const userId = identity?.user_uuid?.trim();

  if (!email || !userId || !Number.isFinite(loginAt) || loginAt <= 0) return null;

  return {
    email,
    name: identity?.name?.trim() || email.split("@")[0],
    userId,
    loginAt,
    ip: identity?.ip?.trim() || "",
    country: identity?.geo?.country?.trim().toUpperCase() || "",
    provider: identity?.idp?.type?.trim() || "cloudflare-access",
  };
}

async function recordLogin(env: Env, identity: AccessIdentity): Promise<void> {
  const seenAt = Math.floor(Date.now() / 1000);
  const input: LoginSessionInput = {
    id: `${identity.userId}:${identity.loginAt}`,
    email: identity.email,
    userId: identity.userId,
    name: identity.name,
    loginAt: identity.loginAt,
    seenAt,
    ip: identity.ip,
    country: identity.country,
    provider: identity.provider,
  };
  const registry = env.LOGIN_REGISTRY.getByName(monthKey(identity.loginAt));
  await registry.record(input);
}

async function loadSessions(env: Env): Promise<LoginSession[]> {
  const results = await Promise.all(
    monthKeys(12).map((key) => env.LOGIN_REGISTRY.getByName(key).listSessions(1000)),
  );
  const unique = new Map<string, LoginSession>();
  for (const session of results.flat()) unique.set(session.id, session);
  return [...unique.values()].sort((a, b) => b.loginAt - a.loginAt);
}

function summarizeUsers(sessions: LoginSession[]): AdminUser[] {
  const users = new Map<string, AdminUser>();
  for (const session of sessions) {
    const current = users.get(session.email);
    if (!current) {
      users.set(session.email, {
        email: session.email,
        name: session.name,
        userId: session.userId,
        loginCount: 1,
        firstLoginAt: session.loginAt,
        lastLoginAt: session.loginAt,
        lastSeenAt: session.lastSeenAt,
        country: session.country,
        ip: session.ip,
        provider: session.provider,
      });
      continue;
    }
    current.loginCount += 1;
    current.firstLoginAt = Math.min(current.firstLoginAt, session.loginAt);
    if (session.loginAt >= current.lastLoginAt) {
      current.name = session.name;
      current.userId = session.userId;
      current.lastLoginAt = session.loginAt;
      current.lastSeenAt = session.lastSeenAt;
      current.country = session.country;
      current.ip = session.ip;
      current.provider = session.provider;
    }
  }
  return [...users.values()].sort((a, b) => b.lastLoginAt - a.lastLoginAt);
}

async function adminResponse(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "GET") return json({ ok: false, error: "Método não permitido." }, 405);
  const identity = await accessIdentity(ctx);
  if (!identity) return json({ ok: false, error: "Sessão do Cloudflare Access não encontrada." }, 401);
  if (identity.email !== env.ADMIN_EMAIL.trim().toLowerCase()) {
    return json({ ok: false, error: "Acesso restrito ao administrador." }, 403);
  }

  await recordLogin(env, identity);
  const sessions = await loadSessions(env);
  const users = summarizeUsers(sessions);
  return json({
    ok: true,
    currentUser: { email: identity.email, name: identity.name },
    totals: {
      users: users.length,
      logins: sessions.length,
      loginsToday: sessions.filter((item) => item.loginAt >= Math.floor(Date.now() / 1000) - 86400).length,
    },
    users,
    recent: sessions.slice(0, 100),
  });
}

function forbiddenPage(): Response {
  return new Response(
    "<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Acesso restrito</title><body style=\"font-family:system-ui;background:#07131e;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0\"><main><h1>Acesso restrito</h1><p>Este painel é exclusivo do administrador do Profe.</p><a style=\"color:#c9ff36\" href=\"/\">Voltar ao Profe</a></main></body></html>",
    { status: 403, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

function imageOutputFormat(format: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif" {
  if (format === "image/jpeg" || format === "image/png" || format === "image/gif" || format === "image/avif") return format;
  return "image/webp";
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/admin/logins") {
      return adminResponse(request, env, ctx);
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      const identity = await accessIdentity(ctx);
      if (!identity || identity.email !== env.ADMIN_EMAIL.trim().toLowerCase()) return forbiddenPage();
      ctx.waitUntil(recordLogin(env, identity));
    } else if (request.method === "GET" && request.headers.get("Accept")?.includes("text/html")) {
      ctx.waitUntil((async () => {
        const identity = await accessIdentity(ctx);
        if (identity) await recordLogin(env, identity);
      })());
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format: imageOutputFormat(format), quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
