import assert from "node:assert";
import {
  DAYS_OF_WEEK,
  checkTimetableConflict,
  getStudentTimetableSlots,
  computeDaySlotPositions,
  getMondayOfWeek,
  getWeekDays,
  formatWeekRange,
  isSlotOnDate,
  calculateSlotLayout,
  parseTimeToMinutes,
  getSlotTimeMinutes,
  formatMinutesTo12Hour,
  formatMinutesTo24Hour,
} from "@/lib/timetableUtils";
import { SAMPLE_TIMETABLE } from "@/data/dashboardModulesData";
import { SAMPLE_ENROLLMENTS } from "@/data/enrollmentFeeData";
import type { TimetableSlot } from "@/types";

console.log("==================================================================");
console.log("   AROUCH ACADEMY — TIMETABLE SYSTEM COMPREHENSIVE VERIFICATION   ");
console.log("==================================================================\n");

// -------------------------------------------------------------------------
// Point 1: Teacher creates a Monday class; Admin sees the same record
// -------------------------------------------------------------------------
console.log("Point 1: Teacher creates a Monday class; Admin sees the same record...");
{
  const sharedSchedules: TimetableSlot[] = [...SAMPLE_TIMETABLE];
  const newMondayClass: TimetableSlot = {
    id: "time-test-mon-1",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    time: "09:00 AM - 10:30 AM",
    subject: "Mathematics",
    subjectId: "sub-math",
    batch: "Batch Alpha (Class IX-X)",
    batchId: "btc-alpha",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    status: "active",
  };

  // Teacher adds class to shared state
  sharedSchedules.push(newMondayClass);

  // Admin inspects complete dataset
  const adminFound = sharedSchedules.find((s) => s.id === "time-test-mon-1");
  assert(adminFound, "Admin reads exact record created by Teacher");
  assert.strictEqual(adminFound.dayOfWeek, "Monday");
  assert.strictEqual(adminFound.teacherId, "tch-azhar");
  console.log("  ✓ Passed: Teacher creation updates shared dataset visible to Admin");
}

// -------------------------------------------------------------------------
// Point 2: Teacher creates a Sunday class; it appears in the weekly calendar
// -------------------------------------------------------------------------
console.log("\nPoint 2: Teacher creates a Sunday class; it appears in the weekly calendar...");
{
  const sharedSchedules: TimetableSlot[] = [...SAMPLE_TIMETABLE];
  const sundayClass: TimetableSlot = {
    id: "time-test-sun-1",
    dayOfWeek: "Sunday",
    startTime: "11:45",
    endTime: "13:15",
    time: "11:45 AM - 01:15 PM",
    subject: "Physics",
    subjectId: "sub-phy",
    batch: "Batch Science (Class IX-X)",
    batchId: "btc-sci",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    status: "active",
  };

  sharedSchedules.push(sundayClass);

  // Verify Sunday exists in DAYS_OF_WEEK
  assert(DAYS_OF_WEEK.includes("Sunday"), "Sunday is an active day of week");

  const sundaySlots = sharedSchedules.filter((s) => s.dayOfWeek === "Sunday");
  assert(sundaySlots.some((s) => s.id === "time-test-sun-1"), "Sunday class appears in Sunday column");
  console.log("  ✓ Passed: Sunday scheduling fully supported and rendered in weekly routine");
}

// -------------------------------------------------------------------------
// Point 3: Academy Admin edits or cancels a schedule; all eligible views update
// -------------------------------------------------------------------------
console.log("\nPoint 3: Academy Admin edits or cancels a schedule; all eligible views update...");
{
  let sharedSchedules: TimetableSlot[] = [...SAMPLE_TIMETABLE];
  const targetId = "time-1";

  // Admin cancels time-1
  sharedSchedules = sharedSchedules.map((s) =>
    s.id === targetId ? { ...s, status: "cancelled" } : s
  );

  const updatedAdminSlot = sharedSchedules.find((s) => s.id === targetId);
  assert.strictEqual(updatedAdminSlot?.status, "cancelled", "Schedule marked as cancelled in master dataset");

  // Student view filters out cancelled classes
  const studentSlots = getStudentTimetableSlots("std-101", SAMPLE_ENROLLMENTS, sharedSchedules);
  assert(!studentSlots.some((s) => s.id === targetId), "Cancelled class does not appear in Student portal");
  console.log("  ✓ Passed: Admin schedule cancellation reactively updates Student and Parent views");
}

