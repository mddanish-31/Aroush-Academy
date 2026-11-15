import { db, pool } from "../src/db";
import { cms_documents } from "../src/db/schema/cms";
import { initialCmsContent } from "../src/lib/cms/content";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Initial CMS import is limited to a local database");

const result = await db.insert(cms_documents).values({
  key: "website",
  draft: initialCmsContent,
  published: initialCmsContent,
  version: 1,
  published_version: 1,
}).onConflictDoNothing().returning({ key: cms_documents.key });

console.log(result.length ? "Initial CMS content imported from src/content" : "CMS content already exists; no changes made");
await pool.end();
