import type {
  TimetableSlot,
  AttendanceRecord,
  AssessmentRecord,
  IssuedCertificateRecord,
  StudyMaterialItem,
  NoticeItem,
  BatchDefinition,
  AuditLogEntry,
} from "@/types";

/**
 * Demo Timetable Schedule for ArousH Academy (Park Circus Center)
 */
export const SAMPLE_TIMETABLE: TimetableSlot[] = [
  {
    id: "time-1",
    dayOfWeek: "Monday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-hall-1",
    room: "Hall 1, Park Circus",
    status: "active",
  },
  {
    id: "time-sim-1",
    dayOfWeek: "Monday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-acc",
    subject: "Accountancy",
    batchId: "btc-comm",
    batch: "Batch Commerce (Class XI-XII)",
    classGrade: "Class XII",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    roomId: "room-3",
    room: "Room 3, Park Circus",
    status: "active",
  },
  {
    id: "time-2",
    dayOfWeek: "Monday",
    startTime: "18:15",
    endTime: "19:45",
    time: "06:15 PM - 07:45 PM",
    subjectId: "sub-phy",
    subject: "Physics",
    batchId: "btc-sci",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    roomId: "room-lab-2",
    room: "Lab 2, Park Circus",
    status: "active",
  },
  {
    id: "time-3",
    dayOfWeek: "Tuesday",
    startTime: "17:00",
    endTime: "18:30",
    time: "05:00 PM - 06:30 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-hs",
    batch: "Batch Higher Secondary (Class XI-XII)",
    classGrade: "Class XII",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-hall-2",
    room: "Hall 2, Park Circus",
    status: "active",
  },
  {
    id: "time-4",
    dayOfWeek: "Wednesday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-hall-1",
    room: "Hall 1, Park Circus",
    status: "active",
  },
  {
    id: "time-5",
    dayOfWeek: "Wednesday",
    startTime: "18:15",
    endTime: "19:45",
    time: "06:15 PM - 07:45 PM",
    subjectId: "sub-chem",
    subject: "Chemistry",
    batchId: "btc-sci",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    roomId: "room-lab-1",
    room: "Lab 1, Park Circus",
    status: "active",
  },
  {
    id: "time-6",
    dayOfWeek: "Thursday",
    startTime: "17:00",
    endTime: "18:30",
    time: "05:00 PM - 06:30 PM",
    subjectId: "sub-acc",
    subject: "Accountancy",
    batchId: "btc-comm",
    batch: "Batch Commerce (Class XI-XII)",
    classGrade: "Class XII",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    roomId: "room-3",
    room: "Room 3, Park Circus",
    status: "active",
  },
  {
    id: "time-7",
    dayOfWeek: "Friday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-hall-1",
    room: "Hall 1, Park Circus",
    status: "active",
  },
  {
    id: "time-8",
    dayOfWeek: "Friday",
    startTime: "18:15",
    endTime: "19:45",
    time: "06:15 PM - 07:45 PM",
    subjectId: "sub-phy",
    subject: "Physics",
    batchId: "btc-sci",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    roomId: "room-lab-2",
    room: "Lab 2, Park Circus",
    status: "active",
  },
  {
    id: "time-9",
    dayOfWeek: "Saturday",
    startTime: "15:00",
    endTime: "17:00",
    time: "03:00 PM - 05:00 PM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-mock-hall",
    room: "Special Mock Exam Hall",
    status: "active",
  },
  {
    id: "time-10",
    dayOfWeek: "Sunday",
    startTime: "10:00",
    endTime: "11:30",
    time: "10:00 AM - 11:30 AM",
    subjectId: "sub-math",
    subject: "Mathematics",
    batchId: "btc-alpha",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    roomId: "room-hall-1",
    room: "Hall 1, Park Circus",
    status: "active",
  },
];

/**
 * Attendance Records for October 2026
 */