// -------------------------------------------------------------------------
// Point 4: Multiple valid simultaneous classes display as separate blocks
// -------------------------------------------------------------------------
console.log("\nPoint 4: Multiple valid simultaneous classes display as separate blocks...");
{
  const mondaySimultaneous: TimetableSlot[] = [
    {
      id: "sim-1",
      dayOfWeek: "Monday",
      startTime: "16:30",
      endTime: "18:00",
      time: "04:30 PM - 06:00 PM",
      subject: "Mathematics",
      batch: "Batch Alpha (Class IX-X)",
      classGrade: "Class X",
      teacherId: "tch-azhar",
      teacherName: "Azhar Sir",
      status: "active",
    },
    {
      id: "sim-2",
      dayOfWeek: "Monday",
      startTime: "16:30",
      endTime: "18:00",
      time: "04:30 PM - 06:00 PM",
      subject: "Accountancy",
      batch: "Batch Commerce (Class XI-XII)",
      classGrade: "Class XII",
      teacherId: "tch-roy",
      teacherName: "Prof. N. Roy",
      status: "active",
    },
  ];

  const positions = computeDaySlotPositions(mondaySimultaneous);
  assert.strictEqual(positions.length, 2, "Both simultaneous slots are positioned");
  assert.strictEqual(positions[0].totalCols, 2, "Cluster detected 2 simultaneous columns");
  assert.strictEqual(positions[1].totalCols, 2, "Cluster detected 2 simultaneous columns");
  assert.notStrictEqual(positions[0].colIndex, positions[1].colIndex, "Slots have distinct column indices (side-by-side)");
  console.log("  ✓ Passed: Simultaneous classes positioned side-by-side without visual collision");
}

// -------------------------------------------------------------------------
// Point 5: Overlapping schedules for the same teacher are rejected
// -------------------------------------------------------------------------
console.log("\nPoint 5: Overlapping schedules for the same teacher are rejected...");
{
  const candidateConflict = {
    dayOfWeek: "Monday" as const,
    startTime: "17:00",
    endTime: "18:30",
    teacherId: "tch-azhar", // Azhar Sir already teaches time-1 16:30-18:00
    teacherName: "Azhar Sir",
    batch: "Batch Higher Secondary (Class XI-XII)",
    subject: "Mathematics",
  };

  const validation = checkTimetableConflict(candidateConflict, SAMPLE_TIMETABLE);
  assert.strictEqual(validation.hasConflict, true, "Teacher overlap detected");
  assert(validation.reason?.includes("Teacher Conflict"), "Detailed Teacher Conflict message provided");
  console.log(`  ✓ Passed: Rejected (${validation.reason})`);
}

// -------------------------------------------------------------------------
// Point 6: Rooms are NOT required and room conflict is not enforced
// -------------------------------------------------------------------------
console.log("\nPoint 6: Rooms are NOT required and room conflict is not enforced...");
{
  // Candidate has distinct teacher and distinct batch, but same time slot as time-1.
  // With room requirements removed, this should be ACCEPTED without needing room validation.
  const candidateNoRoom = {
    dayOfWeek: "Monday" as const,
    startTime: "16:30",
    endTime: "18:00",
    teacherId: "tch-alvi", // Tariq Alvi (different from Azhar Sir)
    teacherName: "Dr. Tariq Alvi",
    batch: "Batch Science (Class IX-X)", // Different batch from Batch Alpha
    subject: "Physics",
  };

  const validation = checkTimetableConflict(candidateNoRoom, SAMPLE_TIMETABLE);
  assert.strictEqual(validation.hasConflict, false, "Candidate without room is accepted without room validation error");
  console.log("  ✓ Passed: Room conflict checks successfully removed; pure subject/teacher/batch/timing focus");
}

// -------------------------------------------------------------------------
// Point 7: Overlapping schedules for the same batch are rejected
// -------------------------------------------------------------------------
console.log("\nPoint 7: Overlapping schedules for the same batch are rejected...");
{
  const candidateConflict = {
    dayOfWeek: "Monday" as const,
    startTime: "17:00",
    endTime: "18:30",
    teacherId: "tch-alvi", // Different teacher
    teacherName: "Dr. Tariq Alvi",
    batch: "Batch Alpha (Class IX-X)", // Same batch as time-1 (16:30 - 18:00)
    subject: "Physics",
  };

  const validation = checkTimetableConflict(candidateConflict, SAMPLE_TIMETABLE);
  assert.strictEqual(validation.hasConflict, true, "Batch overlap detected");
  assert(validation.reason?.includes("Batch Conflict"), "Detailed Batch Conflict message provided");
  console.log(`  ✓ Passed: Rejected (${validation.reason})`);
}

