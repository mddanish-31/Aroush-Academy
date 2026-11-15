import type { LandingContent } from "./types";

export const landingContent: LandingContent = {
  pillars: [
    {
      id: "p-concept",
      number: "01",
      title: "Concept Before Question",
      summary:
        "A chapter is opened up first - why the logic holds and how formulas originate. Only after deep conceptual absorption is the question paper taken apart.",
    },
    {
      id: "p-specialists",
      number: "02",
      title: "Separate Teacher for Each Subject",
      summary:
        "No single teacher carries the whole syllabus. Science, Accounts, Economics, Mathematics, and Languages are handled by dedicated subject specialists.",
    },
    {
      id: "p-dual-maths",
      number: "03",
      title: "Maths 3 Days a Week (Dual Teachers)",
      summary:
        "Maths gets dedicated weekly slots shared between two faculty members, ensuring challenging concepts are explained from multiple pedagogical angles.",
    },
    {
      id: "p-mock-tests",
      number: "04",
      title: "Monthly Mock Tests and Revision",
      summary:
        "Full monthly examinations identify weak areas while there is ample time to adjust. Finished chapters are actively revised rather than left behind.",
    },
    {
      id: "p-doubt-classes",
      number: "05",
      title: "Dedicated Doubt-Clearing Sessions",
      summary:
        "Time is reserved specifically for student questions so unresolved points from earlier lessons never accumulate into exam anxiety.",
    },
    {
      id: "p-three-boards",
      number: "06",
      title: "Three Boards, One Cohesive Center",
      summary:
        "ICSE, CBSE, and West Bengal Board learners sit in the same center, with every syllabus followed strictly according to its official curriculum guidelines.",
    },
  ],
  courses: [
    {
      id: "course-v-viii",
      classes: "Class V-VIII",
      title: "Foundation Years",
      description:
        "The entire school syllabus, subject by subject. Shaky fundamentals in middle school quietly turn into board exam struggles later, so these years emphasize conceptual grounding and problem-solving habits.",
      boards: "ICSE, CBSE & West Bengal Board",
      subjects: [
        { name: "Mathematics", verified: false },
        { name: "General Science", verified: false },
        { name: "English Language & Literature", verified: false },
        { name: "Social Sciences", verified: false },
      ],
      mediaKey: "foundation",
      ctaLabel: "Enquire about Class V-VIII",
    },
    {
      id: "course-ix-x",
      classes: "Class IX-X",
      title: "Board Intensive Preparation",
      description:
        "Comprehensive board syllabus coverage with scheduled monthly mock tests, past paper dissection, and structured revision rounds built into routine classes so the final months remain calm.",
      boards: "ICSE, CBSE & West Bengal Board",
      subjects: [
        { name: "Mathematics", verified: true },
        { name: "Physics", verified: true },
        { name: "Chemistry", verified: true },
        { name: "Biology", verified: false },
        { name: "English", verified: false },
        { name: "Vernacular", verified: false },
      ],
      mediaKey: "secondaryScience",
      ctaLabel: "Enquire about Class IX-X",
    },
    {
      id: "course-xi-xii",
      classes: "Class XI-XII",
      title: "Higher Secondary Streams",
      description:
        "Specialized subject faculty for Commerce, Science, and Arts papers. Focuses on numerical clarity, ledger accuracy, conceptual theorems, and analytical long-answer decoding.",
      boards: "ICSE, CBSE & West Bengal Board",
      subjects: [
        { name: "Accountancy", verified: true },
        { name: "Economics", verified: true },
        { name: "Mathematics", verified: true },
        { name: "Computer Science", verified: false },
        { name: "Humanities Papers", verified: false },
      ],
      mediaKey: "higherSecondaryStreams",
      ctaLabel: "Enquire about Class XI-XII",
    },
  ],
  features: [
    {
      id: "feat-boards",
      title: "Rigorous Multi-Board Preparation",
      description:
        "Separate batches strictly mapped to ICSE, CBSE, and West Bengal Board curriculum standards, marking rubrics, and examination patterns.",
      icon: "BookOpen",
    },
    {
      id: "feat-faculty",
      title: "Dedicated Subject Specialists",
      description:
        "No single teacher carries the entire syllabus. Sciences, Accounts, Economics, Mathematics, and Languages are led by individual subject specialists.",
      icon: "Users",
    },
    {
      id: "feat-maths",
      title: "Dual-Faculty Mathematics Routine",
      description:
        "Mathematics classes run three days a week with modules shared between two instructors, providing multiple pedagogical approaches to complex problem solving.",
      icon: "Compass",
    },
    {
      id: "feat-tests",
      title: "Scheduled Monthly Mock Tests",
      description:
        "Full monthly examinations designed around board question papers identify conceptual gaps early with ample time to correct them.",
      icon: "CheckCircle2",
    },
    {
      id: "feat-doubts",
      title: "Dedicated In-Person Doubt Clearing",
      description:
        "Structured doubt-clearing sessions give students time to revisit questions from earlier lectures.",
      icon: "HelpCircle",
    },
    {
      id: "feat-transparency",
      title: "Parent Transparency and Attendance Logs",
      description:
        "Transparent attendance records, test score updates, and monthly fee receipts keep parents consistently informed of their ward's academic standing.",
      icon: "ClipboardCheck",
    },
  ],
  faculty: [
    {
      id: "fac-azhar",
      name: "Azhar Sir",
      role: "Founder & Academic Director",
      subjects: "Mathematics & Academic Strategy",
      bio: "Head instructor and founder of ArousH Academy at Samsul Huda Road, Park Circus. Renowned for conceptual clarity, patience with difficult chapters, and systematic question breakdown.",
      initials: "AS",
    },
    {
      id: "fac-maths2",
      name: "Senior Mathematics Faculty",
      role: "Co-Instructor (Dual Faculty System)",
      subjects: "Advanced Mathematics & Geometry",
      bio: "Shares Class XI & XII mathematics modules with Azhar Sir, offering alternative conceptual perspectives so every student grasps multiple solution paths.",
      initials: "MF",
    },
    {
      id: "fac-accounts",
      name: "Commerce & Accounts Faculty",
      role: "Senior Commerce Specialist",
      subjects: "Accountancy & Business Economics",
      bio: "Handles balance sheet analysis, ledger principles, and micro/macro economics for higher secondary board candidates with rigorous sectional practice.",
      initials: "AC",
    },
    {
      id: "fac-science",
      name: "Science & Board Faculty",
      role: "Department Lead (Physical & Life Sciences)",
      subjects: "Physics, Chemistry & Biology",
      bio: "Directs laboratory diagram analysis, formula derivation, and monthly science mock papers for Class IX-X board aspirants across ICSE, CBSE, and WB Board.",
      initials: "SC",
    },
  ],
  roles: [
    {
      id: "role-admin",
      role: "Academy Admin",
      title: "Central Administration",
      description:
        "Batch scheduling, enrollment oversight, fee collections, faculty allocation, and system-wide audit logging.",
      href: "/login",
    },
    {
      id: "role-teacher",
      role: "Teacher",
      title: "Faculty Workspace",
      description:
        "Daily attendance recording, mock exam marks entry, lesson pacers, and student performance oversight.",
      href: "/login",
    },
    {
      id: "role-student",
      role: "Student",
      title: "Student Portal",
      description:
        "Weekly routine schedules, mock test results, report cards, digital ID passes, and syllabus roadmaps.",
      href: "/login",
    },
    {
      id: "role-parent",
      role: "Parent",
      title: "Guardian Oversight",
      description:
        "Real-time attendance percentages, monthly tuition fee payment receipts, and academic scorecards for enrolled wards.",
      href: "/login",
    },
  ],
  timeline: [
    {
      number: "01",
      title: "Consultation & Assessment",
      description:
        "An in-person discussion with Azhar Sir evaluates current syllabus progress, school assessment scores, and board target areas.",
    },
    {
      number: "02",
      title: "Subject & Batch Mapping",
      description:
        "Students are placed into focused cohorts strictly partitioned by board curriculum standards: ICSE, CBSE, or West Bengal Board.",
    },
    {
      number: "03",
      title: "Conceptual Lectures & Dual Maths",
      description:
        "Rigorous formula derivation, chapter understanding from subject specialists, and dual-instructor mathematics three days a week.",
    },
    {
      number: "04",
      title: "Monthly Mock Tests & Tracking",
      description:
        "Full board-pattern mock examinations identify weak areas with detailed paper evaluations and timely revision rounds.",
    },
  ],
  faqs: [
    {
      id: "faq-1",
      category: "Curriculum & Boards",
      question: "Which classes and boards are taught at ArousH Academy?",
      answer:
        "We offer comprehensive subject coaching for Class V through XII across ICSE, CBSE, and West Bengal Board curricula. Each board syllabus is covered strictly according to its official curriculum guidelines with separate batches.",
    },
    {
      id: "faq-2",
      category: "Teaching Methodology",
      question: "How does the dual-faculty mathematics coaching work?",
      answer:
        "Mathematics classes are scheduled three days a week and shared between two instructors, led by Azhar Sir. This dual-teacher approach ensures students receive multiple pedagogical angles on challenging concepts, rigorous formula derivations, and thorough question breakdown.",
    },
    {
      id: "faq-3",
      category: "Assessments & Revision",
      question: "Are mock examinations conducted regularly?",
      answer:
        "Yes. Full monthly mock tests strictly following board examination patterns are conducted to assess conceptual absorption. Weak areas are identified early so targeted revisions take place well before final board exams.",
    },
    {
      id: "faq-4",
      category: "Admissions & Campus",
      question: "How do I visit the Park Circus center or check batch availability?",
      answer:
        "You can submit an inquiry through our admissions form, call Azhar Sir directly at 098830 05641 or 82408 16226, or visit our campus at 1/1 Samsul Huda Road, Park Circus (near Quest Mall) during operating hours.",
    },
  ],
};
