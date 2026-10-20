import React from "react";
import { Hero } from "@/components/landing/Hero";
import { WhatWeTeach } from "@/components/landing/WhatWeTeach";
import { AcademyIntro } from "@/components/landing/AcademyIntro";
import { Courses } from "@/components/landing/Courses";
import { Features } from "@/components/landing/Features";
import { Faculty } from "@/components/landing/Faculty";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { EnquirySection } from "@/components/landing/EnquirySection";
import { FaqPreview } from "@/components/landing/FaqPreview";
import { FinalCta } from "@/components/landing/FinalCta";
import { Pricing } from "@/components/landing/Pricing";
import { getSiteContent } from "@/content";

export default async function HomePage() {
  const { site, hero } = await getSiteContent();

  return (
    <>
      <Hero hero={hero} />
      <WhatWeTeach />
      <AcademyIntro />
      <Courses />
      <Features />
      <Faculty />
      <HowItWorks />
      <EnquirySection />
      <FaqPreview />
      {site.featureFlags.showPricing && <Pricing />}
      <FinalCta />
    </>
  );
}

