import {
  HeroContent,
  MarqueeItem,
  CourseGroup,
  FacultyMember,
  TeachingPillar,
  AcademyCenterInfo,
  FeatureHighlight,
} from "@/types";

export const heroContent: HeroContent = {
  eyebrow: "📍 Park Circus, Kolkata • ICSE, CBSE & West Bengal Board • Class V–XII",
  headline: "Clear the concept. Then decode the question.",
  subheadline: "Focused board coaching and subject mastery under Azhar Sir.",
  description:
    "At ArousH Academy, every chapter is opened up first — understanding why the logic holds — before dissecting question papers. Learn from dedicated subject specialists with dual-faculty mathematics, monthly mock test tracking, and focused doubt resolution at our Park Circus center.",
  primaryCta: {
    label: "Inquire for Admissions",
    href: "#enquiry",
  },
  secondaryCta: {
    label: "Explore Courses",
    href: "#courses",
  },
  image: {
    src: "/images/classroom_hero.jpg",
    alt: "Interactive classroom lecture at ArousH Academy",
    fallbackLabel: "ArousH Academy • Interactive Classroom Session",
  },
  floatingBadges: [
    {
      id: "badge-mock",
      text: "Monthly Mock Tests",
      subtext: "Board pattern & analysis",
      icon: "📝",
    },
    {
      id: "badge-maths",
      text: "Maths 3 Days / Week",
      subtext: "Shared by two teachers",
      icon: "📐",
    },
    {
      id: "badge-faculty",
      text: "Subject Specialists",
      subtext: "Separate teacher for each paper",
      icon: "🎓",
    },
  ],
  trustStats: [
    {
      id: "stat-classes",
      value: "Class V–XII",
      label: "Academic Span",
      sublabel: "Foundation to higher secondary",
    },
    {
      id: "stat-boards",
      value: "3 Boards",
      label: "Curriculum Rigor",
      sublabel: "ICSE, CBSE & WB Board",
    },
    {
      id: "stat-maths",
      value: "Dual Faculty",
      label: "Mathematics Focus",
      sublabel: "Two teachers for deep clarity",
    },
    {
      id: "stat-center",
      value: "Park Circus",
      label: "Campus Location",
      sublabel: "1/1 Samsul Huda Road, Kolkata",
    },
  ],
};

export const marqueeItems: MarqueeItem[] = [
  { id: "m-1", text: "Classes V–XII", tag: "Span", highlight: true },
  { id: "m-2", text: "ICSE, CBSE & West Bengal Board", tag: "Curricula" },
  { id: "m-3", text: "Clear the concept, then decode the question", tag: "Method", highlight: true },
  { id: "m-4", text: "Monthly Mock Tests", tag: "Testing" },
  { id: "m-5", text: "Subject-Wise Faculty Specialists", tag: "Teachers" },
  { id: "m-6", text: "Maths 3 Days a Week (Dual Faculty)", tag: "Rigor", highlight: true },
  { id: "m-7", text: "Doubt-Clearing & Revision Classes", tag: "Support" },
  { id: "m-8", text: "Transparent Records & Monthly Progress", tag: "Support" },
  { id: "m-9", text: "Park Circus, Kolkata (Near Quest Mall)", tag: "Campus" },
];

export const academyCenterInfo: AcademyCenterInfo = {
  centerName: "ArousH Academy (Azhar Sir)",
  founder: "Azhar Sir",
  address: "1/1, Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017",
  landmark: "Within short walking distance of Quest Mall, Park Circus",
  phones: ["098830 05641", "82408 16226"],
  emails: ["aroushacademyazharsir@gmail.com"],
  hoursSummary: [
    { days: "Monday", time: "2:00 pm – 8:00 pm" },
    { days: "Tuesday – Wednesday", time: "4:00 pm – 8:00 pm" },
    { days: "Thursday", time: "4:00 pm – 8:30 pm" },
    { days: "Friday", time: "4:00 pm – 8:00 pm" },
    { days: "Saturday", time: "9:30 am – 3:00 pm" },
    { days: "Sunday", time: "9:00 am – 5:00 pm" },
  ],
};

export const teachingPillars: TeachingPillar[] = [
  {
    id: "p-concept",
    title: "Concept Before Question",
    summary:
      "A chapter is opened up first — why the logic holds and how formulas originate. Only after deep conceptual absorption is the question paper taken apart.",
    tag: "Core Philosophy",
  },
  {
    id: "p-specialists",
    title: "Separate Teacher for Each Subject",
    summary:
      "No single teacher carries the whole syllabus. Science, Accounts, Economics, Mathematics, and Languages are handled by dedicated subject specialists.",
    tag: "Faculty Structure",
  },
  {
    id: "p-dual-maths",
    title: "Maths 3 Days a Week (Dual Teachers)",
    summary:
      "Maths gets dedicated weekly slots shared between two faculty members, ensuring challenging concepts are explained from multiple pedagogical angles.",
    tag: "Dual Explanations",
  },
  {
    id: "p-mock-tests",
    title: "Monthly Mock Tests & Revision",
    summary:
      "Full monthly examinations identify weak areas while there is ample time to adjust. Finished chapters are actively revised rather than left behind.",
    tag: "Continuous Assessment",
  },
  {
    id: "p-doubt-classes",
    title: "Dedicated Doubt-Clearing Sessions",
    summary:
      "Time is reserved specifically for student questions so unresolved points from earlier lessons never accumulate into exam anxiety.",
    tag: "Personal Attention",
  },
  {
    id: "p-three-boards",
    title: "Three Boards, One Cohesive Center",
    summary:
      "ICSE, CBSE, and West Bengal Board learners sit in the same center, with every syllabus followed strictly according to its official curriculum guidelines.",
    tag: "Multi-Board Rigor",
  },
];