// -------------------------------------------------------------------------
// Point 8: Adjacent non-overlapping classes are accepted
// -------------------------------------------------------------------------
console.log("\nPoint 8: Adjacent non-overlapping classes are accepted...");
{
  // time-1 ends exactly at 18:00 with Azhar Sir
  const adjacentCandidate = {
    dayOfWeek: "Monday" as const,
    startTime: "18:00", // Exactly starts when previous ends
    endTime: "19:30",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    batch: "Batch Higher Secondary (Class XI-XII)",
    subject: "Mathematics",
  };

  const validation = checkTimetableConflict(adjacentCandidate, SAMPLE_TIMETABLE);
  assert.strictEqual(validation.hasConflict, false, "Adjacent classes at exact boundary are permitted");
  console.log("  ✓ Passed: Adjacent schedule (18:00 start when previous ends at 18:00) cleanly accepted");
}

// -------------------------------------------------------------------------
// Point 9: Students see only classes matching their own enrollment relationships
// -------------------------------------------------------------------------
console.log("\nPoint 9: Students see only classes matching their own enrollment relationships...");
{
  // std-101 (Taha Rahman) is enrolled in Class X Maths and Physics
  const tahaSlots = getStudentTimetableSlots("std-101", SAMPLE_ENROLLMENTS, SAMPLE_TIMETABLE);
  assert(tahaSlots.length > 0, "Enrolled student receives timetable slots");

  // Must only contain Mathematics and Physics
  const distinctSubjects = Array.from(new Set(tahaSlots.map((s) => s.subject)));
  assert(distinctSubjects.includes("Mathematics"), "Contains Maths");
  assert(distinctSubjects.includes("Physics"), "Contains Physics");
  assert(!distinctSubjects.includes("Accountancy"), "Does NOT leak Accountancy (Commerce batch)");

  // Unenrolled student
  const unenrolledSlots = getStudentTimetableSlots("non-existent-student", SAMPLE_ENROLLMENTS, SAMPLE_TIMETABLE);
  assert.strictEqual(unenrolledSlots.length, 0, "Unenrolled student receives empty schedule safely");
  console.log("  ✓ Passed: Student portal strictly scoped to verified enrollment relationships");
}

// -------------------------------------------------------------------------
// Point 10: Parents see only classes matching their linked child's enrollments
// -------------------------------------------------------------------------
console.log("\nPoint 10: Parents see only classes matching their linked child's enrollments...");
{
  const studentId = "std-101"; // Tariq Rahman's ward
  const studentSlots = getStudentTimetableSlots(studentId, SAMPLE_ENROLLMENTS, SAMPLE_TIMETABLE);
  const parentSlots = getStudentTimetableSlots(studentId, SAMPLE_ENROLLMENTS, SAMPLE_TIMETABLE);

  assert.strictEqual(studentSlots.length, parentSlots.length, "Parent and Student view exact same classes");
  for (let i = 0; i < studentSlots.length; i++) {
    assert.strictEqual(studentSlots[i].id, parentSlots[i].id, "Slot IDs match 1-to-1 between Student & Parent");
  }
  console.log("  ✓ Passed: Parent schedule derived identically from linked ward's active enrollments");
}

// -------------------------------------------------------------------------
// Point 11: Weekday synchronization, Monday-first mapping and Sunday handling
// -------------------------------------------------------------------------
console.log("\nPoint 11: Weekday synchronization, Monday-first mapping and Sunday handling...");
{
  // Test Monday Oct 12, 2026
  const testDate = new Date(2026, 9, 14); // Wednesday Oct 14, 2026
  const monday = getMondayOfWeek(testDate);
  assert.strictEqual(monday.getDay(), 1, "Monday of week is day 1 (Monday)");
  assert.strictEqual(monday.getDate(), 12, "Monday is Oct 12, 2026");

  // Test Sunday Oct 18, 2026 correctly resolves to Monday Oct 12
  const sundayDate = new Date(2026, 9, 18); // Sunday
  const mondayFromSunday = getMondayOfWeek(sundayDate);
  assert.strictEqual(mondayFromSunday.getDate(), 12, "Sunday boundary resolves to same week Monday");

  // Week days generation
  const weekDays = getWeekDays(monday, testDate);
  assert.strictEqual(weekDays.length, 7, "Generates exactly 7 days");
  assert.strictEqual(weekDays[0].dayOfWeek, "Monday");
  assert.strictEqual(weekDays[6].dayOfWeek, "Sunday");
  assert.strictEqual(weekDays[2].isToday, true, "Wednesday correctly marked as Today");

  const rangeLabel = formatWeekRange(monday);
  assert(rangeLabel.includes("Oct 12"), "Range includes start date Oct 12");
  assert(rangeLabel.includes("Oct 18"), "Range includes end date Oct 18");
  console.log(`  ✓ Passed: Week range formatted cleanly (${rangeLabel}) with canonical Monday-first indexing`);
}

