/**
 * AROUSH ACADEMY — Academic Master Data Records
 *
 * Source of truth for dynamic academic setup:
 * - Classes / Grades
 * - Educational Boards
 * - Academy Subjects Catalog
 */

export interface AcademicClass {
  id: string;
  name: string; // e.g. "Class IX", "Class X", "Class XI", "Class XII"
  supportedBoards: string[]; // ["ICSE", "CBSE", "West Bengal Board"]
  isActive: boolean;
}

export interface AcademicBoard {
  id: string;
  name: string; // "ICSE", "CBSE", "West Bengal Board"
  code: string;
  isActive: boolean;
}

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  applicableClassIds: string[]; // Array of AcademicClass ids e.g. ["cls-9", "cls-10", "cls-11", "cls-12"]
  defaultMonthlyFee: number;
  isActive: boolean;
  description?: string;
}

export const DEFAULT_BOARDS: AcademicBoard[] = [
  { id: "brd-icse", name: "ICSE", code: "ICSE", isActive: true },
  { id: "brd-cbse", name: "CBSE", code: "CBSE", isActive: true },
  { id: "brd-wbbse", name: "West Bengal Board", code: "WBBSE", isActive: true },
];

export const DEFAULT_CLASSES: AcademicClass[] = [
  {
    id: "cls-9",
    name: "Class IX",
    supportedBoards: ["ICSE", "CBSE", "West Bengal Board"],
    isActive: true,
  },
  {
    id: "cls-10",
    name: "Class X",
    supportedBoards: ["ICSE", "CBSE", "West Bengal Board"],
    isActive: true,
  },
  {
    id: "cls-11",
    name: "Class XI",
    supportedBoards: ["ICSE", "CBSE", "West Bengal Board"],
    isActive: true,
  },
  {
    id: "cls-12",
    name: "Class XII",
    supportedBoards: ["ICSE", "CBSE", "West Bengal Board"],
    isActive: true,
  },
];

export const DEFAULT_SUBJECTS: AcademicSubject[] = [
  {
    id: "sub-math",
    name: "Mathematics",
    code: "MATH",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1500,
    isActive: true,
    description: "Core algebraic and geometric reasoning, trigonometry and calculus.",
  },
  {
    id: "sub-phy",
    name: "Physics",
    code: "PHYS",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1400,
    isActive: true,
    description: "Mechanics, thermodynamics, electrodynamics and experimental optics.",
  },
  {
    id: "sub-chem",
    name: "Chemistry",
    code: "CHEM",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1400,
    isActive: true,
    description: "Organic mechanisms, stoichiometry and atomic structure.",
  },
  {
    id: "sub-bio",
    name: "Biology",
    code: "BIOL",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1300,
    isActive: true,
    description: "Physiology, genetics, ecology and cellular biology.",
  },
  {
    id: "sub-cs",
    name: "Computer Science",
    code: "CS",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1600,
    isActive: true,
    description: "Java/Python fundamentals, algorithms, data structures and boolean logic.",
  },
  {
    id: "sub-acc",
    name: "Accountancy",
    code: "ACCT",
    applicableClassIds: ["cls-11", "cls-12"],
    defaultMonthlyFee: 1500,
    isActive: true,
    description: "Financial accounting, ledger auditing and corporate accounts.",
  },
  {
    id: "sub-eco",
    name: "Economics",
    code: "ECON",
    applicableClassIds: ["cls-11", "cls-12"],
    defaultMonthlyFee: 1400,
    isActive: true,
    description: "Microeconomics, macroeconomic theory and Indian economic development.",
  },
  {
    id: "sub-eng",
    name: "English Language & Literature",
    code: "ENGL",
    applicableClassIds: ["cls-9", "cls-10", "cls-11", "cls-12"],
    defaultMonthlyFee: 1200,
    isActive: true,
    description: "Comprehensive grammar, analytical composition and classic literature critique.",
  },
];
