import type { SiteSettings } from "./types";

export const siteSettings: SiteSettings = {
  siteName: "ArousH Academy",
  tagline: "Clear the concept. Then decode the question.",
  address: "1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017",
  phone: "098830 05641",
  phoneSecondary: "82408 16226",
  email: "aroushacademyazharsir@gmail.com",
  featureFlags: {
    showPricing: false,
    showSampleReviews: false,
  },
  socialLinks: [
    {
      platform: "Facebook",
      url: "https://facebook.com",
      label: "Follow ArousH Academy on Facebook",
    },
    {
      platform: "YouTube",
      url: "https://youtube.com",
      label: "Watch educational tutorials on YouTube",
    },
    {
      platform: "Instagram",
      url: "https://instagram.com",
      label: "Follow updates on Instagram",
    },
  ],
  navGroups: [
    {
      id: "about",
      title: "About",
      items: [
        {
          title: "Our story",
          description: "Our foundation, core ethos, and teaching heritage under Azhar Sir.",
          href: "/#about",
          icon: "BookOpen",
        },
        {
          title: "Campus",
          description: "In-person learning center at Park Circus near Quest Mall.",
          href: "/#campus",
          icon: "Building2",
        },
      ],
    },
    {
      id: "programs",
      title: "Programs",
      items: [
        {
          title: "Class V-VIII",
          description: "Middle school conceptual foundations in Science and Mathematics.",
          href: "/#course-v-viii",
          icon: "GraduationCap",
        },
        {
          title: "Class IX-X",
          description: "Intensive board examination prep for ICSE, CBSE, and WB Board.",
          href: "/#course-ix-x",
          icon: "Award",
        },
        {
          title: "Class XI-XII",
          description: "Higher secondary Commerce, Science, and Arts stream coaching.",
          href: "/#course-xi-xii",
          icon: "BookMarked",
        },
      ],
    },
    {
      id: "why-aroush",
      title: "Why ArousH",
      items: [
        {
          title: "Method",
          description: "Mastering core chapter concepts before tackling question papers.",
          href: "/#method",
          icon: "Compass",
        },
        {
          title: "Monthly mock tests",
          description: "Scheduled board-pattern evaluation with thorough feedback.",
          href: "/#mock-tests",
          icon: "CheckCircle2",
        },
        {
          title: "Faculty",
          description: "Dedicated subject specialists with dual-faculty Mathematics.",
          href: "/#faculty",
          icon: "Users",
        },
      ],
    },
    {
      id: "admissions",
      title: "Admissions",
      items: [
        {
          title: "Enquire",
          description: "Submit an admission enquiry for upcoming academic sessions.",
          href: "/#enquiry",
          icon: "Send",
        },
        {
          title: "Visit campus",
          description: "Counseling sessions and center visits at Samsul Huda Road.",
          href: "/#visit",
          icon: "MapPin",
        },
        {
          title: "FAQ",
          description: "Answers to common questions about admissions, fees, and batches.",
          href: "/faq",
          icon: "HelpCircle",
        },
      ],
    },
  ],
};