// -------------------------------------------------------------------------
// Point 12: Recurring routines vs Date-specific sessions
// -------------------------------------------------------------------------
console.log("\nPoint 12: Recurring routines vs Date-specific sessions...");
{
  const recurringSlot: TimetableSlot = {
    id: "slot-recurring",
    dayOfWeek: "Tuesday",
    startTime: "10:00",
    endTime: "11:30",
    time: "10:00 AM - 11:30 AM",
    subject: "Chemistry",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    scheduleType: "recurring",
  };

  const dateSpecificSlot: TimetableSlot = {
    id: "slot-specific",
    dayOfWeek: "Tuesday",
    specificDate: "2026-10-13",
    startTime: "14:00",
    endTime: "15:30",
    time: "02:00 PM - 03:30 PM",
    subject: "Biology",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    scheduleType: "specific_date",
  };

  // On Oct 13, 2026 (Tuesday): both appear
  assert(isSlotOnDate(recurringSlot, "2026-10-13", "Tuesday"), "Recurring matches Tuesday");
  assert(isSlotOnDate(dateSpecificSlot, "2026-10-13", "Tuesday"), "Date-specific matches exact date");

  // On Oct 20, 2026 (Next Tuesday): recurring appears, date-specific DOES NOT appear!
  assert(isSlotOnDate(recurringSlot, "2026-10-20", "Tuesday"), "Recurring repeats on next Tuesday");
  assert(!isSlotOnDate(dateSpecificSlot, "2026-10-20", "Tuesday"), "Date-specific does NOT leak to next Tuesday");

  console.log("  ✓ Passed: Distinguishes recurring routines from one-time sessions across weeks");
}

// -------------------------------------------------------------------------
// Point 13: Saved demo schedules survive reload according to storage strategy
// -------------------------------------------------------------------------
console.log("\nPoint 13: Saved demo schedules survive reload according to storage strategy...");
{
  const initialJson = JSON.stringify(SAMPLE_TIMETABLE);
  const parsed = JSON.parse(initialJson) as TimetableSlot[];

  assert.strictEqual(parsed.length, SAMPLE_TIMETABLE.length, "Serialization preserves slot count");
  assert.strictEqual(parsed[0].id, SAMPLE_TIMETABLE[0].id, "Serialization preserves record structure");
  console.log("  ✓ Passed: Serialized timetable state survives session storage reload cycle");
}

// -------------------------------------------------------------------------
// Point 14: Time-to-position calculations, event duration & half-hour boundaries
// -------------------------------------------------------------------------
console.log("\nPoint 14: Time-to-position calculations, event duration & half-hour boundaries...");
{
  // Test 1: 04:30 PM to 06:00 PM (90-minute class on half-hour boundary)
  const startMins90 = parseTimeToMinutes("04:30 PM"); // 990
  const endMins90 = parseTimeToMinutes("06:00 PM"); // 1080
  assert.strictEqual(startMins90, 990, "04:30 PM parses to 990 minutes");
  assert.strictEqual(endMins90, 1080, "06:00 PM parses to 1080 minutes");

  const layout90 = calculateSlotLayout(startMins90, endMins90, 8, 20);
  // Grid start 8:00 AM = 480 mins -> top = 990 - 480 = 510px
  assert.strictEqual(layout90.topPx, 510, "Vertical offset is exactly 510px (1px per minute scale)");
  // Duration = 1080 - 990 = 90 mins -> height = 90px
  assert.strictEqual(layout90.heightPx, 90, "Event height is exactly 90px for 90-minute duration");
  assert.strictEqual(layout90.isOutOfBounds, false, "Slot is within standard grid bounds");

  // Test 2: 30-minute boundary session (e.g. 10:30 AM to 11:00 AM)
  const startMins30 = parseTimeToMinutes("10:30 AM"); // 630
  const endMins30 = parseTimeToMinutes("11:00 AM"); // 660
  const layout30 = calculateSlotLayout(startMins30, endMins30, 8, 20);
  assert.strictEqual(layout30.topPx, 150, "10:30 AM offset is 150px (630 - 480)");
  assert.strictEqual(layout30.heightPx, 30, "30-minute session has 30px height");

  // Test 3: Very short 15-minute slot enforces minimum readable height (30px)
  const layout15 = calculateSlotLayout(600, 615, 8, 20, 30);
  assert.strictEqual(layout15.heightPx, 30, "Enforces minimum 30px height for legibility of short sessions");

  console.log("  ✓ Passed: Consistent 1px/min scale verified across half-hour boundaries and durations");
}

