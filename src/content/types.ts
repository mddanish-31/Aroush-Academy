export type MediaKind = "image" | "video";

export interface VideoSource {
  src: string;
  type: string;
}

export interface MediaItem {
  id: string;
  kind: MediaKind;
  url: string;
  posterUrl?: string;
  alt: string;
  width: number;
  height: number;
  credit?: string;
  creditUrl?: string;
  isStock: boolean;
  caption?: string;
  video?: VideoSource;
}

export interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface SiteFeatureFlags {
  showPricing: boolean;
  showSampleReviews: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  address: string;
  phone: string;
  phoneSecondary?: string;
  email: string;
  socialLinks: SocialLink[];
  featureFlags: SiteFeatureFlags;
  navGroups: NavGroup[];
}

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  listItems?: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSection[];
}

export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
  gallery: MediaItem[];
}
