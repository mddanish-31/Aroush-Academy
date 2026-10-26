# Phase 1: Public Site Audit

Audit Date: 2026-10-26
Branch: frontend-redesign
Scope: `src/app/page.tsx`, `src/components/landing`, `src/components/common`, `src/content`, `src/app/{faq,privacy,terms,layout,sitemap,robots}`

## Step 1: Text Claims Inventory & Fact Verification

All text claims extracted directly from source files:

| Claim Category | Text Claim | Providing File & Line | Verification Status | Notes / Action |
| :--- | :--- | :--- | :--- | :--- |
| **Contact / Phone** | `098830 05641` (Primary) | `src/content/site.ts:7`, `src/app/layout.tsx:87` | Needs owner confirmation | Must confirm active contact number for admissions |
| **Contact / Phone** | `82408 16226` (Secondary) | `src/content/site.ts:8`, `src/content/landing.ts:266` | Needs owner confirmation | Secondary phone number quoted in FAQ |
| **Contact / Email** | `aroushacademyazharsir@gmail.com` | `src/content/site.ts:9`, `src/app/layout.tsx:88` | Needs owner confirmation | Administrative contact email |
| **Campus Address** | `1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata 700017` | `src/content/site.ts:6`, `src/app/layout.tsx:91` | Needs owner confirmation | Physical center address near Quest Mall |
| **Class Ranges** | Class V-VIII, Class IX-X, Class XI-XII | `src/content/landing.ts:51,67,85` | Needs owner confirmation | Range V to XII offered across ICSE, CBSE, WB Board |
| **Boards** | ICSE, CBSE & West Bengal Board | `src/content/landing.ts:55,71,89` | Needs owner confirmation | Multi-board cohorts |
| **Verified Subjects** | Class IX-X: Mathematics, Physics, Chemistry<br>Class XI-XII: Accountancy, Economics, Mathematics | `src/content/landing.ts:73-75,91-93` | Needs owner confirmation | Marked `verified: true` in landing data |
| **Unverified Subjects** | Class V-VIII: All subjects (Maths, Science, English, Social Sciences)<br>Class IX-X: Biology, English, Vernacular<br>Class XI-XII: Computer Science, Humanities | `src/content/landing.ts:57-60,76-78,94-95` | Needs owner confirmation | Marked `verified: false` in data source |
| **Faculty: Founder** | Azhar Sir (Founder & Academic Director, Mathematics) | `src/content/landing.ts:147-153` | Needs owner confirmation | Named instructor |
| **Faculty: Co-Teacher** | "Senior Mathematics Faculty" (unnamed placeholder) | `src/content/landing.ts:155-161` | Needs owner confirmation | Generic title used in place of actual faculty name |
| **Faculty: Commerce** | "Commerce & Accounts Faculty" (unnamed placeholder) | `src/content/landing.ts:163-169` | Needs owner confirmation | Generic title used in place of actual faculty name |
| **Faculty: Science** | "Science & Board Faculty" (unnamed placeholder) | `src/content/landing.ts:171-177` | Needs owner confirmation | Generic title used in place of actual faculty name |
| **Pedagogy** | "Maths 3 Days a Week (Dual Teachers)" | `src/content/landing.ts:22` | Needs owner confirmation | Core instructional routine |
| **Ratings / Reviews** | None displayed (`showSampleReviews: false`) | `src/content/site.ts:12` | Static only | Reviews disabled by feature flag |

## Step 2: Accessibility & Semantic Structure Audit

Automated evaluation on `http://localhost:3000/` using Playwright and AxeBuilder:

- **Landmarks**: Exactly 1 `<header>`, 1 `<nav>`, 1 `<main id="main-content">`, 1 `<footer>`.
- **Skip Link**: `<a href="#main-content" className="skip-to-content">Skip to content</a>` present in `src/app/layout.tsx:118`, correctly targeting `<main id="main-content">`.
- **Heading Order**: Strictly hierarchical `h1` (1) -> `h2` (9) -> `h3` (22). No skipped heading levels.
- **Alt Text**: All 13 images have descriptive, non-empty alt text and honest stock attribution (`src/content/media.ts`).
- **Axe-core Violations**: 0 violations detected (0 serious, 0 critical, 0 moderate, 0 minor).

## Step 3: Viewport & Layout Integrity (390px, 768px, 1440px)

Evaluated on local dev server at port 3000:

| Viewport Width | scrollWidth | clientWidth | Horizontal Scroll | Screenshots Saved |
| :--- | :--- | :--- | :--- | :--- |
| **390px** (Mobile) | 390px | 390px | None (`hasHorizontalScroll: false`) | `qa-output/audit/public-390.png` |
| **768px** (Tablet) | 768px | 768px | None (`hasHorizontalScroll: false`) | `qa-output/audit/public-768.png` |
| **1440px** (Desktop) | 1440px | 1440px | None (`hasHorizontalScroll: false`) | `qa-output/audit/public-1440.png` |

- Text clipping or overlap: None observed.
- Hero background grid alignment: Clean top alignment at 390px (538px) and 1440px (543px).

## Step 4: Internal Links & Anchor Resolution

Evaluated using Playwright DOM link verification:

- All 19 internal page routes (`/`, `/faq`, `/login?role=...`, `/register?role=...`, `/privacy`, `/terms`) returned HTTP 200.
- **Anchor failures detected**:
  - `/#campus` -> Target `id="campus"` missing from DOM.
  - `/#visit` -> Target `id="visit"` missing from DOM.
  - `/#courses-v-viii` -> Target `id="courses-v-viii"` missing from DOM (actual DOM ID is `course-v-viii`).
  - `/#courses-ix-x` -> Target `id="courses-ix-x"` missing from DOM (actual DOM ID is `course-ix-x`).
  - `/#courses-xi-xii` -> Target `id="courses-xi-xii"` missing from DOM (actual DOM ID is `course-xi-xii`).

