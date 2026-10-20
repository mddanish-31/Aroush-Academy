import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { MotionProvider } from "@/lib/motion/MotionProvider";
import { MEDIA } from "@/content/media";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ArousH Academy - Coaching for ICSE, CBSE & WB Board | Park Circus, Kolkata",
    template: "%s | ArousH Academy",
  },
  description:
    "Premier academic coaching for Class V-XII in Park Circus, Kolkata under Azhar Sir. Dedicated subject specialists, dual-faculty mathematics, and monthly mock test preparation.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "ArousH Academy",
    title: "ArousH Academy - Coaching for ICSE, CBSE & WB Board | Park Circus, Kolkata",
    description:
      "Premier academic coaching for Class V-XII in Park Circus, Kolkata under Azhar Sir. Dedicated subject specialists, dual-faculty mathematics, and monthly mock test preparation.",
    images: [
      {
        url: MEDIA.og.url,
        width: MEDIA.og.width,
        height: MEDIA.og.height,
        alt: MEDIA.og.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArousH Academy - Coaching for ICSE, CBSE & WB Board | Park Circus, Kolkata",
    description:
      "Premier academic coaching for Class V-XII in Park Circus, Kolkata under Azhar Sir. Dedicated subject specialists, dual-faculty mathematics, and monthly mock test preparation.",
    images: [MEDIA.og.url],
  },
  keywords: [
    "ArousH Academy",
    "Azhar Sir",
    "Park Circus Coaching",
    "ICSE Coaching Kolkata",
    "CBSE Coaching Kolkata",
    "West Bengal Board Tuition",
    "Class V-XII Coaching",
    "Class 10 Board Prep",
    "Class 12 Maths Kolkata",
  ],
  authors: [{ name: "ArousH Academy" }],
};

export const viewport: Viewport = {
  themeColor: "#F5F5F7",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "ArousH Academy",
  alternateName: "ArousH Academy (Azhar Sir)",
  url: SITE_URL,
  telephone: "+919883005641",
  email: "aroushacademyazharsir@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge",
    addressLocality: "Kolkata",
    addressRegion: "West Bengal",
    postalCode: "700017",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
