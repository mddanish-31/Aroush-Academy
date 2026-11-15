import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import { CmsEditor } from "@/components/cms/CmsEditor";

export const metadata = { title: "Website content", robots: { index: false, follow: false } };

async function Editor() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return <main>Content management is unavailable.</main>;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "developer" && user.role !== "academy-admin") return <main role="alert">Access denied.</main>;
  return <CmsEditor admin={user.role === "academy-admin"} />;
}

export default function DeveloperPage() {
  return <Suspense fallback={<main role="status">Loading content editor...</main>}><Editor /></Suspense>;
}