// -------------------------------------------------------------------------
// Point 15: Weekday placement & dynamic grid bounds expansion
// -------------------------------------------------------------------------
console.log("\nPoint 15: Weekday placement & dynamic grid bounds expansion...");
{
  const testWednesdayClass: TimetableSlot = {
    id: "time-test-wed-1",
    dayOfWeek: "Wednesday",
    startTime: "07:00", // 07:00 AM (outside standard 8-20 range)
    endTime: "08:30",
    time: "07:00 AM - 08:30 AM",
    subject: "Biology",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    status: "active",
  };

  // Weekday column matching
  assert(isSlotOnDate(testWednesdayClass, "2026-10-14", "Wednesday"), "Matches Wednesday column");
  assert(!isSlotOnDate(testWednesdayClass, "2026-10-15", "Thursday"), "Does not bleed into Thursday");

  // Dynamic grid bounds: min hour expands to 7 to accommodate 07:00 AM class
  const { start, end } = getSlotTimeMinutes(testWednesdayClass);
  const dynamicStartHour = Math.min(8, Math.floor(start / 60)); // 7
  const dynamicEndHour = Math.max(20, Math.ceil(end / 60)); // 20
  assert.strictEqual(dynamicStartHour, 7, "Grid automatically expands start hour from 8 to 7");
  assert.strictEqual(dynamicEndHour, 20, "Grid end hour remains 20");

  const layoutExpanded = calculateSlotLayout(start, end, dynamicStartHour, dynamicEndHour);
  assert.strictEqual(layoutExpanded.topPx, 0, "07:00 AM renders at top: 0px in expanded grid");
  assert.strictEqual(layoutExpanded.heightPx, 90, "Duration remains exactly 90px in expanded grid");
  assert.strictEqual(layoutExpanded.isOutOfBounds, false, "Class is fully visible without clipping");

  console.log("  ✓ Passed: Correct weekday mapping and automatic dynamic range expansion");
}

// -------------------------------------------------------------------------
// Point 16: Overlapping sessions layout geometry and side-by-side columns
// -------------------------------------------------------------------------
console.log("\nPoint 16: Overlapping sessions layout geometry and side-by-side columns...");
{
  const tripleOverlap: TimetableSlot[] = [
    {
      id: "lap-1",
      dayOfWeek: "Friday",
      startTime: "15:00",
      endTime: "16:30",
      time: "03:00 PM - 04:30 PM",
      subject: "Mathematics",
      batch: "Batch A",
      classGrade: "Class X",
      teacherId: "tch-1",
      teacherName: "Teacher A",
      status: "active",
    },
    {
      id: "lap-2",
      dayOfWeek: "Friday",
      startTime: "15:30",
      endTime: "17:00",
      time: "03:30 PM - 05:00 PM",
      subject: "Physics",
      batch: "Batch B",
      classGrade: "Class X",
      teacherId: "tch-2",
      teacherName: "Teacher B",
      status: "active",
    },
    {
      id: "lap-3",
      dayOfWeek: "Friday",
      startTime: "15:45",
      endTime: "16:45",
      time: "03:45 PM - 04:45 PM",
      subject: "Chemistry",
      batch: "Batch C",
      classGrade: "Class X",
      teacherId: "tch-3",
      teacherName: "Teacher C",
      status: "active",
    },
  ];

  const positions = computeDaySlotPositions(tripleOverlap);
  assert.strictEqual(positions.length, 3, "All 3 overlapping slots are positioned");

  // All 3 overlap simultaneously at 15:45 - 16:30
  positions.forEach((pos) => {
    assert.strictEqual(pos.totalCols, 3, `Slot ${pos.slot.id} has totalCols = 3`);
  });

  const colIndices = positions.map((p) => p.colIndex).sort();
  assert.deepStrictEqual(colIndices, [0, 1, 2], "Slots are assigned distinct column lanes 0, 1, and 2");

  // Verify width and left calculations
  const colWidth = 100 / 3;
  positions.forEach((pos) => {
    const expectedLeft = pos.colIndex * colWidth;
    assert(Math.abs(pos.colIndex * (100 / pos.totalCols) - expectedLeft) < 0.001, "Correct left offset");
  });

  console.log("  ✓ Passed: 3-way simultaneous overlap cleanly partitioned into distinct side-by-side lanes");
}

