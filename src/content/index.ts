import { siteSettings } from "./site";
import { MEDIA } from "./media";
import type { MediaCollection } from "./media";
import { privacyDoc, termsDoc } from "./legal";
import type { SiteSettings, LegalDoc, HeroContent } from "./types";

export interface SiteContent {
  site: SiteSettings;
  media: MediaCollection;
  hero: HeroContent;
  legal: {
    privacy: LegalDoc;
    terms: LegalDoc;
  };
}

export const heroContent: HeroContent = {
  headline: "Clear the concept. Then decode the question.",
  subheadline: "Rigorous curriculum coaching for Class V-XII across ICSE, CBSE, and West Bengal Board in Park Circus, Kolkata.",
  primaryCta: {
    label: "Inquire for admissions",
    href: "#enquiry",
  },
  secondaryCta: {
    label: "Explore courses",
    href: "#courses",
  },
  gallery: MEDIA.heroGallery,
};

export async function getSiteContent(): Promise<SiteContent> {
  return {
    site: siteSettings,
    media: MEDIA,
    hero: heroContent,
    legal: {
      privacy: privacyDoc,
      terms: termsDoc,
    },
  };
}

export * from "./types";
export * from "./media";
export * from "./site";
export * from "./legal";
