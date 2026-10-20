import { MEDIA } from "../src/content/media";
import type { MediaItem } from "../src/content/types";

const items: MediaItem[] = [
  ...MEDIA.heroGallery,
  ...MEDIA.campus,
  ...Object.values(MEDIA.courses),
  MEDIA.og,
];

console.log(`=== Verifying Unsplash Media & Video Poster URLs (HEAD Request) ===`);

async function verifyUrl(url: string, label: string): Promise<boolean> {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent": "AroushAcademyVerification/1.0",
        },
      });

      if (res.status === 200) {
        console.log(`[PASS 200 OK] ${label} -> ${url.slice(0, 70)}...`);
        return true;
      } else {
        if (attempt === maxRetries) {
          console.error(`[FAIL ${res.status}] ${label} -> ${url}`);
          return false;
        }
      }
    } catch (err: unknown) {
      if (attempt === maxRetries) {
        console.error(`[FAIL] ${label} -> network unavailable (${err instanceof Error ? err.message : String(err)})`);
        return false;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return false;
}

async function run() {
  let failed = false;
  let count = 0;

  for (const item of items) {
    count++;
    const ok = await verifyUrl(item.url, `${item.id} [url]`);
    if (!ok) failed = true;

    if (item.posterUrl) {
      count++;
      const posterOk = await verifyUrl(item.posterUrl, `${item.id} [posterUrl]`);
      if (!posterOk) failed = true;
    }
  }

  if (failed) {
    console.error(`Media URL verification failed: One or more of ${count} URLs did not return HTTP 200.`);
    process.exit(1);
  } else {
    console.log(`All ${count} media & poster URLs verified successfully with HTTP 200 OK!`);
  }
}

run();
