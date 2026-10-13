import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('--- Verifying Production-Ready Academy Homepage ---');

const pageFile = path.resolve('src/app/page.tsx');
const pageContent = fs.readFileSync(pageFile, 'utf8');

const headerFile = path.resolve('src/components/common/Header.tsx');
const headerContent = fs.readFileSync(headerFile, 'utf8');

const footerFile = path.resolve('src/components/common/Footer.tsx');
const footerContent = fs.readFileSync(footerFile, 'utf8');


const featuresFile = path.resolve('src/components/landing/Features.tsx');
const featuresContent = fs.readFileSync(featuresFile, 'utf8');

const howItWorksFile = path.resolve('src/components/landing/HowItWorks.tsx');
const howItWorksContent = fs.readFileSync(howItWorksFile, 'utf8');

const rolesFile = path.resolve('src/components/landing/RolesOverview.tsx');
const rolesContent = fs.readFileSync(rolesFile, 'utf8');

const enquiryFile = path.resolve('src/components/landing/EnquirySection.tsx');
const enquiryContent = fs.readFileSync(enquiryFile, 'utf8');

const faqPreviewFile = path.resolve('src/components/landing/FaqPreview.tsx');
const faqPreviewContent = fs.readFileSync(faqPreviewFile, 'utf8');

const finalCtaFile = path.resolve('src/components/landing/FinalCta.tsx');
const finalCtaContent = fs.readFileSync(finalCtaFile, 'utf8');

const dataFile = path.resolve('src/data/homepageContent.ts');
const dataContent = fs.readFileSync(dataFile, 'utf8');

const faqPageFile = path.resolve('src/app/faq/page.tsx');
const faqPageContent = fs.readFileSync(faqPageFile, 'utf8');

// 1. Verify absence of SaaS prototype copy on homepage and shared components
const prohibitedPatterns = [
  { file: 'page.tsx', content: pageContent, pattern: /ROADMAP_ITEMS/, desc: 'Development roadmap items' },
  { file: 'page.tsx', content: pageContent, pattern: /Pricing/, desc: 'SaaS Pricing component import/render' },
  { file: 'page.tsx', content: pageContent, pattern: /Disciplined SaaS Delivery Roadmap/, desc: 'SaaS delivery roadmap title' },
  { file: 'Header.tsx', content: headerContent, pattern: /SaaS OS/, desc: 'SaaS OS badge in Header' },
  { file: 'Header.tsx', content: headerContent, pattern: /#pricing/, desc: 'Pricing link in Header' },
  { file: 'Footer.tsx', content: footerContent, pattern: /B2B SaaS/, desc: 'B2B SaaS wording in Footer' },
  { file: 'Footer.tsx', content: footerContent, pattern: /inquiries@aroush\.academy/, desc: 'Placeholder email in Footer' },
  { file: 'Footer.tsx', content: footerContent, pattern: /Task 03 Redesigned/, desc: 'Task 03 task label in Footer' },
  { file: 'Footer.tsx', content: footerContent, pattern: /#pricing/, desc: 'Pricing link in Footer' },
  { file: 'homepageContent.ts', content: dataContent, pattern: /4\.9 ★/, desc: 'Fake rating metric in Hero stats' },
  { file: 'homepageContent.ts', content: dataContent, pattern: /B2B SaaS/, desc: 'B2B SaaS phrasing in homepage data' },
  { file: 'HowItWorks.tsx', content: howItWorksContent, pattern: /Campus Provisioning/, desc: 'SaaS campus tenancy onboarding' },
  { file: 'FinalCta.tsx', content: finalCtaContent, pattern: /Ready to unify your academy's digital infrastructure/, desc: 'SaaS software pitch in final CTA' },
  { file: 'FinalCta.tsx', content: finalCtaContent, pattern: /#pricing/, desc: 'Sample pricing link in Final CTA' },
  { file: 'faq/page.tsx', content: faqPageContent, pattern: /FAQ Review Notice/, desc: 'Developer review notice in FAQ page' },
];

for (const { file, content, pattern, desc } of prohibitedPatterns) {
  assert(!pattern.test(content), `Found prohibited pattern (${desc}) in ${file}`);
  console.log(`[PASS] Prohibited check: ${file} does not contain ${desc}`);
}

// 2. Verify authentic academy elements
assert(headerContent.includes('Admission Enquiry'), 'Header must have Admission Enquiry CTA');
assert(headerContent.includes('/#about'), 'Header must link to /#about');
assert(headerContent.includes('/#enquiry'), 'Header must link to /#enquiry');

assert(dataContent.includes('Class V–XII'), 'Hero content must mention Classes V-XII');
assert(dataContent.includes('Park Circus'), 'Hero content must mention Park Circus');

assert(featuresContent.includes('Why Choose AROUSH Academy'), 'Features must be Why Choose AROUSH Academy');

assert(howItWorksContent.includes('How students learn and succeed'), 'HowItWorks must reflect student learning journey');

assert(rolesContent.includes('Portal Access') || rolesContent.includes('portal'), 'RolesOverview must present portal access');
assert(rolesContent.includes('/login'), 'Portal cards must link to /login');

assert(enquiryContent.includes('Inquiry Details Recorded'), 'Enquiry must have truthful confirmation feedback');
assert(enquiryContent.includes('098830 05641'), 'Enquiry must include verified phone number 098830 05641');
assert(enquiryContent.includes('academyCenterInfo.emails') || enquiryContent.includes('aroushacademyazharsir@gmail.com'), 'Enquiry must include verified email');

assert(finalCtaContent.includes('Inquire for Admissions'), 'Final CTA must have Inquire for Admissions button');
assert(finalCtaContent.includes('098830 05641'), 'Final CTA must provide Azhar Sir phone number');

assert(footerContent.includes('098830 05641'), 'Footer must have verified phone number 098830 05641');
assert(footerContent.includes('aroushacademyazharsir@gmail.com'), 'Footer must have verified email');

assert(faqPreviewContent.includes('Which classes and boards are taught'), 'FAQ preview must have real academy question');
assert(faqPreviewContent.includes('dual-faculty mathematics'), 'FAQ preview must explain dual-faculty maths');

console.log('\n--- All Production Homepage Checks PASSED Successfully! ---');
