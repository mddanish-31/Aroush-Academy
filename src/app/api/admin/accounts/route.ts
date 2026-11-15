import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/identity";
import { getCurrentUser } from "@/lib/auth/guard";

export async function GET() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return NextResponse.json({ ok: false }, { status: 404 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    if (user.role !== "academy-admin") return NextResponse.json({ ok: false }, { status: 403 });
    const accounts = await db.select({ id: users.id, name: users.name, identifier: users.identifier, role: users.role, status: users.status }).from(users).limit(500);
    return NextResponse.json({ ok: true, accounts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