export const SAMPLE_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-101-1",
    sessionId: "sess-btc-alpha-2026-10-09",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    date: "2026-10-09",
    status: "present",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
    remarks: "Active in class problem solving",
  },
  {
    id: "att-101-2",
    sessionId: "sess-btc-sci-2026-10-09",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    batchId: "btc-science",
    date: "2026-10-09",
    status: "present",
    teacherId: "tch-alvi",
    recordedBy: "Dr. Tariq Alvi",
  },
  {
    id: "att-101-3",
    sessionId: "sess-btc-alpha-2026-10-07",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    date: "2026-10-07",
    status: "present",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
  },
  {
    id: "att-101-4",
    sessionId: "sess-btc-sci-2026-10-05",
    studentId: "std-101",
    studentName: "Taha Rahman",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    batchId: "btc-science",
    date: "2026-10-05",
    status: "excused",
    teacherId: "tch-alvi",
    recordedBy: "Dr. Tariq Alvi",
    remarks: "Medical note submitted by guardian",
  },
  {
    id: "att-102-1",
    sessionId: "sess-btc-alpha-2026-10-09",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    date: "2026-10-09",
    status: "present",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
  },
  {
    id: "att-102-2",
    sessionId: "sess-btc-alpha-2026-10-07",
    studentId: "std-102",
    studentName: "Ananya Verma",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    date: "2026-10-07",
    status: "absent",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
    remarks: "Uninformed absence",
  },
  {
    id: "att-103-1",
    sessionId: "sess-btc-hs-2026-10-06",
    studentId: "std-103",
    studentName: "Zayd Al-Mansoor",
    subject: "Mathematics",
    batch: "Batch Higher Secondary (Class XI-XII)",
    batchId: "btc-hs",
    date: "2026-10-06",
    status: "present",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
  },
  {
    id: "att-104-1",
    sessionId: "sess-btc-hs-2026-10-06",
    studentId: "std-104",
    studentName: "Fatima Sheikh",
    subject: "Mathematics",
    batch: "Batch Higher Secondary (Class XI-XII)",
    batchId: "btc-hs",
    date: "2026-10-06",
    status: "present",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
  },
  {
    id: "att-105-1",
    sessionId: "sess-btc-sci-2026-10-09",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    batchId: "btc-science",
    date: "2026-10-09",
    status: "present",
    teacherId: "tch-alvi",
    recordedBy: "Dr. Tariq Alvi",
  },
  {
    id: "att-105-2",
    sessionId: "sess-btc-alpha-2026-10-09",
    studentId: "std-105",
    studentName: "Rohan Mukherjee",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    date: "2026-10-09",
    status: "late",
    teacherId: "tch-azhar",
    recordedBy: "Azhar Sir",
    remarks: "Late arrival due to transit delay",
  },
];

/**
 * Assessment Records and Mock Examination Series
 */
