import React, { Suspense } from "react";
import { connection } from "next/server";
import { WebsiteSections } from "@/components/landing/WebsiteSections";
import { getSiteContent } from "@/content";
import { readPublishedCms } from "@/lib/cms/store";

async function HomeContent() {
  await connection();
  const content = process.env.NEXT_PUBLIC_AUTH_MODE === "server" ? await readPublishedCms() : await getSiteContent();
  return <WebsiteSections content={content} />;
}

export default function HomePage() {
  return <Suspense fallback={<main role="status">Loading website...</main>}><HomeContent /></Suspense>;
}

