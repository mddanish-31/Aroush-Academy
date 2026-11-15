import type { NextRequest } from "next/server";

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    const loopback = (url: URL) => url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (source.protocol === "http:" && !loopback(source)) return false;
    if (source.origin === target.origin) return true;
    if (loopback(source) && loopback(target) && request.headers.get("host") === source.host) return true;
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    return Boolean(configured && new URL(configured).origin === source.origin && source.protocol === "https:");
  } catch {
    return false;
  }
}

export async function readJsonBounded(request: NextRequest, maxBytes = 8192): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new Error("invalid_request");
  if (!request.body) throw new Error("invalid_request");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("invalid_request");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