export const SAMPLE_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: "exam-1",
    title: "ICSE Class X Mathematics Periodic Mock Test 1",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-03",
    totalMarks: 80,
    teacherId: "tch-azhar",
    type: "periodic-unit-test",
    status: "published",
    certificatePolicy: {
      enabled: false,
      minPercentage: 75,
      certificateTitle: "Mathematics Periodic Test Certificate",
      certificateType: "merit",
    },
    studentScores: [
      {
        studentId: "std-101",
        studentName: "Taha Rahman",
        marksObtained: 74,
        status: "evaluated",
        feedback: "Exceptional proof structure in Trigonometry & Coordinate Geometry.",
      },
      {
        studentId: "std-102",
        studentName: "Ananya Verma",
        marksObtained: 68,
        status: "evaluated",
        feedback: "Good attempt; practice quadratic factorization word problems.",
      },
    ],
  },
  {
    id: "exam-2",
    title: "Class X Physics Mechanics & Optics Test",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    date: "2026-09-28",
    totalMarks: 50,
    teacherId: "tch-alvi",
    type: "regular-class-test",
    status: "published",
    certificatePolicy: {
      enabled: false,
      minPercentage: 75,
      certificateTitle: "Certificate of Merit in Physics",
      certificateType: "merit",
    },
    studentScores: [
      {
        studentId: "std-101",
        studentName: "Taha Rahman",
        marksObtained: 46,
        status: "evaluated",
        feedback: "Precise ray diagrams and lens formula calculations.",
      },
      {
        studentId: "std-105",
        studentName: "Rohan Mukherjee",
        marksObtained: 41,
        status: "evaluated",
        feedback: "Review refraction laws and Snell's theorem numericals.",
      },
    ],
  },
  {
    id: "exam-3",
    title: "Class XII Higher Mathematics Calculus Diagnostics",
    subject: "Mathematics",
    batch: "Batch Higher Secondary (Class XI-XII)",
    classGrade: "Class XII",
    date: "2026-09-25",
    totalMarks: 100,
    teacherId: "tch-azhar",
    type: "regular-class-test",
    status: "published",
    certificatePolicy: {
      enabled: false,
      minPercentage: 75,
      certificateTitle: "Calculus Diagnostic Certificate",
      certificateType: "merit",
    },
    studentScores: [
      {
        studentId: "std-103",
        studentName: "Zayd Al-Mansoor",
        marksObtained: 88,
        status: "evaluated",
        feedback: "Outstanding proficiency in integration by parts.",
      },
      {
        studentId: "std-104",
        studentName: "Fatima Sheikh",
        marksObtained: 82,
        status: "evaluated",
        feedback: "Very thorough; double-check substitution limits.",
      },
    ],
  },
  {
    id: "exam-4",
    title: "Class X Board Preparation Mock Test 1 (All-Bengal)",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-10",
    totalMarks: 100,
    teacherId: "tch-azhar",
    type: "board-mock-test",
    status: "published",
    certificatePolicy: {
      enabled: true,
      minPercentage: 80,
      certificateTitle: "Certificate of Academic Distinction (Board Mock)",
      certificateType: "merit",
    },
    studentScores: [
      {
        studentId: "std-101",
        studentName: "Taha Rahman",
        marksObtained: 86,
        status: "evaluated",
        feedback: "Outstanding mastery across Section A and Section B. Recommended for honors.",
      },
      {
        studentId: "std-102",
        studentName: "Ananya Verma",
        marksObtained: 72,
        status: "evaluated",
        feedback: "Good grasp of circle theorems. Focus on word problems in commercial math.",
      },
    ],
  },
  {
    id: "exam-5",
    title: "Class X Chemistry Chemical Bonding & Periodic Table",
    subject: "Chemistry",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-22",
    totalMarks: 50,
    teacherId: "tch-alvi",
    type: "periodic-unit-test",
    status: "scheduled",
    certificatePolicy: {
      enabled: false,
      minPercentage: 75,
      certificateTitle: "Chemistry Unit Excellence",
      certificateType: "merit",
    },
    studentScores: [],
  },
  {
    id: "exam-6",
    title: "Class X Physics Optics & Electricity Mock Exam (Online)",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-08",
    totalMarks: 16,
    teacherId: "tch-alvi",
    type: "online-mock-exam",
    status: "published",
    linkedMockExamId: "mock-phys-102",
    certificatePolicy: {
      enabled: true,
      minPercentage: 75,
      certificateTitle: "Certificate of Online Mock Proficiency",
      certificateType: "mock-completion",
    },
    studentScores: [
      {
        studentId: "std-101",
        studentName: "Taha Rahman",
        marksObtained: 12,
        status: "evaluated",
        feedback: "3 of 4 MCQs correct in speed trial. Optics calculations accurate.",
      },
    ],
  },
  {
    id: "exam-7",
    title: "Class X Mathematics Trigonometric Identities Class Test",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    date: "2026-10-14",
    totalMarks: 40,
    teacherId: "tch-azhar",
    type: "regular-class-test",
    status: "draft",
    certificatePolicy: {
      enabled: false,
      minPercentage: 75,
      certificateTitle: "Trigonometry Class Test Certificate",
      certificateType: "merit",
    },
    studentScores: [
      {
        studentId: "std-101",
        studentName: "Taha Rahman",
        marksObtained: 36,
        status: "evaluated",
        feedback: "Clear step-by-step LHS = RHS derivations.",
      },
      {
        studentId: "std-102",
        studentName: "Ananya Verma",
        marksObtained: 32,
        status: "evaluated",
        feedback: "Review complementary angle formulas.",
      },
    ],
  },
];

