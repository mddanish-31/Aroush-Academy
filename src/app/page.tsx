import React from "react";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { AcademyIntro } from "@/components/landing/AcademyIntro";
import { Courses } from "@/components/landing/Courses";
import { Features } from "@/components/landing/Features";
import { Faculty } from "@/components/landing/Faculty";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RolesOverview } from "@/components/landing/RolesOverview";
import { EnquirySection } from "@/components/landing/EnquirySection";
import { FaqPreview } from "@/components/landing/FaqPreview";
import { FinalCta } from "@/components/landing/FinalCta";

export default function HomePage() {
  return (
    <>
      {/* 1. Visually Rich Split Hero Section */}
      <Hero />

      {/* 2. Continuous Educational Text Marquee */}
      <Marquee />

      {/* 3. Academy Overview & Teaching Methodology */}
      <AcademyIntro />

      {/* 4. Courses & Curriculum Streams (Classes V–XII) */}
      <Courses />

      {/* 5. Why Choose AROUSH Academy (Educational Pillars) */}
      <Features />

      {/* 6. Subject Faculty & Specialists Showcase */}
      <Faculty />

      {/* 7. Student Academic & Admissions Journey */}
      <HowItWorks />

      {/* 8. Enrolled Student & Parent Portal Access */}
      <RolesOverview />

      {/* 9. Direct Campus Contact & Admission Inquiries */}
      <EnquirySection />

      {/* 10. FAQ Preview linked to full /faq route */}
      <FaqPreview />

      {/* 11. Final Conversion Call to Action */}
      <FinalCta />
    </>
  );
}
