ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'developer';
CREATE TABLE "cms_documents" (
  "key" varchar(40) PRIMARY KEY,
  "draft" jsonb NOT NULL,
  "published" jsonb NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "published_version" integer NOT NULL DEFAULT 1,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cms_documents_version_positive" CHECK ("version" > 0 AND "published_version" > 0 AND "published_version" <= "version")
);
CREATE TABLE "cms_revisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_key" varchar(40) NOT NULL REFERENCES "cms_documents"("key"),
  "version" integer NOT NULL,
  "action" varchar(20) NOT NULL,
  "snapshot" jsonb NOT NULL,
  "performed_by_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cms_revisions_action_valid" CHECK ("action" IN ('save', 'publish', 'rollback'))
);
CREATE INDEX "idx_cms_revisions_document_created" ON "cms_revisions"("document_key", "created_at" DESC);