export const SAMPLE_ISSUED_CERTIFICATES: IssuedCertificateRecord[] = [
  {
    id: "cert-exam-4-std-101",
    certificateNumber: "AA-2026-MERIT-MAT-101",
    certificateType: "merit",
    title: "Certificate of Academic Distinction (Board Mock)",
    studentId: "std-101",
    studentName: "Taha Rahman",
    classGrade: "Class X",
    board: "ICSE",
    subject: "Mathematics",
    assessmentId: "exam-4",
    assessmentName: "Class X Board Preparation Mock Test 1 (All-Bengal)",
    assessmentDate: "2026-10-10",
    scoreObtained: 86,
    totalMarks: 100,
    percentage: 86,
    criteriaMet: "Secured 86% in Board Preparation Mock Test 1 (Policy Threshold: ≥ 80%)",
    issuedDate: "2026-10-11",
    issuedBy: "Azhar Sir",
    issuedByRole: "teacher",
    facultyName: "Azhar Sir",
    status: "issued",
  },
];

/**
 * Study Material and Free Resources Repository
 */
export const SAMPLE_MATERIALS: StudyMaterialItem[] = [
  {
    id: "mat-1",
    title: "Class X Mathematics — Coordinate Geometry Master Formula Guide",
    subject: "Mathematics",
    classGrade: "Class X",
    type: "Formula Sheet",
    size: "1.4 MB",
    uploadedBy: "Azhar Sir",
    teacherId: "tch-azhar",
    date: "2026-10-02",
    content: `CLASS X MATHEMATICS — COORDINATE GEOMETRY FORMULA GUIDE
Subject: Mathematics • Grade: Class X (ICSE/CBSE) • Faculty: Azhar Sir

1. DISTANCE FORMULA:
   Distance between P(x1, y1) and Q(x2, y2):
   d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
   Distance from origin O(0, 0) to P(x, y):
   d = sqrt(x^2 + y^2)

2. SECTION FORMULA (INTERNAL DIVISION):
   Coordinates of point R(x, y) dividing segment PQ in ratio m : n:
   x = (m*x2 + n*x1) / (m + n)
   y = (m*y2 + n*y1) / (m + n)

3. MIDPOINT FORMULA:
   M(x, y) = ((x1 + x2)/2, (y1 + y2)/2)

4. CENTROID OF A TRIANGLE:
   For triangle ABC with vertices (x1, y1), (x2, y2), (x3, y3):
   G(x, y) = ((x1 + x2 + x3)/3, (y1 + y2 + y3)/3)

5. SLOPE OF A LINE (m):
   m = tan(theta) = (y2 - y1) / (x2 - x1)  [where x1 != x2]
   Condition for parallel lines: m1 = m2
   Condition for perpendicular lines: m1 * m2 = -1

6. EQUATIONS OF A STRAIGHT LINE:
   Slope-Intercept Form: y = m*x + c
   Point-Slope Form: y - y1 = m*(x - x1)
   Two-Point Form: (y - y1) / (x - x1) = (y2 - y1) / (x2 - x1)`,
  },
  {
    id: "mat-2",
    title: "ICSE Class X Quadratic Equations — High-Yield Word Problems (Solved)",
    subject: "Mathematics",
    classGrade: "Class X",
    type: "Worksheet",
    size: "2.1 MB",
    uploadedBy: "Azhar Sir",
    teacherId: "tch-azhar",
    date: "2026-09-29",
    content: `ICSE CLASS X QUADRATIC EQUATIONS — SOLVED WORD PROBLEMS
Subject: Mathematics • Grade: Class X • Faculty: Azhar Sir

PROBLEM 1 (SPEED & DISTANCE):
An express train takes 1 hour less than a passenger train to travel 132 km.
If its average speed is 11 km/h more than that of the passenger train, find the speed of both trains.

SOLUTION:
Let passenger train speed = x km/h. Express train speed = (x + 11) km/h.
Equation: (132 / x) - (132 / (x + 11)) = 1
=> 132 * [(x + 11 - x) / (x * (x + 11))] = 1
=> 132 * 11 = x^2 + 11x
=> x^2 + 11x - 1452 = 0
Factorizing: (x + 44)(x - 33) = 0
Since speed > 0: x = 33 km/h.
Passenger train speed = 33 km/h, Express train speed = 44 km/h.

----------------------------------------------------------------------
PROBLEM 2 (TWO-DIGIT NUMBERS):
The product of digits of a two-digit positive number is 24. If 18 is added to the number,
the digits reverse their places. Find the original number.

SOLUTION:
Let tens digit = x. Units digit = 24 / x.
Original number = 10x + (24 / x).
Reversed number = 10*(24 / x) + x = (240 / x) + x.
Given: [10x + (24 / x)] + 18 = (240 / x) + x
=> 9x + 18 = 216 / x
Multiply by x: 9x^2 + 18x - 216 = 0
Divide by 9: x^2 + 2x - 24 = 0
=> (x + 6)(x - 4) = 0
Since digit must be positive: x = 4.
Units digit = 24 / 4 = 6.
Answer: The number is 46.`,
  },
  {
    id: "mat-3",
    title: "Class X Physics — Light Refraction & Spherical Lenses Numerical Bank",
    subject: "Physics",
    classGrade: "Class X",
    type: "Practice Paper",
    size: "3.2 MB",
    uploadedBy: "Dr. Tariq Alvi",
    teacherId: "tch-alvi",
    date: "2026-09-22",
    content: `CLASS X PHYSICS — LIGHT REFRACTION & SPHERICAL LENSES NUMERICAL BANK
Subject: Physics • Grade: Class X • Faculty: Dr. Tariq Alvi

FUNDAMENTAL FORMULAS:
1. Snell's Law: n = sin(i) / sin(r)
2. Lens Formula: (1/f) = (1/v) - (1/u)
3. Linear Magnification: m = v / u = (height of image) / (height of object)
4. Power of Lens: P = 1 / f(meters) [Unit: Dioptre (D)]
   Convex lens: f > 0, P > 0
   Concave lens: f < 0, P < 0

----------------------------------------------------------------------
PRACTICE PROBLEM 1:
A convex lens of focal length 15 cm forms a real image 30 cm away from the optical centre.
Calculate the object distance and magnification.

SOLUTION:
Given: f = +15 cm, v = +30 cm (real image on other side).
Using lens formula: (1/f) = (1/v) - (1/u)
=> (1/15) = (1/30) - (1/u)
=> (1/u) = (1/30) - (1/15) = -1/30
=> u = -30 cm (Object placed 30 cm in front of lens).
Magnification: m = v / u = 30 / (-30) = -1.
Nature: Real, inverted, and equal in size to object.

----------------------------------------------------------------------
PRACTICE PROBLEM 2:
A student is prescribed a corrective lens of power -2.5 D.
Calculate the focal length. State whether the lens is converging or diverging.

SOLUTION:
Focal length: f = 1 / P = 1 / (-2.5) = -0.4 m = -40 cm.
Since power and focal length are negative, this is a diverging (concave) lens.
Application: Correction of Myopia (nearsightedness).`,
  },
  {
    id: "mat-4",
    title: "Class XII Higher Mathematics — Integration Techniques & Standard Forms",
    subject: "Mathematics",
    classGrade: "Class XII",
    type: "PDF Notes",
    size: "4.8 MB",
    uploadedBy: "Azhar Sir",
    teacherId: "tch-azhar",
    date: "2026-09-15",
  },
  {
    id: "mat-5",
    title: "Class XI-XII Accountancy — Partnership Fundamentals & Reconstitution",
    subject: "Accountancy",
    classGrade: "Class XII",
    type: "PDF Notes",
    size: "2.9 MB",
    uploadedBy: "Prof. N. Roy",
    teacherId: "tch-roy",
    date: "2026-09-18",
  },
];

