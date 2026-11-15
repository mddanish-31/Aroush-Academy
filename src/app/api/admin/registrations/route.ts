import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { registrations } from "@/db/schema/admissions";
import { parents } from "@/db/schema/people";
import { users } from "@/db/schema/identity";
import { getCurrentUser } from "@/lib/auth/guard";

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  }

  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  if (admin.role !== "academy-admin") {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: registrations.id,
      name: registrations.name,
      identifier: registrations.identifier,
      role: registrations.role,
      class_id: registrations.class_id,
      board_id: registrations.board_id,
      guardian_name: registrations.guardian_name,
      guardian_identifier: registrations.guardian_identifier,
      guardian_email: registrations.guardian_email,
      guardian_phone: registrations.guardian_phone,
      class_grade: registrations.class_grade,
      ward_name: registrations.ward_name,
      status: registrations.status,
      rejection_reason: registrations.rejection_reason,
      reviewed_at: registrations.reviewed_at,
      submitted_at: registrations.submitted_at,
      created_at: registrations.created_at,
    })
    .from(registrations)
    .orderBy(desc(registrations.submitted_at));

  const parentAccounts = await db.select({ id: users.id, name: parents.name, phone: parents.phone })
    .from(parents).innerJoin(users, eq(parents.user_id, users.id));
  return NextResponse.json({ ok: true, registrations: rows, parentAccounts }, { headers: { "Cache-Control": "private, no-store" } });
}
