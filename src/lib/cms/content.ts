import { heroContent } from "@/content";
import { landingContent } from "@/content/landing";
import { MEDIA } from "@/content/media";
import { siteSettings } from "@/content/site";
import type { HeroContent, LandingContent, SiteSettings } from "@/content/types";
import type { MediaCollection } from "@/content/media";

export interface CmsContent {
  site: SiteSettings;
  hero: HeroContent;
  landing: LandingContent;
  media: MediaCollection;
}

export const initialCmsContent: CmsContent = {
  site: siteSettings,
  hero: heroContent,
  landing: landingContent,
  media: MEDIA,
};

function validLink(value: string, key: string): boolean {
  if (key === "href") return value.startsWith("/") || value.startsWith("#");
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

function followsShape(value: unknown, sample: unknown, key = "", depth = 0): boolean {
  if (depth > 12) return false;
  if (typeof sample === "string") {
    if (typeof value !== "string" || value.length > 3000) return false;
    if (["url", "posterUrl", "creditUrl", "src", "href"].includes(key) && value && !validLink(value, key)) return false;
    return true;
  }
  if (typeof sample === "number") return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000;
  if (typeof sample === "boolean") return typeof value === "boolean";
  if (Array.isArray(sample)) {
    if (!Array.isArray(value) || value.length > 40 || (sample.length > 0 && value.length === 0)) return false;
    return value.every((entry) => sample.some((example) => followsShape(entry, example, key, depth + 1)));
  }
  if (!sample || typeof sample !== "object" || !value || typeof value !== "object" || Array.isArray(value)) return false;
  const template = sample as Record<string, unknown>;
  const input = value as Record<string, unknown>;
  const required = Object.keys(template).filter((field) => template[field] !== undefined);
  if (Object.keys(input).some((field) => !(field in template)) || required.some((field) => !(field in input))) return false;
  return Object.keys(input).every((field) => followsShape(input[field], template[field], field, depth + 1));
}

export function validateCmsContent(value: unknown): value is CmsContent {
  if (!followsShape(value, initialCmsContent)) return false;
  const content = value as CmsContent;
  const images = [...content.media.heroGallery, ...content.media.campus, ...Object.values(content.media.courses), content.media.og, ...content.hero.gallery];
  if (!images.every((item) => item.url.startsWith("/") && !item.url.startsWith("//") ||
    item.url.startsWith("https://") && new URL(item.url).hostname === "images.unsplash.com")) return false;
  const sections = [content.landing.pillars, content.landing.courses, content.landing.features, content.landing.faculty, content.landing.roles, content.landing.faqs, content.media.heroGallery, content.media.campus];
  return sections.every((items) => {
    const ids = items.map((item) => item.id);
    return ids.every((id) => typeof id === "string" && id.length > 0) && new Set(ids).size === ids.length;
  });
}
