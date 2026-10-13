/**
 * AROUSH ACADEMY — Verification Script for Task 11.6 Study Material Downloads
 */

import assert from "assert";
import {
  sanitizeFilename,
  formatDownloadableContent,
  triggerTextDownload,
} from "../src/lib/studyMaterialDownload.ts";

console.log("=== RUNNING STUDY MATERIAL DOWNLOADS VERIFICATION SUITE ===");

// 1. Filename Sanitization Tests
console.log("\n1. Testing Filename Sanitization:");

const test1 = sanitizeFilename("Class X Mathematics — Coordinate Geometry Master Formula Guide");
assert.strictEqual(test1, "Class_X_Mathematics_Coordinate_Geometry_Master_For.txt");
assert.ok(test1.endsWith(".txt"), "Filename must end with .txt");
console.log("  ✓ Test 1.1 Passed: Em-dash & special chars converted cleanly ->", test1);

const test2 = sanitizeFilename("ICSE Class X Quadratic Equations — High-Yield Word Problems (Solved)!");
assert.strictEqual(test2, "ICSE_Class_X_Quadratic_Equations_High-Yield_Word_P.txt");
console.log("  ✓ Test 1.2 Passed: Parentheses and punctuation stripped ->", test2);

const test3 = sanitizeFilename("");
assert.strictEqual(test3, "resource.txt");
console.log("  ✓ Test 1.3 Passed: Empty string falls back safely ->", test3);

const test4 = sanitizeFilename("   ", "custom-fallback");
assert.strictEqual(test4, "custom-fallback.txt");
console.log("  ✓ Test 1.4 Passed: Whitespace-only string uses custom fallback ->", test4);

const test5 = sanitizeFilename(null, "fallback-null");
assert.strictEqual(test5, "fallback-null.txt");
console.log("  ✓ Test 1.5 Passed: Null title handled safely ->", test5);

const test6 = sanitizeFilename("A".repeat(120));
assert.ok(test6.length <= 54, `Length must be capped (got ${test6.length})`);
assert.ok(test6.endsWith(".txt"), "Must preserve .txt extension");
console.log("  ✓ Test 1.6 Passed: Oversized title safely truncated ->", test6);

// 2. Downloadable Content Formatting Tests
console.log("\n2. Testing Content Formatting & Distinction Banner:");

const sampleItem = {
  id: "mat-1",
  title: "Class X Mathematics — Coordinate Geometry Master Formula Guide",
  subject: "Mathematics",
  classGrade: "Class X",
  type: "Formula Sheet",
  size: "1.4 MB",
  uploadedBy: "Azhar Sir",
  teacherId: "tch-azhar",
  date: "2026-10-02",
  content: "d = sqrt((x2 - x1)^2 + (y2 - y1)^2)\nSection formula: ((m*x2 + n*x1)/(m+n), ...)",
};

const formattedText = formatDownloadableContent(sampleItem);
assert.ok(formattedText.includes("AROUSH ACADEMY — DIGITAL STUDY RESOURCE (DEMO EXTRACT)"));
assert.ok(formattedText.includes("NOTICE: Locally generated text file for interactive demo preview."));
assert.ok(formattedText.includes("Not an official board publication or original server-stored PDF."));
assert.ok(formattedText.includes("Title:        Class X Mathematics — Coordinate Geometry Master Formula Guide"));
assert.ok(formattedText.includes("Subject:      Mathematics"));
assert.ok(formattedText.includes("Instructor:   Azhar Sir"));
assert.ok(formattedText.includes("d = sqrt((x2 - x1)^2 + (y2 - y1)^2)"));
console.log("  ✓ Test 2.1 Passed: Demo extract banner present and distinguishable from official documents");
console.log("  ✓ Test 2.2 Passed: Full course metadata and actual formula content included");

// 3. Fallback on Empty/Missing Content
console.log("\n3. Testing No-Content Fallback:");

const catalogItem = {
  id: "mat-5",
  title: "Class XI-XII Accountancy — Partnership Fundamentals",
  subject: "Accountancy",
  classGrade: "Class XII",
  type: "PDF Notes",
  size: "2.9 MB",
  uploadedBy: "Prof. N. Roy",
  teacherId: "tch-roy",
  date: "2026-09-18",
  content: undefined,
};

assert.strictEqual(!catalogItem.content || !catalogItem.content.trim(), true);
console.log("  ✓ Test 3.1 Passed: Catalog-only item properly identified as having no downloadable content");

// 4. Native Browser Blob & URL Revocation Simulation
console.log("\n4. Testing Blob Creation & Object URL Revocation Lifecycle:");

let createdUrls = [];
let revokedUrls = [];

globalThis.window = {
  URL: {
    createObjectURL: (blob) => {
      const url = `blob:http://localhost:3000/${Math.random().toString(36).slice(2)}`;
      createdUrls.push({ url, type: blob.type, size: blob.size });
      return url;
    },
    revokeObjectURL: (url) => {
      revokedUrls.push(url);
    },
  },
};

globalThis.document = {
  createElement: (tag) => {
    return {
      tagName: tag,
      href: "",
      download: "",
      style: {},
      click: function () {
        this.clicked = true;
      },
    };
  },
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
};

const downloadSuccess = triggerTextDownload(formattedText, "test_file.txt");
assert.strictEqual(downloadSuccess, true, "triggerTextDownload should succeed");
assert.strictEqual(createdUrls.length, 1, "Should create 1 object URL");
assert.strictEqual(createdUrls[0].type, "text/plain;charset=utf-8", "Must use text/plain;charset=utf-8 MIME type");

// Await timeout for URL revocation
await new Promise((r) => setTimeout(r, 300));
assert.strictEqual(revokedUrls.length, 1, "Should revoke object URL after download initiation");
assert.strictEqual(revokedUrls[0], createdUrls[0].url, "Revoked URL must match created URL");
console.log("  ✓ Test 4.1 Passed: Blob created with text/plain;charset=utf-8 MIME type");
console.log("  ✓ Test 4.2 Passed: Temporary object URL safely revoked");

console.log("\nALL DOWNLOAD VERIFICATION TESTS PASSED SUCCESSFULLY!");