/**
 * Official Academy Notices & Circulars
 */
export const SAMPLE_NOTICES: NoticeItem[] = [
  {
    id: "not-1",
    title: "Pre-Board Mock Examination Series Schedule (October–November 2026)",
    category: "Examination",
    date: "2026-10-08",
    content:
      "All Class X and Class XII batches will sit for full-length 80-mark mock examinations under timed board conditions starting Saturday, 24th October. Detailed syllabus breakdowns have been distributed in classrooms.",
    author: "Academy Academic Office",
    priority: "urgent",
    targetRoles: ["academy-admin", "teacher", "student", "parent"],
  },
  {
    id: "not-2",
    title: "Special Weekend Problem-Solving Clinic by Azhar Sir",
    category: "Academic",
    date: "2026-10-05",
    content:
      "Azhar Sir will host an open doubt clearing clinic on Trigonometric Identities & Calculus this Saturday from 02:00 PM to 04:00 PM in Hall 1. Open to all enrolled mathematics students.",
    author: "Azhar Sir (Faculty)",
    priority: "normal",
    targetRoles: ["student", "parent", "teacher"],
  },
  {
    id: "not-3",
    title: "Puja & Autumn Session Schedule Update",
    category: "Holiday",
    date: "2026-10-01",
    content:
      "Regular physical lectures will observe recess from 18th to 22nd October. Online study assignments and recorded practice papers will remain accessible via the student portal.",
    author: "Administration",
    priority: "normal",
    targetRoles: ["academy-admin", "teacher", "student", "parent"],
  },
  {
    id: "not-4",
    title: "Faculty Advisory: Mid-Term Attendance & Progress Review Meetings",
    category: "Administration",
    date: "2026-09-28",
    content:
      "All faculty members are requested to complete the September marks submissions and flag overdue attendance students prior to the parent-teacher review session.",
    author: "Administration",
    priority: "normal",
    targetRoles: ["academy-admin", "teacher"],
  },
];

