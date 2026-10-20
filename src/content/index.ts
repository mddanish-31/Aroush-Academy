import { siteSettings } from "./site";
import { MEDIA } from "./media";
import type { MediaCollection } from "./media";
import { privacyDoc, termsDoc } from "./legal";
import { landingContent } from "./landing";
import type { SiteSettings, LegalDoc, HeroContent, LandingContent } from "./types";

export interface SiteContent {
  site: SiteSettings;
  media: MediaCollection;
  hero: HeroContent;
  landing: LandingContent;
  legal: {
    privacy: LegalDoc;
    terms: LegalDoc;
  };
}

export const heroContent: HeroContent = {
  headline: "Clear the concept. Then decode the question.",
  subheadline: "Coaching for Class V to XII in Park Circus, Kolkata. ICSE, CBSE and West Bengal Board.",
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
    landing: landingContent,
    legal: {
      privacy: privacyDoc,
      terms: termsDoc,
    },
  };
}

export * from "./types";
export * from "./media";
export * from "./site";
export * from "./landing";
export * from "./legal";
export * from "./enquiry";
