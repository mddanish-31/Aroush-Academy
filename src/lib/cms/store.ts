import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheTag, revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db";
import { cms_documents, cms_revisions } from "@/db/schema/cms";
import { audit_logs } from "@/db/schema/audit";
import type { SessionUser } from "@/lib/auth/session";
import { initialCmsContent, validateCmsContent, type CmsContent } from "./content";

const key = "website";

export class CmsError extends Error {
  constructor(public reason: "invalid_request" | "conflict" | "not_found", public status: number) { super(reason); }
}

function audit(actor: SessionUser, action: string, version: number) {
  return {
    performed_by_id: actor.id,
    performed_by_name: actor.name,
    actor_role: actor.role,
    action,
    action_type: "UPDATE",
    category: "cms",
    target: `cms:${key}`,
    entity_type: "cms_document",
    entity_id: key,
    details: `${action} version ${version}`,
    source_portal: "developer",
  };
}

export async function readPublishedCms(): Promise<CmsContent> {
  "use cache";
  cacheTag("website-cms");
  try {
    const [document] = await db.select({ published: cms_documents.published }).from(cms_documents).where(eq(cms_documents.key, key)).limit(1);
    if (!document) return initialCmsContent;
    if (!validateCmsContent(document.published)) throw new Error("Invalid published CMS data");
    return document.published;
  } catch {
    return initialCmsContent;
  }
}

export async function readCmsEditor() {
  const [document] = await db.select().from(cms_documents).where(eq(cms_documents.key, key)).limit(1);
  const history = document ? await db.select({ id: cms_revisions.id, version: cms_revisions.version, action: cms_revisions.action,
    createdAt: cms_revisions.created_at }).from(cms_revisions).where(eq(cms_revisions.document_key, key))
    .orderBy(desc(cms_revisions.created_at)).limit(30) : [];
  return { draft: document?.draft ?? initialCmsContent, published: document?.published ?? initialCmsContent,
    version: document?.version ?? 0, publishedVersion: document?.published_version ?? 0, history };
}

export async function saveCmsDraft(value: unknown, expectedVersion: unknown, actor: SessionUser) {
  if (!validateCmsContent(value) || !Number.isInteger(expectedVersion) || Number(expectedVersion) < 0) throw new CmsError("invalid_request", 400);
  const version = Number(expectedVersion);
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(cms_documents).where(eq(cms_documents.key, key)).for("update").limit(1);
    if (!current && version !== 0 || current && current.version !== version) throw new CmsError("conflict", 409);
    const next = current ? version + 1 : 2;
    if (current) await tx.update(cms_documents).set({ draft: value, version: next, updated_at: new Date() }).where(eq(cms_documents.key, key));
    else await tx.insert(cms_documents).values({ key, draft: value, published: initialCmsContent, version: next, published_version: 1 });
    await tx.insert(cms_revisions).values({ document_key: key, version: next, action: "save", snapshot: value, performed_by_id: actor.id });
    await tx.insert(audit_logs).values(audit(actor, "cms_draft_saved", next));
    return { version: next, publishedVersion: current?.published_version ?? 1 };
  });
}

export async function publishCms(expectedVersion: unknown, actor: SessionUser) {
  if (!Number.isInteger(expectedVersion) || Number(expectedVersion) < 1) throw new CmsError("invalid_request", 400);
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(cms_documents).where(eq(cms_documents.key, key)).for("update").limit(1);
    if (!current) throw new CmsError("not_found", 404);
    if (current.version !== expectedVersion) throw new CmsError("conflict", 409);
    if (!validateCmsContent(current.draft)) throw new CmsError("invalid_request", 400);
    const next = current.version + 1;
    await tx.update(cms_documents).set({ published: current.draft, version: next, published_version: next, updated_at: new Date() }).where(eq(cms_documents.key, key));
    await tx.insert(cms_revisions).values({ document_key: key, version: next, action: "publish", snapshot: current.draft, performed_by_id: actor.id });
    await tx.insert(audit_logs).values(audit(actor, "cms_published", next));
    return { version: next, publishedVersion: next };
  });
  revalidateTag("website-cms", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/faq");
  return result;
}

export async function rollbackCms(revisionId: unknown, expectedVersion: unknown, actor: SessionUser) {
  if (typeof revisionId !== "string" || !/^[0-9a-f-]{36}$/i.test(revisionId) || !Number.isInteger(expectedVersion)) throw new CmsError("invalid_request", 400);
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(cms_documents).where(eq(cms_documents.key, key)).for("update").limit(1);
    if (!current) throw new CmsError("not_found", 404);
    if (current.version !== expectedVersion) throw new CmsError("conflict", 409);
    const [revision] = await tx.select().from(cms_revisions).where(eq(cms_revisions.id, revisionId)).limit(1);
    if (!revision || revision.document_key !== key || !validateCmsContent(revision.snapshot)) throw new CmsError("not_found", 404);
    const next = current.version + 1;
    await tx.update(cms_documents).set({ draft: revision.snapshot, published: revision.snapshot, version: next,
      published_version: next, updated_at: new Date() }).where(eq(cms_documents.key, key));
    await tx.insert(cms_revisions).values({ document_key: key, version: next, action: "rollback", snapshot: revision.snapshot, performed_by_id: actor.id });
    await tx.insert(audit_logs).values(audit(actor, "cms_rolled_back", next));
    return { version: next, publishedVersion: next };
  });
  revalidateTag("website-cms", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/faq");
  return result;
}