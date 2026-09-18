import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');

/**
 * Where a request for /api/<path> goes, or null when the path is not a plain API path.
 *
 * Next hands the catch-all segments over already percent-DEcoded, so they are re-encoded one by
 * one before being joined. Pasted back raw, `/api/..%2Factuator` would climb out of /api, and
 * `/api/auth/login%3F` would reach the login endpoint under a spelling that nginx's rate limit on
 * /api/auth/login does not recognise.
 */
function targetFor(path: string[], search: string): string | null {
  if (path.some((segment) => segment === '' || segment === '.' || segment === '..')) return null;
  const url = new URL(`${BACKEND}/api/${path.map(encodeURIComponent).join('/')}${search}`);
  return url.pathname.startsWith('/api/') ? url.toString() : null;
}

/**
 * Server-side proxy: the browser only ever talks to this app's own origin and the
 * Spring Boot API can stay on a private port. Every /api/* call is forwarded as-is.
 */
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = targetFor(path, request.nextUrl.search);
  if (!target) {
    return NextResponse.json({ status: 400, error: 'Bad Request', message: 'Malformed API path.' }, { status: 400 });
  }

  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', 'application/json');

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  try {
    const response = await fetch(target, { method, headers, body, cache: 'no-store' });
    const payload = await response.text();
    if (!payload) {
      return new NextResponse(null, { status: response.status });
    }
    return new NextResponse(payload, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { status: 502, error: 'Bad Gateway', message: 'The Tasks API is not reachable right now.' },
      { status: 502 },
    );
  }
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as HEAD,
};
