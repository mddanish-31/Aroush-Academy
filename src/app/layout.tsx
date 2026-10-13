import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CookieConsent } from "@/components/common/CookieConsent";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
  title: "ArousH Academy (Azhar Sir) — Coaching for ICSE, CBSE & WB Board | Park Circus, Kolkata",
  description:
    "Premier academic coaching for Classes V–XII in Park Circus, Kolkata under Azhar Sir. Dedicated subject specialists, dual-faculty mathematics, and monthly mock test preparation.",
  keywords: [
    "ArousH Academy",
    "Azhar Sir",
    "Park Circus Coaching",
    "ICSE Coaching Kolkata",
    "CBSE Coaching Kolkata",
    "West Bengal Board Tuition",
    "Classes V-XII Coaching",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
