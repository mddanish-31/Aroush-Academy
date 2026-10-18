import fs from "node:fs";
import path from "node:path";
import { MEDIA } from "../src/content/media";
import type { MediaItem } from "../src/content/types";

let failed = false;

function error(msg: string) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

function success(msg: string) {
  console.log(`PASS: ${msg}`);
}

const allMedia: MediaItem[] = [
  ...MEDIA.heroGallery,
  ...MEDIA.campus,
  ...Object.values(MEDIA.courses),
  MEDIA.og,
];

const ids = new Set<string>();
for (const item of allMedia) {
  if (!item.id || item.id.trim() === "") {
    error(`MediaItem has empty id: ${JSON.stringify(item)}`);
  } else if (ids.has(item.id)) {
    error(`Duplicate MediaItem id: ${item.id}`);
  } else {
    ids.add(item.id);
  }

  if (!item.alt || item.alt.trim() === "") {
    error(`MediaItem ${item.id} has empty alt text`);
  }

  if (!item.url || !item.url.startsWith("https://images.unsplash.com/")) {
    error(`MediaItem ${item.id} URL is not on https://images.unsplash.com/: ${item.url}`);
  }

  if (item.isStock !== true) {
    error(`MediaItem ${item.id} isStock must be true`);
  }
}
success(`All ${allMedia.length} MediaItems have valid IDs, non-empty honest alt, Unsplash HTTPS URLs, and isStock: true.`);

const emDash = "\u2014";
const enDash = "\u2013";
const emojiRegex = /\p{Extended_Pictographic}/u;

const scanDirs = [
  path.resolve(process.cwd(), "src/content"),
  path.resolve(process.cwd(), "src/components/landing"),
  path.resolve(process.cwd(), "src/components/common"),
  path.resolve(process.cwd(), "src/app"),
];

function scanFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
  const results: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".css"))) {
      results.push(path.join(entry.parentPath || dir, entry.name));
    }
  }
  return results;
}

let dashEmojiClean = true;
let replaceMeClean = true;
const legalFile = path.resolve(process.cwd(), "src/content/legal.ts");

for (const dir of scanDirs) {
  const files = scanFiles(dir);
  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      if (line.includes(emDash)) {
        error(`Em dash found in ${relative}:${idx + 1} -> ${line.trim()}`);
        dashEmojiClean = false;
      }
      if (line.includes(enDash)) {
        error(`En dash found in ${relative}:${idx + 1} -> ${line.trim()}`);
        dashEmojiClean = false;
      }
      if (emojiRegex.test(line)) {
        error(`Emoji found in ${relative}:${idx + 1} -> ${line.trim()}`);
        dashEmojiClean = false;
      }
      if (line.includes("REPLACE_ME") && path.resolve(file) !== legalFile) {
        error(`REPLACE_ME found outside src/content/legal.ts in ${relative}:${idx + 1}`);
        replaceMeClean = false;
      }
    });
  }
}

if (dashEmojiClean) {
  success("Zero em dash, zero en dash, zero emojis across src/content, src/components/landing, src/components/common, and src/app.");
}

const legalContent = fs.readFileSync(legalFile, "utf8");
const replaceMeMatches = (legalContent.match(/REPLACE_ME/g) || []).length;
if (replaceMeMatches > 0 && replaceMeClean) {
  success(`Found ${replaceMeMatches} documented REPLACE_ME occurrences in src/content/legal.ts, and zero outside.`);
} else if (replaceMeMatches === 0) {
  error("Expected REPLACE_ME occurrences in src/content/legal.ts, but found none.");
}

if (failed) {
  process.exit(1);
} else {
  console.log("All content verification checks passed successfully!");
}