/**
 * Batches and Faculty Schedule Roster
 */
export const SAMPLE_BATCHES: BatchDefinition[] = [
  {
    id: "btc-alpha",
    name: "Batch Alpha (Class IX-X)",
    subject: "Mathematics",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    capacity: 25,
    enrolledCount: 18,
    schedule: "Mon, Wed, Fri (04:30 PM - 06:00 PM)",
    monthlyFee: 1500,
    status: "active",
  },
  {
    id: "btc-hs",
    name: "Batch Higher Secondary (Class XI-XII)",
    subject: "Mathematics",
    classGrade: "Class XII",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    capacity: 20,
    enrolledCount: 16,
    schedule: "Tue, Thu, Sat (05:00 PM - 06:30 PM)",
    monthlyFee: 1600,
    status: "active",
  },
  {
    id: "btc-sci",
    name: "Batch Science (Class IX-X)",
    subject: "Physics & Chemistry",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    capacity: 22,
    enrolledCount: 15,
    schedule: "Mon, Wed, Fri (06:15 PM - 07:45 PM)",
    monthlyFee: 1400,
    status: "active",
  },
  {
    id: "btc-comm",
    name: "Batch Commerce (Class XI-XII)",
    subject: "Accountancy & Economics",
    classGrade: "Class XII",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    capacity: 18,
    enrolledCount: 12,
    schedule: "Tue, Thu (05:00 PM - 06:30 PM)",
    monthlyFee: 1500,
    status: "active",
  },
];

/**
 * System and Ledger Audit Logs
 */
export const SAMPLE_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: "2026-10-10 16:42:15",
    performedBy: "Azhar Sir (Teacher)",
    action: "Cash Payment Recorded",
    target: "Obligation #ob-101-oct (Taha Rahman)",
    details: "Recorded cash collection of ₹1,500. Receipt voucher #CSH-2026-101 issued.",
    type: "financial",
  },
  {
    id: "log-2",
    timestamp: "2026-10-10 11:15:30",
    performedBy: "Academy Administrator",
    action: "Payment Destination Published",
    target: "Destination #dest-phys-alvi (Physics - Dr. Tariq Alvi)",
    details: "Configured and verified institutional UPI & Bank details for Class X Physics.",
    type: "financial",
  },
  {
    id: "log-3",
    timestamp: "2026-10-09 18:20:00",
    performedBy: "Azhar Sir (Teacher)",
    action: "Attendance Marked",
    target: "Batch Alpha (Class IX-X)",
    details: "Marked 18 students present for Mathematics Session #42.",
    type: "enrollment",
  },
  {
    id: "log-4",
    timestamp: "2026-10-08 09:30:00",
    performedBy: "Academy Administrator",
    action: "Notice Published",
    target: "All Roles",
    details: "Published urgent circular: Pre-Board Mock Examination Series Schedule.",
    type: "system",
  },
  {
    id: "log-5",
    timestamp: "2026-10-05 14:10:22",
    performedBy: "Academy Administrator",
    action: "Monthly Fee Obligations Generated",
    target: "October 2026 Fee Cycle",
    details: "Generated 9 subject fee obligations totaling ₹13,800 across 5 active students.",
    type: "financial",
  },
];
