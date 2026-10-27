

import type { StudyMaterialItem } from "../types";


export function sanitizeFilename(title: string | null | undefined, fallbackId = "resource"): string {
  if (!title || typeof title !== "string") {
    return `${fallbackId}.txt`;
  }
  const clean = title
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);

  return clean ? `${clean}.txt` : `${fallbackId}.txt`;
}


export function formatDownloadableContent(item: StudyMaterialItem): string {
  const divider = "=".repeat(78);
  const subDivider = "-".repeat(78);

  return [
    divider,
    "AROUSH ACADEMY - DIGITAL STUDY RESOURCE (DEMO EXTRACT)",
    divider,
    "NOTICE: Locally generated text file for interactive demo preview.",
    "Provided for curriculum demonstration at ArousH Academy (Kolkata).",
    "Not an official board publication or original server-stored PDF.",
    subDivider,
    `Title:        ${item.title}`,
    `Subject:      ${item.subject}`,
    `Class/Grade:  ${item.classGrade}`,
    `Resource:     ${item.type}`,
    `Instructor:   ${item.uploadedBy}`,
    `Date:         ${item.date}`,
    divider,
    "",
    item.content?.trim() || "No text content available.",
    "",
    subDivider,
    `Generated via ArousH Academy Portal on ${new Date().toISOString().split("T")[0]}`,
    "For academy inquiries: contact@aroush-academy.edu.in",
    divider,
  ].join("\n");
}


export function triggerTextDownload(content: string, filename: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 250);
    return true;
  } catch (error) {
    console.error("Failed to trigger browser download:", error);
    return false;
  }
}
