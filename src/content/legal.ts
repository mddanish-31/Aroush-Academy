import type { LegalDoc } from "./types";

export const privacyDoc: LegalDoc = {
  slug: "privacy",
  title: "Privacy Notice",
  lastUpdated: "November 15, 2026",
  summary: "How the current website and account portal handle information. The academy must review and approve a complete privacy policy before launch.",
  sections: [
    {
      id: "information",
      heading: "Information entered into the portal",
      paragraphs: [
        "Student registration asks for student and guardian details. An academy administrator reviews registrations before creating active accounts. Account and session information is used to provide role-specific access.",
        "When the corresponding portal feature is enabled, the system may store enrollment, attendance, academic and fee records. The information visible to a signed-in user depends on their account and linked student records.",
      ],
    },
    {
      id: "payments",
      heading: "Payment references",
      paragraphs: [
        "A submitted UPI reference remains pending until an academy administrator manually records settlement verification. The portal does not treat an app return or screenshot as proof of payment.",
      ],
    },
    {
      id: "storage",
      heading: "Storage and access",
      paragraphs: [
        "The account portal uses a session cookie. Signed-in student, parent, teacher and administrator views have different access rules. The academy has not yet published an approved retention schedule, privacy contact or hosted backup and monitoring arrangements.",
        "Do not enter sensitive information into a feature marked unavailable. Private file uploads are unavailable until authorized storage is configured.",
      ],
    },
    {
      id: "contact",
      heading: "Questions and corrections",
      paragraphs: [
        "Use the contact information on the website to ask the academy about access to, or correction of, account information. A formal request process and complete privacy terms require academy approval before production launch.",
      ],
    },
  ],
};

export const termsDoc: LegalDoc = {
  slug: "terms",
  title: "Portal Use Information",
  lastUpdated: "November 15, 2026",
  summary: "Current account and payment portal behaviour. Academy-approved enrollment, fee, refund and legal terms remain to be published.",
  sections: [
    {
      id: "accounts",
      heading: "Accounts",
      paragraphs: [
        "Students may request registration. An academy administrator reviews a request before an account becomes active. Parents and teachers receive access only after the academy creates or links their accounts.",
        "Keep account credentials private and contact the academy if you suspect that someone else has access to your account.",
      ],
    },
    {
      id: "fees",
      heading: "Fees and payment status",
      paragraphs: [
        "Fee amounts and due dates are entered by an authorized administrator for individual enrollments. The portal does not publish a general fee schedule, refund policy or proration rule.",
        "Cash payments are recorded by an administrator. UPI references are submitted for manual review and do not reduce a balance until an administrator records settlement verification. Ask the academy to resolve a disputed or mistaken entry.",
      ],
    },
    {
      id: "academic",
      heading: "Academic information",
      paragraphs: [
        "Portal academic records reflect information entered by authorized academy users. Contact the academy about a correction. A feature marked unavailable does not provide a live academy record.",
      ],
    },
    {
      id: "approved-terms",
      heading: "Academy terms",
      paragraphs: [
        "The academy must supply and approve its legal entity details, enrollment terms, fee and refund policy, grievance contact and any required privacy notices before production publication. This page does not replace those agreed terms.",
      ],
    },
  ],
};
