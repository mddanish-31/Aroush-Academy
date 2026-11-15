import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server" || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}