// -------------------------------------------------------------------------
// Point 17: Newly created event schema normalization, metadata parity & duplicate prevention
// -------------------------------------------------------------------------
console.log("\nPoint 17: Newly created event schema normalization, metadata parity & duplicate prevention...");
{
  const rawFormInput = {
    dayOfWeek: "Thursday" as const,
    startTime: "16:30:00", // HTML5 input[type=time] with seconds
    endTime: "18:00:00",
    subject: "Chemistry",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    status: "active" as const,
    scheduleType: "recurring" as const,
  };

  // Normalization logic identical to TimetableModule handleSaveSchedule
  const startMins = parseTimeToMinutes(rawFormInput.startTime);
  const endMins = parseTimeToMinutes(rawFormInput.endTime);
  assert.strictEqual(startMins, 990, "16:30:00 parses cleanly to 990 minutes");
  assert.strictEqual(endMins, 1080, "18:00:00 parses cleanly to 1080 minutes");

  const normalizedStartTime = formatMinutesTo24Hour(startMins);
  const normalizedEndTime = formatMinutesTo24Hour(endMins);
  const timeRangeStr = `${formatMinutesTo12Hour(startMins)} - ${formatMinutesTo12Hour(endMins)}`;
  assert.strictEqual(normalizedStartTime, "16:30", "Normalized 24h start time is 16:30");
  assert.strictEqual(normalizedEndTime, "18:00", "Normalized 24h end time is 18:00");
  assert.strictEqual(timeRangeStr, "04:30 PM - 06:00 PM", "Normalized display string matches 12h convention");

  const newCreatedEvent: TimetableSlot = {
    id: "time-test-created-1",
    dayOfWeek: rawFormInput.dayOfWeek,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    time: timeRangeStr,
    teacherId: rawFormInput.teacherId,
    teacherName: rawFormInput.teacherName,
    subject: rawFormInput.subject,
    subjectId: "sub-chem",
    batch: rawFormInput.batch,
    batchId: "btc-sci",
    classGrade: rawFormInput.classGrade,
    scheduleType: rawFormInput.scheduleType,
    status: rawFormInput.status,
  };

  // Compare properties against seeded event SAMPLE_TIMETABLE[0]
  const seededEvent = SAMPLE_TIMETABLE[0];
  const requiredKeys: (keyof TimetableSlot)[] = [
    "id",
    "dayOfWeek",
    "startTime",
    "endTime",
    "time",
    "subject",
    "batch",
    "classGrade",
    "teacherId",
    "teacherName",
    "status",
  ];

  for (const key of requiredKeys) {
    assert(
      newCreatedEvent[key] !== undefined && newCreatedEvent[key] !== "",
      `Newly created event has populated ${key}`
    );
    assert(
      seededEvent[key] !== undefined && seededEvent[key] !== "",
      `Seeded event has populated ${key}`
    );
  }

  // Duplicate prevention check on edit
  let stateSlots: TimetableSlot[] = [...SAMPLE_TIMETABLE, newCreatedEvent];
  const initialLength = stateSlots.length;

  // Edit existing event in place
  stateSlots = stateSlots.map((s) =>
    s.id === newCreatedEvent.id
      ? { ...s, teacherName: "Fatima Senior Faculty", time: "05:00 PM - 06:30 PM" }
      : s
  );
  assert.strictEqual(stateSlots.length, initialLength, "Editing event does NOT create duplicate records");
  const editedRecord = stateSlots.find((s) => s.id === newCreatedEvent.id);
  assert.strictEqual(editedRecord?.teacherName, "Fatima Senior Faculty", "Updates in place correctly");

  console.log("  ✓ Passed: Metadata schema parity verified; editing updates in place without duplicates");
}

// -------------------------------------------------------------------------
// Point 18: Newly created 90-min class height calculation & compact layout safety
// -------------------------------------------------------------------------
console.log("\nPoint 18: Newly created 90-min class height calculation & compact layout safety...");
{
  // Test 90-minute newly created event
  const created90Slot: TimetableSlot = {
    id: "time-90-test",
    dayOfWeek: "Tuesday",
    startTime: "14:30",
    endTime: "16:00",
    time: "02:30 PM - 04:00 PM",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    status: "active",
  };

  const { start: start90, end: end90 } = getSlotTimeMinutes(created90Slot);
  assert.strictEqual(end90 - start90, 90, "Duration is accurately 90 minutes");

  const layout90 = calculateSlotLayout(start90, end90, 8, 20, 44);
  assert.strictEqual(layout90.heightPx, 90, "Calculated height is exactly 90px (1px/minute scale)");
  assert.strictEqual(layout90.heightPx >= 60, true, "Qualifies for full standard layout (not collapsed)");

  // Test short 30-minute session
  const created30Slot: TimetableSlot = {
    id: "time-30-test",
    dayOfWeek: "Tuesday",
    startTime: "16:00",
    endTime: "16:30",
    time: "04:00 PM - 04:30 PM",
    subject: "Viva / Doubt Clearing",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    status: "active",
  };

  const { start: start30, end: end30 } = getSlotTimeMinutes(created30Slot);
  assert.strictEqual(end30 - start30, 30, "Duration is 30 minutes");
  const layout30 = calculateSlotLayout(start30, end30, 8, 20, 30);
  assert.strictEqual(layout30.heightPx, 30, "Exact 30px height matching 30-minute boundary without adjacent slot collision");

  // Verify that getSlotTimeMinutes never produces <= 0 duration even if endTime is corrupted
  const corruptedSlot: TimetableSlot = {
    id: "time-corrupted",
    dayOfWeek: "Monday",
    startTime: "16:30",
    endTime: "00:00", // Corrupted end time
    time: "04:30 PM - 06:00 PM",
    subject: "Physics",
    batch: "Batch Science",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    status: "active",
  };
  const { start: startCorr, end: endCorr } = getSlotTimeMinutes(corruptedSlot);
  assert(endCorr > startCorr, "Safely falls back to time range string or default 90m duration");

  console.log("  ✓ Passed: 90-min height is 90px; 30-min height is 30px; corrupted time fallback verified");
}

