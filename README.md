# ArousH Academy — Digital Academy Platform

> **Task 03: Homepage Redesign & Content-Driven Brand Architecture**  
> Apple-inspired, premium B2B SaaS digital academy platform engineered from scratch.  
> Identity reference: [ArousH Academy (Azhar Sir), Park Circus, Kolkata](https://aroushacademy.in/)

---

## 1. Project Overview & Architecture

ArousH Academy unifies the physical learning center at **1/1 Samsul Huda Road, Park Circus, Kolkata** with an Apple-grade B2B SaaS operating system.

This release represents **Task 03: Homepage Redesign**:
- Rich split hero highlighting the teaching philosophy: *"Clear the concept. Then decode the question."*
- Local, bundled classroom photographic asset ([`/images/classroom_hero.jpg`](file:///c:/Users/mddan/Desktop/Aroush-Academy/public/images/classroom_hero.jpg)) with responsive aspect ratio and image fallback.
- Continuous horizontal text marquee of curricula, boards, and testing rigor with `prefers-reduced-motion` support.
- Centralized typed content architecture in [`src/data/homepageContent.ts`](file:///c:/Users/mddan/Desktop/Aroush-Academy/src/data/homepageContent.ts) ready for future Admin Portal CMS integration without frontend rewrites.
- Reusable sections: Inside ArousH Academy (`#academy`), Class V–XII Courses (`#courses`), Core Platform Capabilities (`#features`), Faculty Showcase (`#faculty`), Role Portals (`#roles`), How It Works (`#how-it-works`), Sample Pricing (`#pricing`), Admissions & Campus Inquiries (`#enquiry`), FAQ Preview (`/faq`), and Final Conversion CTA.

### Directory Structure

```text
Aroush-Academy/
├── public/
│   └── images/
│       └── classroom_hero.jpg       # Bundled classroom photographic asset
├── src/
│   ├── app/
│   │   ├── globals.css              # Centralized CSS variables, typography, marquee & reduced-motion
│   │   ├── layout.tsx               # Root layout (Header, Footer, CookieConsent)
│   │   ├── page.tsx                 # Redesigned content-driven homepage
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Multi-role SaaS portal shell preview
│   │   ├── faq/
│   │   │   └── page.tsx             # Categorized FAQ (Native details/summary)
│   │   ├── login/
│   │   │   └── page.tsx             # Authentication Gateway readiness page
│   │   └── privacy/
│   │       └── page.tsx             # Privacy Policy framework with review markers
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx           # Redesigned navbar with wordmark, logo placeholder & navigation
│   │   │   ├── Footer.tsx           # Site footer with contact details & cookie preferences trigger
│   │   │   └── CookieConsent.tsx    # Accessible cookie consent banner & preferences modal
│   │   ├── dashboard/
│   │   │   ├── DashboardShell.tsx   # Responsive multi-role dashboard preview shell
│   │   │   └── MetricCard.tsx       # KPI / metric display card
│   │   ├── landing/
│   │   │   ├── Hero.tsx             # Split hero with classroom visual & floating badges
│   │   │   ├── Marquee.tsx          # Continuous rotating text marquee
│   │   │   ├── AcademyIntro.tsx     # Physical campus details & 6 teaching pillars
│   │   │   ├── Courses.tsx          # Class V–XII curriculum streams & subjects
│   │   │   ├── Features.tsx         # 6 core platform & hybrid capabilities
│   │   │   ├── Faculty.tsx          # Subject specialists showcase (dual-teacher maths)
│   │   │   ├── RolesOverview.tsx    # 5 stakeholder workspaces with direct preview links
│   │   │   ├── HowItWorks.tsx       # 4-step academy onboarding journey
│   │   │   ├── Pricing.tsx          # Sample pricing plans with explicit illustrative disclaimers
│   │   │   ├── EnquirySection.tsx   # Direct Park Circus campus contact & admission form
│   │   │   ├── FaqPreview.tsx       # Curated top FAQ accordion linking to /faq
│   │   │   └── FinalCta.tsx         # Apple-styled high-contrast conversion section
│   │   └── ui/
│   │       ├── Badge.tsx            # Pill badge component
│   │       ├── Button.tsx           # Reusable button with variants & accessibility
│   │       └── Card.tsx             # Refined Apple surface card
│   ├── data/
│   │   └── homepageContent.ts       # Typed, centralized demo content ready for Admin CMS
│   ├── styles/
│   │   └── tokens.ts                # TypeScript design tokens (colors, type, spacing, radii)
│   └── types/
│       └── index.ts                 # Domain interfaces & content schema
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. Brand & Design Tokens

Exact brand colors implemented in CSS custom properties and TypeScript tokens:

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| **Background / Surface** | `#F5F5F7` / `#FFFFFF` | Page canvas, cards, and modal backdrops |
| **Primary Dark** | `#1D1D1F` | Main typography, primary buttons, high-contrast marks |
| **Neutral Grey** | `#AAAAAA` | Subtle borders, disabled states, quiet dividers |
| **Neutral Secondary** | `#6E6E73` | Accessible secondary typography (WCAG AA compliant) |
| **Accent Blue** | `#007AFF` | Primary interactive elements, links, focus rings, badges |

---

## 3. Getting Started

### Prerequisites

- Node.js v20+ (tested on Node v24.19.0)
- npm v10+ (tested on npm 11.17.0)

### Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Verification Commands

Run the full verification suite:

```bash
# 1. Typecheck with TypeScript
npm run typecheck

# 2. Linting with ESLint
npm run lint

# 3. Production Build with Next.js Turbopack
npm run build
```

---

## 5. Next Recommended Step

- **Task 04:** Authentication & Role Gateway (Implement dedicated, accessible Login and Registration interfaces supporting credentials validation, role selector tabs, magic link readiness, and session protection—maintaining the strict frontend-first rule).
