import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import { validateCmsContent } from "@/lib/cms/content";
import { readCmsEditor } from "@/lib/cms/store";
import { WebsiteSections } from "@/components/landing/WebsiteSections";

export const metadata = { title: "Unpublished website preview", robots: { index: false, follow: false } };

async function Preview() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return <main>Preview is unavailable.</main>;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "developer" && user.role !== "academy-admin") return <main role="alert">Access denied.</main>;
  const editor = await readCmsEditor();
  if (!validateCmsContent(editor.draft)) return <main role="alert">The saved draft is invalid.</main>;
  return <>
    <div style={{ background: "var(--brand-navy)", color: "var(--brand-white)", padding: 12, textAlign: "center", fontWeight: 600 }}>Unpublished preview, saved version {editor.version}</div>
    <WebsiteSections content={editor.draft} />
  </>;
}

export default function PreviewPage() {
  return <Suspense fallback={<main role="status">Loading preview...</main>}><Preview /></Suspense>;
}