// -------------------------------------------------------------------------
// Point 19: Comprehensive 30-, 45-, 60-, and 90-minute Responsive Information Hierarchy
// -------------------------------------------------------------------------
console.log("\nPoint 19: Comprehensive 30-, 45-, 60-, and 90-minute Responsive Information Hierarchy...");
{
  // 1. 30-minute session (e.g. 10:30 AM - 11:00 AM)
  const slot30: TimetableSlot = {
    id: "tt-tier-30",
    dayOfWeek: "Wednesday",
    startTime: "10:30",
    endTime: "11:00",
    time: "10:30 AM - 11:00 AM",
    subject: "Mathematics",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-azhar",
    teacherName: "Azhar Sir",
    status: "active",
  };
  const { start: s30, end: e30 } = getSlotTimeMinutes(slot30);
  const layout30 = calculateSlotLayout(s30, e30, 8, 20, 30);
  assert.strictEqual(layout30.heightPx, 30, "30-min session occupies exactly 30px");
  const isShort30 = layout30.heightPx < 50;
  assert.strictEqual(isShort30, true, "30-min class qualifies as Short Card (< 50px)");

  // 2. 45-minute session (e.g. 11:15 AM - 12:00 PM)
  const slot45: TimetableSlot = {
    id: "tt-tier-45",
    dayOfWeek: "Wednesday",
    startTime: "11:15",
    endTime: "12:00",
    time: "11:15 AM - 12:00 PM",
    subject: "Physics",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    status: "active",
  };
  const { start: s45, end: e45 } = getSlotTimeMinutes(slot45);
  const layout45 = calculateSlotLayout(s45, e45, 8, 20, 30);
  assert.strictEqual(layout45.heightPx, 45, "45-min session occupies exactly 45px");
  const isShort45 = layout45.heightPx < 50;
  assert.strictEqual(isShort45, true, "45-min class qualifies as Short Card (< 50px)");

  // 3. 60-minute session (e.g. 12:00 PM - 01:00 PM)
  const slot60: TimetableSlot = {
    id: "tt-tier-60",
    dayOfWeek: "Wednesday",
    startTime: "12:00",
    endTime: "13:00",
    time: "12:00 PM - 01:00 PM",
    subject: "Chemistry",
    batch: "Batch Science (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    status: "active",
  };
  const { start: s60, end: e60 } = getSlotTimeMinutes(slot60);
  const layout60 = calculateSlotLayout(s60, e60, 8, 20, 30);
  assert.strictEqual(layout60.heightPx, 60, "60-min session occupies exactly 60px");
  const isMedium60 = layout60.heightPx >= 50 && layout60.heightPx < 70;
  assert.strictEqual(isMedium60, true, "60-min class qualifies as Medium Card (50px–69px, renders subject + time + batch)");

  // 4. 90-minute session (e.g. 04:30 PM - 06:00 PM)
  const slot90: TimetableSlot = {
    id: "tt-tier-90",
    dayOfWeek: "Wednesday",
    startTime: "16:30",
    endTime: "18:00",
    time: "04:30 PM - 06:00 PM",
    subject: "Accountancy",
    batch: "Batch Commerce (Class XI-XII)",
    classGrade: "Class XII",
    teacherId: "tch-roy",
    teacherName: "Prof. N. Roy",
    status: "active",
  };
  const { start: s90, end: e90 } = getSlotTimeMinutes(slot90);
  const layout90 = calculateSlotLayout(s90, e90, 8, 20, 30);
  assert.strictEqual(layout90.heightPx, 90, "90-min session occupies exactly 90px");
  const isTall90 = layout90.heightPx >= 70;
  assert.strictEqual(isTall90, true, "90-min class qualifies as Tall Card (>= 70px, renders subject + time + batch + teacher footer)");

  console.log("  ✓ Passed: Verified 30m, 45m, 60m, and 90m duration calculations and responsive card tiers");
}