## Step 5: SEO & Metadata Audit

Evaluated against live routes:

| Route | Title Tag | Canonical URL | OpenGraph Title / Image | JSON-LD Schemas |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `ArousH Academy - Coaching for ICSE, CBSE & WB Board \| Park Circus, Kolkata` | `http://localhost:3000` | Present (`media-og-cover`) | `EducationalOrganization` (Valid) |
| `/faq` | `Frequently Asked Questions \| ArousH Academy` | `http://localhost:3000/faq` | Present (`media-og-cover`) | `EducationalOrganization`, `FAQPage` (Valid) |
| `/privacy` | `Privacy Policy \| ArousH Academy` | `http://localhost:3000/privacy` | Present (`media-og-cover`) | `EducationalOrganization` (Valid) |
| `/terms` | `Terms of Use and Conditions \| ArousH Academy` | `http://localhost:3000/terms` | Present (`media-og-cover`) | `EducationalOrganization` (Valid) |
| `/robots.txt` | HTTP 200 | N/A | N/A | Disallows `/dashboard`, `/login`, `/register`, `/api` |
| `/sitemap.xml`| HTTP 200 | N/A | N/A | Lists 4 canonical URLs with lastmod & priority |

## Step 6: Performance & Asset Delivery

- **Font Loading**: `Fraunces` and `Manrope` loaded via `next/font/google` (`src/app/layout.tsx:11-22`) with `display: "swap"` and zero external Google CDN requests.
- **Image Optimization**: Unsplash media items delivered with responsive `sizes` attribute, WebP/AVIF format parameter (`auto=format&fit=crop`), and lazy loading via `next/image`.
- **Bundle Footprint**: Landing page is fully static (○ prerendered) with minimal client script overhead.

## Step 7: Style Rule Verification (Rule 7 & Rule 12)

Commands and exact counts in Phase 1 scope:

| Style Rule | Grep Command Executed | Count | Status |
| :--- | :--- | :--- | :--- |
| **No em dash or en dash** | `grep -rn "—\\|–" src/app/page.tsx src/components/landing/ src/components/common/ src/content/ src/app/faq/ src/app/privacy/ src/app/terms/ src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts` | 0 | PASS |
| **No emojis** | Node unicode regex scan `/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u` across Phase 1 scope | 0 | PASS |
| **No code comments** | `grep -rn "// " src/app/page.tsx src/components/landing/ src/components/common/ src/content/ src/app/faq/ src/app/privacy/ src/app/terms/ src/app/layout.tsx src/app/robots.ts src/app/sitemap.ts` | 0 | PASS |
| **No capsule/pill tags in landing** | `grep -rn "<Badge" src/components/landing/ src/app/page.tsx` | 0 | PASS |
| **Lucide-react icons only** | `grep -rn "from [\"'].*icons" src/` | 0 | PASS |
| **#007AFF never as small text** | Grep scan for `#007AFF` / `var(--color-accent)` text styling | 0 text uses (icons only) | PASS |
| **Typography locked** | `Fraunces` and `Manrope` via CSS variables `--font-fraunces`, `--font-manrope` | Enforced | PASS |

## Phase 1 Findings

- **P1-001** | high | `src/content/site.ts:45,57,63,69,111` | Header dropdown and footer links point to broken or mismatched anchor IDs (`/#campus`, `/#visit`, `/#courses-v-viii`, `/#courses-ix-x`, `/#courses-xi-xii`). | Evidence: Playwright anchor resolution test found `exists: false` for all 5 targets because course cards use singular `course-*` IDs and campus/visit lack IDs. | Align anchor hrefs to singular IDs (`/#course-v-viii`, `/#course-ix-x`, `/#course-xi-xii`) and add `id="campus"` to AcademyIntro and `id="visit"` to EnquirySection.
- **P1-002** | medium | `src/content/landing.ts:155-177` | Three faculty cards display generic placeholder titles ("Senior Mathematics Faculty", "Commerce & Accounts Faculty", "Science & Board Faculty") instead of actual instructor names. | Evidence: Lines 156, 164, 172 in `src/content/landing.ts` use role placeholders. | Replace placeholders with confirmed instructor names or indicate pending faculty announcement.
- **P1-003** | medium | `src/components/common/Header.tsx:1-1134` | Header component is 1,134 lines long, exceeding the project small files threshold. | Evidence: `wc -l src/components/common/Header.tsx` returned `1134`. | Decompose Header into `HeaderNav`, `MobileDrawer`, and `AuthTriggerDropdown` subcomponents.
- **P1-004** | low | `src/components/landing/EnquirySection.tsx:1-530` | EnquirySection is 530 lines long, exceeding the 500-line modular threshold. | Evidence: `wc -l src/components/landing/EnquirySection.tsx` returned `530`. | Refactor the enquiry form logic and contact details panel into smaller subcomponents.
- **P1-005** | low | `src/content/landing.ts:57-61,76-78,94-96` | 11 subject entries across middle school, secondary, and higher secondary are flagged `verified: false`. | Evidence: `verified: false` flags in `src/content/landing.ts`. | Obtain owner confirmation for unverified subjects before listing them in marketing content.

## Not Checked (Phase 1)

1. External social media URL resolution (`facebook.com`, `youtube.com`, `instagram.com` links in `site.ts` were not tested against external networks per Rule 14).
2. Live delivery on production custom domain (`https://aroush.in` DNS and SSL certificate).
3. Real-time form submission to an external CRM or email server (admissions form is purely client-handled).

