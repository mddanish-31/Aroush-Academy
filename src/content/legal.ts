import type { LegalDoc } from "./types";

export const privacyDoc: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  lastUpdated: "October 19, 2026",
  summary: "Our commitment to student data protection, academic confidentiality, and compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act 2023).",
  sections: [
    {
      id: "scope-and-entity",
      heading: "1. Academy Information and Scope",
      paragraphs: [
        "ArousH Academy, operated under the legal entity REPLACE_ME ('the Academy', 'we', 'us'), conducts in-person coaching at 1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017.",
        "This Privacy Policy explains how we collect, store, process, and safeguard the personal data of students, parents, guardians, and website visitors in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act 2023) and applicable Indian information technology regulations.",
      ],
    },
    {
      id: "data-collected",
      heading: "2. Personal Data We Collect",
      paragraphs: [
        "We collect only the personal information necessary to deliver educational instruction, track academic growth, and maintain operational transparency.",
      ],
      listItems: [
        "Student and Guardian Identifiers: Student full name, enrolled school, board curriculum (ICSE, CBSE, or West Bengal Board), grade or class (Class V-XII), parent or guardian names, verified telephone numbers, residential address, and emergency contact details.",
        "Academic Records: Lecture attendance logs, chapter quiz results, monthly mock examination marks, evaluated answer papers, ranking sheets, and teacher progress notes.",
        "Administrative and Financial Data: Enrollment dates, batch allocations, tuition installment history, fee payment status, and system-generated PDF fee receipt identifiers.",
        "Technical Preferences: Client-side display preferences including motion settings, session state tokens, and essential functional cookies.",
      ],
    },
    {
      id: "purposes-and-dpdp",
      heading: "3. Lawful Basis and DPDP Act 2023 Compliance",
      paragraphs: [
        "All data processing is conducted on the lawful grounds of explicit consent and legitimate educational purposes under the DPDP Act 2023. Where a student is a minor (below 18 years of age), verifiable consent is obtained directly from their registered parent or legal guardian during admission.",
        "We process personal data strictly to organize teaching schedules, administer examinations, communicate academic progress to parents, issue official certificates and ID cards, and ensure student safety on campus.",
      ],
    },
    {
      id: "data-confidentiality",
      heading: "4. Data Sharing and Confidentiality",
      paragraphs: [
        "Student test scores, performance analytics, and attendance records are treated with strict confidentiality. Access is isolated across four institutional roles: Academy Admin, Teacher, Student, and Parent. A student or parent can view only their own verified records.",
        "We do not sell, rent, trade, or monetize personal data. We do not run third-party advertising scripts or marketing trackers on our website. Data is disclosed only when required by law or judicial orders issued by competent authorities in India.",
      ],
    },
    {
      id: "storage-retention",
      heading: "5. Data Retention and Security",
      paragraphs: [
        "Personal records are retained for the active duration of the student enrollment and for an additional period required for statutory compliance, academic audits, and certificate verification.",
        "We implement appropriate technical, administrative, and physical measures to protect student records against unauthorized access, loss, or alteration. Digital ID cards and issued test certificates are cryptographically verified against unique record hashes.",
      ],
    },
    {
      id: "principal-rights",
      heading: "6. Rights of Data Principals",
      paragraphs: [
        "Under the DPDP Act 2023, parents, guardians, and adult students possess specific rights regarding their personal data, including the right to access summaries of processed data, the right to correct inaccurate records, the right to withdraw consent, and the right to register grievances.",
      ],
      listItems: [
        "Right of Correction: Request prompt correction of outdated contact numbers, addresses, or enrollment details.",
        "Right to Summary: Review an itemized ledger of academic assessments, attendance percentages, and tuition receipts.",
        "Right to Withdraw: Withdraw consent for optional processing, subject to statutory retention requirements.",
      ],
    },
    {
      id: "grievance-officer",
      heading: "7. Contact and Grievance Redressal Officer",
      paragraphs: [
        "In accordance with the DPDP Act 2023, the Academy has appointed a designated Grievance Officer to address questions, concerns, or complaints regarding data privacy.",
        "Grievance Officer: REPLACE_ME",
        "Email: REPLACE_ME",
        "Campus Address: 1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017",
        "Direct Telephone: 098830 05641 / 82408 16226",
      ],
    },
  ],
};

