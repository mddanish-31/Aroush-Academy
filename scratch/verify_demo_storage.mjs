/**
 * AROUSH ACADEMY — Verification Script for Task 11.4 Demo Storage Persistence
 */

import assert from "assert";

// Mock browser window and sessionStorage environment for Node.js
class MockSessionStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  sessionStorage: new MockSessionStorage(),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// Import compiled or direct demoStorage
const {
  DEMO_STORAGE_KEYS,
  getDemoStorage,
  setDemoStorage,
  removeDemoStorage,
  clearAllDemoStorage,
  isDemoStorageAvailable,
} = await import("../src/lib/demoStorage.js").catch(async () => {
  // If importing ts file directly via experimental-strip-types / ts-node or transpiled
  return await import("../src/lib/demoStorage.ts");
});

console.log("=== RUNNING DEMO STORAGE PERSISTENCE SUITE ===");

// 1. Availability Test
assert.strictEqual(isDemoStorageAvailable(), true, "sessionStorage should be detected as available");
console.log("✓ Test 1 Passed: Storage availability check succeeded");

// 2. Fallback on Empty Key Test
const fallbackPayments = [{ id: "tx-sample", amount: 1200 }];
const retrievedEmpty = getDemoStorage(DEMO_STORAGE_KEYS.PAYMENTS, fallbackPayments);
assert.deepStrictEqual(retrievedEmpty, fallbackPayments, "Should return fallback when key is not present in storage");
console.log("✓ Test 2 Passed: Safe fallback on empty storage key verified");

// 3. Storage Persistence Test
const updatedPayments = [
  { id: "tx-new-101", amount: 2500, studentId: "std-101", paymentMethod: "cash", notes: "Monthly fee" },
  ...fallbackPayments,
];
const writeResult = setDemoStorage(DEMO_STORAGE_KEYS.PAYMENTS, updatedPayments);
assert.strictEqual(writeResult, true, "setDemoStorage should succeed");

const retrievedFromStorage = getDemoStorage(DEMO_STORAGE_KEYS.PAYMENTS, fallbackPayments);
assert.deepStrictEqual(retrievedFromStorage, updatedPayments, "Retrieved data should match mutated payment list");
assert.strictEqual(retrievedFromStorage.length, 2, "Should contain 2 transactions");
console.log("✓ Test 3 Passed: Payment mutation persistence verified");

// 4. Role Switch Simulation (Simulate Module A writing -> Module B reading from memoryCache / storage)
const teacherClassTests = [
  {
    id: "test-physics-1",
    examName: "Ray Optics Unit Test",
    subject: "Physics",
    maxMarks: 50,
    studentScores: [
      { studentId: "std-101", studentName: "Taha Rahman", marksObtained: 46, status: "evaluated" }
    ]
  }
];
setDemoStorage(DEMO_STORAGE_KEYS.ASSESSMENTS, teacherClassTests);

// Student Module mounts in Student role and reads assessments
const studentViewAssessments = getDemoStorage(DEMO_STORAGE_KEYS.ASSESSMENTS, []);
assert.strictEqual(studentViewAssessments.length, 1);
assert.strictEqual(studentViewAssessments[0].studentScores[0].marksObtained, 46);
console.log("✓ Test 4 Passed: Cross-role visibility simulation (Teacher marks -> Student view) verified");

// 5. Batch Creation Persistence Test (Admin creates batch -> visible in storage)
const adminBatches = [
  { id: "btc-new-1", name: "Batch Delta (Class XI Olympiad)", subject: "Mathematics", capacity: 25 }
];
setDemoStorage(DEMO_STORAGE_KEYS.BATCHES, adminBatches);
const retrievedBatches = getDemoStorage(DEMO_STORAGE_KEYS.BATCHES, []);
assert.strictEqual(retrievedBatches[0].name, "Batch Delta (Class XI Olympiad)");
console.log("✓ Test 5 Passed: Admin batch creation persistence verified");

// 6. Malformed JSON Resilience Test
window.sessionStorage.setItem(DEMO_STORAGE_KEYS.NOTICES, "{ corrupted: json - invalid !! }");
// Clear memoryCache for this key to force reading from sessionStorage
removeDemoStorage(DEMO_STORAGE_KEYS.NOTICES);
const defaultNotices = [{ id: "not-1", title: "Welcome Notice" }];
const retrievedAfterCorruption = getDemoStorage(DEMO_STORAGE_KEYS.NOTICES, defaultNotices);
assert.deepStrictEqual(retrievedAfterCorruption, defaultNotices, "Should fall back gracefully without crashing when JSON is corrupted");
console.log("✓ Test 6 Passed: Malformed JSON resilience verified");

// 7. Structural Type Guard Test (Array expected, but object stored)
window.sessionStorage.setItem(DEMO_STORAGE_KEYS.ATTENDANCE, JSON.stringify({ malicious: "not an array" }));
removeDemoStorage(DEMO_STORAGE_KEYS.ATTENDANCE);
const defaultAttendance = [{ id: "att-1", studentId: "std-101", status: "present" }];
const retrievedWrongStructure = getDemoStorage(DEMO_STORAGE_KEYS.ATTENDANCE, defaultAttendance);
assert.deepStrictEqual(retrievedWrongStructure, defaultAttendance, "Should reject non-array payload when array fallback is expected");
console.log("✓ Test 7 Passed: Structural type guard test verified");

// 8. Storage Clear / Reset Test
clearAllDemoStorage();
assert.deepStrictEqual(getDemoStorage(DEMO_STORAGE_KEYS.PAYMENTS, fallbackPayments), fallbackPayments);
assert.deepStrictEqual(getDemoStorage(DEMO_STORAGE_KEYS.ASSESSMENTS, []), []);
console.log("✓ Test 8 Passed: Demo storage reset verified");

// 9. Sensitive Information Audit
const storedPayloads = Object.values(window.sessionStorage.store);
for (const p of storedPayloads) {
  assert.strictEqual(p.includes("password"), false, "Passwords must never be present in demo storage");
  assert.strictEqual(p.includes("secret"), false, "Secrets must never be present in demo storage");
  assert.strictEqual(p.includes("token"), false, "Tokens must never be present in demo storage");
}
console.log("✓ Test 9 Passed: Zero sensitive credentials in storage verified");

console.log("\nALL 9 DEMO PERSISTENCE TESTS PASSED CLEANLY!");
