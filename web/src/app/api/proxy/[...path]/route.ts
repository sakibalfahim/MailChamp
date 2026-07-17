import { auth } from "@/lib/auth";
import { mintApiJWT } from "@/lib/jwt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** Hobby may clamp lower; keep budget aligned with cold-start UX. */
export const maxDuration = 60;

const GO_API = process.env.GO_API_URL?.replace(/\/$/, "");
/** Align with client cold-start budget (Render + Neon wake). */
const UPSTREAM_TIMEOUT_MS = 90_000;

function sanitizeProxyPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const seg of segments) {
    if (!seg || seg === "." || seg === ".." || seg.includes("\\") || seg.includes("\0")) {
      return null;
    }
  }
  return "/" + segments.join("/");
}

async function proxyRequest(req: NextRequest, path: string) {
  if (!GO_API) {
    return NextResponse.json({ error: "GO_API_URL not configured" }, { status: 503 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let jwt: string;
  try {
    jwt = await mintApiJWT(session.user.id);
  } catch {
    return NextResponse.json({ error: "auth bridge misconfigured" }, { status: 503 });
  }

  const url = `${GO_API}/api/v1${path}${req.nextUrl.search}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const init: RequestInit = {
      method: req.method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": req.headers.get("Content-Type") ?? "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await req.text();
    }

    const upstream = await fetch(url, init);
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: aborted ? "upstream timeout" : "upstream unreachable" },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const safe = sanitizeProxyPath(path);
  if (!safe) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  return proxyRequest(req, safe);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const safe = sanitizeProxyPath(path);
  if (!safe) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  return proxyRequest(req, safe);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const safe = sanitizeProxyPath(path);
  if (!safe) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  return proxyRequest(req, safe);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const safe = sanitizeProxyPath(path);
  if (!safe) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  return proxyRequest(req, safe);
}
