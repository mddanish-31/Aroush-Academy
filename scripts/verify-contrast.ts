import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function srgbLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = srgbLuminance(...rgb1);
  const l2 = srgbLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const cssPath = resolve(process.cwd(), "src/app/globals.css");
const cssContent = readFileSync(cssPath, "utf-8");

function extractToken(varName: string): string {
  const regex = new RegExp(`${varName}:\\s*([^;]+);`);
  const match = cssContent.match(regex);
  if (!match) {
    throw new Error(`Token ${varName} not found in globals.css`);
  }
  return match[1].trim();
}

const bgHex = extractToken("--color-page-bg");
const textHex = extractToken("--color-text");
const accentHex = extractToken("--color-accent-blue");
const btnBgHex = extractToken("--btn-primary-bg");
const btnTextHex = extractToken("--btn-primary-text");
const surfaceHex = extractToken("--color-surface");

const cBg = parseHex(bgHex);
const cText = parseHex(textHex);
const cAccent = parseHex(accentHex);
const cBtnBg = parseHex(btnBgHex);
const cBtnText = parseHex(btnTextHex);
const cSurface = parseHex(surfaceHex);

const alpha = 0.72;
const cSecondaryOnBg: [number, number, number] = [
  Math.round(cText[0] * alpha + cBg[0] * (1 - alpha)),
  Math.round(cText[1] * alpha + cBg[1] * (1 - alpha)),
  Math.round(cText[2] * alpha + cBg[2] * (1 - alpha)),
];

const cSecondaryOnSurface: [number, number, number] = [
  Math.round(cText[0] * alpha + cSurface[0] * (1 - alpha)),
  Math.round(cText[1] * alpha + cSurface[1] * (1 - alpha)),
  Math.round(cText[2] * alpha + cSurface[2] * (1 - alpha)),
];

const textPairs = [
  { name: `Primary text (${textHex}) on page background (${bgHex})`, fg: cText, bg: cBg, min: 4.5 },
  { name: `Primary text (${textHex}) on surface (${surfaceHex})`, fg: cText, bg: cSurface, min: 4.5 },
  { name: `Button text (${btnTextHex}) on primary button (${btnBgHex})`, fg: cBtnText, bg: cBtnBg, min: 4.5 },
  { name: `Secondary text (72% ${textHex}) on page background (${bgHex})`, fg: cSecondaryOnBg, bg: cBg, min: 4.5 },
  { name: `Secondary text (72% ${textHex}) on surface (${surfaceHex})`, fg: cSecondaryOnSurface, bg: cSurface, min: 4.5 },
];

const nonTextPairs = [
  { name: `Accent (${accentHex}) on surface (${surfaceHex}) [non-text UI]`, fg: cAccent, bg: cSurface, min: 3.0 },
  { name: `Accent (${accentHex}) on page background (${bgHex}) [non-text UI]`, fg: cAccent, bg: cBg, min: 3.0 },
];

let failed = false;
console.log("=== WCAG Contrast Ratio Verification (Tokens from globals.css) ===");

console.log("\n--- Body and UI Text (Threshold >= 4.5:1) ---");
for (const pair of textPairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const passed = ratio >= pair.min;
  const status = passed ? "PASS" : "FAIL";
  console.log(`[${status}] ${pair.name}: ${ratio.toFixed(2)}:1 (Min ${pair.min}:1)`);
  if (!passed) failed = true;
}

console.log("\n--- Non-Text UI and Accents (Threshold >= 3.0:1) ---");
for (const pair of nonTextPairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const passed = ratio >= pair.min;
  const status = passed ? "PASS" : "FAIL";
  console.log(`[${status}] ${pair.name}: ${ratio.toFixed(2)}:1 (Min ${pair.min}:1)`);
  if (!passed) failed = true;
}

if (failed) {
  console.error("\nOne or more color pairs failed WCAG contrast thresholds.");
  process.exit(1);
} else {
  console.log("\nAll CSS token pairs meet or exceed their required WCAG contrast thresholds!");
}
