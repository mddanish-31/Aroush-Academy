import type { CmsContent } from "@/lib/cms/content";
import { Hero } from "./Hero";
import { WhatWeTeach } from "./WhatWeTeach";
import { AcademyIntro } from "./AcademyIntro";
import { Courses } from "./Courses";
import { Features } from "./Features";
import { Faculty } from "./Faculty";
import { HowItWorks } from "./HowItWorks";
import { EnquirySection } from "./EnquirySection";
import { FaqPreview } from "./FaqPreview";
import { Pricing } from "./Pricing";
import { FinalCta } from "./FinalCta";

export function WebsiteSections({ content }: { content: CmsContent }) {
  const { site, hero, landing, media } = content;
  return <>
    <Hero hero={hero} landing={landing} />
    <WhatWeTeach landing={landing} />
    <AcademyIntro landing={landing} media={media} />
    <Courses landing={landing} media={media} />
    <Features landing={landing} />
    <Faculty landing={landing} />
    <HowItWorks landing={landing} />
    <EnquirySection siteSettings={site} />
    <FaqPreview landing={landing} />
    {site.featureFlags.showPricing && <Pricing />}
    <FinalCta />
  </>;
}
