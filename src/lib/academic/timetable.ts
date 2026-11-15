import "server-only";
import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { timetable_events } from "@/db/schema/academic";
import { audit_logs } from "@/db/schema/audit";
import { batches } from "@/db/schema/cohorts";
import type { ServerIdentity } from "@/lib/auth/profileTypes";
import { conflict, forbidden, invalid, textValue, uuid } from "./access";

function instant(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}

export async function createTimetable(input: Record<string, unknown>, actor: ServerIdentity) {
  if (!uuid(input.batchId) || !textValue(input.title, 160) || !instant(input.startsAt) || !instant(input.endsAt)) return invalid();
  if (actor.role !== "teacher" && actor.role !== "academy-admin") return forbidden();
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (endsAt.getTime() <= startsAt.getTime() || endsAt.getTime() - startsAt.getTime() > 6 * 3600000 || startsAt.getTime() < Date.now() - 86400000) return invalid();
  return db.transaction(async (tx) => {
    const [batch] = await tx.select({ id: batches.id, teacherId: batches.teacher_id }).from(batches)
      .where(and(eq(batches.id, input.batchId as string), eq(batches.status, "active"))).for("share");
    if (!batch || (actor.role === "teacher" && batch.teacherId !== actor.profile?.id)) return forbidden();
    await tx.execute(sql`select pg_advisory_xact_lock(9421, hashtext(${batch.teacherId}))`);
    const [overlap] = await tx.select({ id: timetable_events.id }).from(timetable_events)
      .where(and(eq(timetable_events.status, "scheduled"), or(eq(timetable_events.teacher_id, batch.teacherId), eq(timetable_events.batch_id, batch.id)), lt(timetable_events.starts_at, endsAt), gt(timetable_events.ends_at, startsAt))).limit(1);
    if (overlap) return conflict();
    const [event] = await tx.insert(timetable_events).values({ batch_id: batch.id, teacher_id: batch.teacherId, title: (input.title as string).trim(), starts_at: startsAt, ends_at: endsAt, created_by_id: actor.id }).returning({ id: timetable_events.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: actor.role, action: "timetable_created", action_type: "CREATE", category: "academic", target: `timetable:${event.id}`, details: "Timetable event scheduled", entity_type: "timetable", entity_id: event.id, source_portal: actor.role === "teacher" ? "teacher" : "admin" });
    return event;
  });
}

export async function cancelTimetable(input: Record<string, unknown>, actor: ServerIdentity) {
  if (!uuid(input.id) || typeof input.version !== "string" || !textValue(input.reason, 500)) return invalid();
  if (actor.role !== "teacher" && actor.role !== "academy-admin") return forbidden();
  return db.transaction(async (tx) => {
    const [event] = await tx.select({ id: timetable_events.id, batchId: timetable_events.batch_id, version: sql<string>`${timetable_events.updated_at}::text`, status: timetable_events.status }).from(timetable_events).where(eq(timetable_events.id, input.id as string)).for("update");
    if (!event) return forbidden();
    const [batch] = await tx.select({ teacherId: batches.teacher_id }).from(batches).where(eq(batches.id, event.batchId));
    if (actor.role === "teacher" && batch?.teacherId !== actor.profile?.id) return forbidden();
    if (event.status !== "scheduled" || event.version !== input.version) return conflict();
    const [updated] = await tx.update(timetable_events).set({ status: "cancelled", updated_at: sql`clock_timestamp()` }).where(eq(timetable_events.id, event.id)).returning({ id: timetable_events.id });
    await tx.insert(audit_logs).values({ performed_by_id: actor.id, performed_by_name: actor.name, actor_role: actor.role, action: "timetable_cancelled", action_type: "UPDATE", category: "academic", target: `timetable:${event.id}`, details: (input.reason as string).trim(), entity_type: "timetable", entity_id: event.id, source_portal: actor.role === "teacher" ? "teacher" : "admin" });
    return updated;
  });
}