export const courseGroups: CourseGroup[] = [
  {
    id: "course-v-viii",
    classes: "Class V – VIII",
    badge: "Foundation Years",
    focusTitle: "Fundamental Concepts in Science & Maths",
    description:
      "The entire school syllabus, subject by subject. Shaky fundamentals in middle school quietly turn into board exam struggles later, so these years emphasize conceptual grounding and problem-solving habits.",
    subjects: ["Mathematics", "General Science", "English Language & Lit", "Social Sciences"],
    scheduleNote: "Regular weekday batches with chapter-wise review worksheets",
  },
  {
    id: "course-ix-x",
    classes: "Class IX – X",
    badge: "Board Intensive",
    focusTitle: "ICSE, CBSE & WB Board Examination Prep",
    description:
      "Comprehensive board syllabus coverage with scheduled monthly mock tests, past paper dissection, and structured revision rounds built into routine classes so the final months remain calm.",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Vernacular"],
    scheduleNote: "Mock test once a month + sectional board question series",
  },
  {
    id: "course-xi-xii-commerce",
    classes: "Class XI – XII",
    badge: "Commerce & Science",
    focusTitle: "Higher Secondary Commerce & Science Papers",
    description:
      "Specialized faculty for Accounts, Economics, Mathematics, and Computer Science. Focuses on numerical clarity, ledger accuracy, conceptual theorems, and analytical problem decoding.",
    subjects: ["Accountancy", "Economics", "Mathematics", "Computer Science"],
    scheduleNote: "Maths 3 days/week with dual teachers + numerical test series",
  },
  {
    id: "course-xi-xii-arts",
    classes: "Class XI – XII",
    badge: "Humanities / Arts",
    focusTitle: "Higher Secondary Arts Papers",
    description:
      "Targeted guidance in humanities and languages alongside the commerce and science streams. Emphasizes structured long-answer writing, historical context, and syllabus completeness.",
    subjects: ["History", "Political Science", "Geography", "English & Languages"],
    scheduleNote: "Weekend and evening batches with essay structuring clinics",
  },
];

export const facultyMembers: FacultyMember[] = [
  {
    id: "fac-azhar",
    name: "Azhar Sir",
    role: "Founder & Academic Director",
    subjects: "Mathematics & Academic Strategy",
    bio: "Head instructor and founder of ArousH Academy at Samsul Huda Road, Park Circus. Renowned for conceptual clarity, patience with difficult chapters, and systematic question breakdown.",
    tag: "Leadership",
    avatarText: "AS",
  },
  {
    id: "fac-maths2",
    name: "Mathematics Senior Faculty",
    role: "Co-Instructor (Dual Faculty System)",
    subjects: "Advanced Mathematics & Geometry",
    bio: "Shares Class XI & XII mathematics modules with Azhar Sir, offering alternative conceptual perspectives so every student grasps multiple solution paths.",
    tag: "Dual Faculty",
    avatarText: "MF",
  },
  {
    id: "fac-accounts",
    name: "Commerce & Accounts Faculty",
    role: "Senior Commerce Specialist",
    subjects: "Accountancy & Business Economics",
    bio: "Handles balance sheet analysis, ledger principles, and micro/macro economics for higher secondary board candidates with rigorous sectional practice.",
    tag: "Commerce",
    avatarText: "AC",
  },
  {
    id: "fac-science",
    name: "Science & Board Faculty",
    role: "Department Lead — Physical & Life Sciences",
    subjects: "Physics, Chemistry & Biology",
    bio: "Directs laboratory diagram analysis, formula derivation, and monthly science mock papers for Class IX–X board aspirants across ICSE, CBSE, and WB Board.",
    tag: "Sciences",
    avatarText: "SC",
  },
];

export const platformFeatures: FeatureHighlight[] = [
  {
    id: "feat-boards",
    title: "Rigorous Multi-Board Preparation",
    description: "Separate batches strictly mapped to ICSE, CBSE, and West Bengal Board curriculum standards, marking rubrics, and examination patterns.",
    category: "Academic Focus",
    tag: "ICSE • CBSE • WB",
  },
  {
    id: "feat-faculty",
    title: "Dedicated Subject Specialists",
    description: "No single teacher carries the entire syllabus. Sciences, Accounts, Economics, Mathematics, and Languages are led by individual subject specialists.",
    category: "Faculty Structure",
    tag: "Specialists",
  },
  {
    id: "feat-maths",
    title: "Dual-Faculty Mathematics Routine",
    description: "Mathematics classes run three days a week with modules shared between two instructors, providing multiple pedagogical approaches to complex problem solving.",
    category: "Core Rigor",
    tag: "3 Days / Week",
  },
  {
    id: "feat-tests",
    title: "Scheduled Monthly Mock Tests",
    description: "Full monthly examinations designed around board question papers identify conceptual gaps early with ample time to correct them.",
    category: "Assessments",
    tag: "Board Pattern",
  },
  {
    id: "feat-doubts",
    title: "Dedicated In-Person Doubt Clearing",
    description: "Structured doubt-clearing sessions guarantee that unresolved questions from earlier lectures never accumulate into exam anxiety.",
    category: "Student Support",
    tag: "Personal Attention",
  },
  {
    id: "feat-transparency",
    title: "Parent Transparency & Attendance Logs",
    description: "Transparent attendance records, test score updates, and monthly fee receipts keep parents consistently informed of their ward's academic standing.",
    category: "Communication",
    tag: "Guardian Updates",
  },
];