export const termsDoc: LegalDoc = {
  slug: "terms",
  title: "Terms of Use and Conditions",
  lastUpdated: "October 19, 2026",
  summary: "Official terms governing enrollment, tuition fees, classroom conduct, portal access, and institutional policies at ArousH Academy.",
  sections: [
    {
      id: "acceptance-and-entity",
      heading: "1. Acceptance of Terms and Legal Entity",
      paragraphs: [
        "These Terms of Use and Conditions ('Terms') constitute a binding legal agreement between enrolled students, parents, guardians, and ArousH Academy, operated by legal entity REPLACE_ME ('the Academy', 'we', 'us').",
        "By completing admission forms, paying enrollment fees, using the website, or accessing any role-based portal, you agree to be bound by these Terms and all incorporated Academy guidelines.",
      ],
    },
    {
      id: "academic-scope",
      heading: "2. Academic Programs and Curriculum Scope",
      paragraphs: [
        "The Academy delivers in-person group coaching and subject mastery for Class V-XII students affiliated with ICSE, CBSE, and West Bengal Board curricula. Instruction is provided at our Park Circus campus.",
        "Timetables, teacher assignments, and batch allocations are structured according to academic grade and board requirements. The Academy reserves the right to modify class schedules or room allocations to optimize student learning and examination readiness.",
      ],
    },
    {
      id: "accounts-portals",
      heading: "3. Accounts and Role-Based Portals",
      paragraphs: [
        "Authorized portal access is provided to students, parents, teachers, and administrators. Users must safeguard login credentials and never share authentication details.",
        "You are responsible for all activities occurring under your account. Any suspected security breach, unauthorized access, or credential compromise must be reported to the administrative desk immediately.",
      ],
    },
    {
      id: "fees-refunds",
      heading: "4. Fees, Payment Schedules, and Refunds",
      paragraphs: [
        "Tuition fees must be settled according to the prescribed monthly or quarterly installment schedule communicated at admission. Official receipts are generated digitally upon confirmation of payment.",
        "Admission registration fees and seat-booking charges are strictly non-refundable once classes commence. In the event of early withdrawal due to documented family relocation or verified medical grounds, prorated fee adjustments may be considered at the sole discretion of academy management.",
      ],
    },
    {
      id: "attendance-conduct",
      heading: "5. Attendance, Discipline, and Classroom Conduct",
      paragraphs: [
        "Punctuality and consistent attendance are essential for academic continuity. Students must arrive promptly for all scheduled lectures and participate in mandatory monthly mock tests.",
        "The Academy maintains zero tolerance for disruptive behavior, academic dishonesty, harassment, or damage to campus property. The Academy reserves the right to suspend or terminate the enrollment of any student whose conduct undermines the safety or educational atmosphere of the classroom.",
      ],
    },
    {
      id: "content-ip",
      heading: "6. Content Ownership and Intellectual Property",
      paragraphs: [
        "All study modules, practice worksheets, mock test papers, solved solutions, diagrams, and lecture materials distributed in print or digital format remain the exclusive intellectual property of ArousH Academy.",
        "Students and guardians are granted a limited, personal, non-transferable license to use these materials solely for individual study. Reproducing, publishing, sharing online, or commercially redistributing Academy materials is strictly prohibited.",
      ],
    },
    {
      id: "reviews-moderation",
      heading: "7. User Submissions, Inquiries, and Review Moderation",
      paragraphs: [
        "Students and parents may submit testimonials, feedback, and academic questions through designated forms. All submissions must be truthful, courteous, and free of defamatory, abusive, or unlawful remarks.",
        "The Academy reserves the right to review, moderate, edit for brevity, or decline publication of any user-submitted content that fails to meet professional standards.",
      ],
    },
    {
      id: "limitation-liability",
      heading: "8. Educational Disclaimers and Limitation of Liability",
      paragraphs: [
        "Academic achievement depends upon the student's personal commitment, daily revision, and regular class participation. While our instructors provide rigorous guidance and comprehensive board preparation, the Academy does not guarantee specific numerical marks, board ranks, or school examination outcomes.",
        "To the maximum extent permitted by applicable Indian law, the Academy's total aggregate liability arising out of or related to our educational services shall not exceed the total tuition fees paid by the student during the three months preceding the claim.",
      ],
    },
    {
      id: "governing-law",
      heading: "9. Governing Law and Dispute Jurisdiction",
      paragraphs: [
        "These Terms are governed by and construed in accordance with the substantive laws of India.",
        "Any legal claim, dispute, or proceeding arising under or in connection with these Terms or Academy services shall be subject to the exclusive jurisdiction of the competent civil courts in Kolkata, West Bengal.",
      ],
    },
    {
      id: "grievance-contact",
      heading: "10. Contact and Grievance Officer",
      paragraphs: [
        "For contractual inquiries, administrative clarifications, or grievance submissions under these Terms, please contact our administrative desk:",
        "Grievance Officer: REPLACE_ME",
        "Email: REPLACE_ME",
        "Academy Address: 1/1 Samsul Huda Road, near Jeebrail International School, Park Circus, Ballygunge, Kolkata, West Bengal 700017",
        "Direct Contact: 098830 05641 / 82408 16226",
      ],
    },
  ],
};