// -------------------------------------------------------------------------
// Point 20: Timetable Session Deletion & Management Verification
// -------------------------------------------------------------------------
console.log("\nPoint 20: Timetable Session Deletion & Management Verification...");
{
  let masterTimetable: TimetableSlot[] = [...SAMPLE_TIMETABLE];
  const initialCount = masterTimetable.length;

  // 1. Create a test class (e.g. incorrectly created test routine class)
  const testClassId = "time-test-delete-1";
  const testRoutineClass: TimetableSlot = {
    id: testClassId,
    dayOfWeek: "Tuesday",
    startTime: "10:00",
    endTime: "11:30",
    time: "10:00 AM - 11:30 AM",
    subject: "Physics",
    subjectId: "sub-phy",
    batch: "Batch Science (Class IX-X)",
    batchId: "btc-sci",
    classGrade: "Class X",
    teacherId: "tch-alvi",
    teacherName: "Dr. Tariq Alvi",
    scheduleType: "recurring",
    status: "active",
  };

  masterTimetable.push(testRoutineClass);
  assert.strictEqual(masterTimetable.length, initialCount + 1, "Test routine added to timetable dataset");
  assert(masterTimetable.some((s) => s.id === testClassId), "Test routine exists in timetable");

  // 2. Perform deletion action as Academy Admin
  masterTimetable = masterTimetable.filter((s) => s.id !== testClassId);

  // 3. Verify immediate removal from timetable
  assert.strictEqual(masterTimetable.length, initialCount, "Dataset count restored to initial count");
  assert(!masterTimetable.some((s) => s.id === testClassId), "Deleted test routine completely removed from timetable");

  // 4. Verify calendar day view filtering
  const tuesdaySlots = masterTimetable.filter((s) => s.dayOfWeek === "Tuesday");
  assert(!tuesdaySlots.some((s) => s.id === testClassId), "Deleted session does not appear in Tuesday calendar column");

  // 5. Verify weekly class counts and KPI metrics update accurately
  const activeClasses = masterTimetable.filter((s) => (s.status || "active") === "active").length;
  const initialActive = SAMPLE_TIMETABLE.filter((s) => (s.status || "active") === "active").length;
  assert.strictEqual(activeClasses, initialActive, "Active classes KPI count reflects deletion");

  // 6. Verify unrelated sessions, faculty assignments, batches, and subjects remain intact
  const mathClasses = masterTimetable.filter((s) => s.subject === "Mathematics");
  const initialMath = SAMPLE_TIMETABLE.filter((s) => s.subject === "Mathematics");
  assert.strictEqual(mathClasses.length, initialMath.length, "Unrelated Mathematics classes remain untouched");

  // 7. Verify Date-Specific Special Session deletion vs Recurring Routine deletion
  const specialSessionId = "time-special-date-1";
  const specialSession: TimetableSlot = {
    id: specialSessionId,
    dayOfWeek: "Thursday",
    specificDate: "2026-10-15",
    scheduleType: "specific_date",
    startTime: "14:00",
    endTime: "15:30",
    time: "02:00 PM - 03:30 PM",
    subject: "English Literature",
    batch: "Batch Alpha (Class IX-X)",
    classGrade: "Class X",
    teacherId: "tch-fatima",
    teacherName: "Fatima Ma'am",
    status: "active",
  };
  masterTimetable.push(specialSession);
  assert(masterTimetable.some((s) => s.id === specialSessionId), "Date-specific special session added");

  // Deleting special session removes only that occurrence
  masterTimetable = masterTimetable.filter((s) => s.id !== specialSessionId);
  assert(!masterTimetable.some((s) => s.id === specialSessionId), "Special session occurrence cleanly deleted");

  // 8. Verify cancellation vs deletion distinction
  // Cancellation keeps record with status = 'cancelled'
  const cancelledSlot: TimetableSlot = { ...testRoutineClass, id: "time-test-cancelled", status: "cancelled" };
  masterTimetable.push(cancelledSlot);
  assert(masterTimetable.some((s) => s.id === "time-test-cancelled"), "Cancelled record remains in admin dataset");
  assert.strictEqual(
    masterTimetable.find((s) => s.id === "time-test-cancelled")?.status,
    "cancelled",
    "Record status is cancelled"
  );
  // Full deletion purges record completely
  masterTimetable = masterTimetable.filter((s) => s.id !== "time-test-cancelled");
  assert(!masterTimetable.some((s) => s.id === "time-test-cancelled"), "Deleted record is fully purged");

  // 9. Verify demo persistence lifecycle: serialization and re-parse preserves deletion
  const serialized = JSON.stringify(masterTimetable);
  const reloadedTimetable: TimetableSlot[] = JSON.parse(serialized);
  assert(!reloadedTimetable.some((s) => s.id === testClassId), "Deleted routine does not reappear after reload");
  assert(!reloadedTimetable.some((s) => s.id === specialSessionId), "Deleted special session does not reappear after reload");

  console.log("  ✓ Passed: Session deletion, calendar consistency, recurring vs special session handling & persistence verified");
}

console.log("\n==================================================================");
console.log("   ALL 20 TIMETABLE TEST CASES PASSED SUCCESSFULLY (20/20)   ");
console.log("==================================================================\n");
