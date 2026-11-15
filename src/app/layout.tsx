import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { MotionProvider } from "@/lib/motion/MotionProvider";
import { MEDIA } from "@/content/media";
import { heroContent } from "@/content";
import { siteSettings } from "@/content/site";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

import { SITE_URL } from "@/lib/siteUrl";

async function publicContent() {
  if (process.env.NEXT_PUBLIC_AUTH_MODE !== "server") return { site: siteSettings, hero: heroContent, media: MEDIA };
  const { readPublishedCms } = await import("@/lib/cms/store");
  return readPublishedCms();
}

export async function generateMetadata(): Promise<Metadata> {
  const { site, hero, media } = await publicContent();
  const title = site.siteName;
  const description = hero.subheadline;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${title}` },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website", locale: "en_IN", url: "/", siteName: title, title, description,
      images: [{ url: media.og.url, width: media.og.width, height: media.og.height, alt: media.og.alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [media.og.url] },
  };
}

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { site } = await publicContent();
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.siteName,
    url: SITE_URL,
    telephone: site.phone,
    email: site.email,
    address: site.address,
  }).replaceAll("<", "\\u003c");
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <noscript>
          <style>{`.reveal-item { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body>
        <MotionProvider>
          <AuthProvider>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <Header />
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <CookieConsent />
          </AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
