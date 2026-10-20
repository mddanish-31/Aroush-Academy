import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve(process.cwd(), "qa-output/regression");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const ROLES = ["academy-admin", "teacher", "student", "parent"];

async function main() {
  console.log("=== Dashboard Regression Visual Comparison (Port 3002 Baseline vs Port 3001 Current) ===");

  const browser = await chromium.launch({ headless: true });
  const results = {};

  try {
    for (const role of ROLES) {
      console.log(`\nEvaluating role: ${role}`);

      const baselineCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await baselineCtx.addInitScript(() => {
        window.localStorage.setItem(
          "aroushh_cookie_preferences_v1",
          JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, consented: true })
        );
      });
      const baselinePage = await baselineCtx.newPage();
      await baselinePage.goto(`http://localhost:3002/dashboard?role=${role}`, { waitUntil: "domcontentloaded" });
      await baselinePage.waitForTimeout(800);
      const baselinePath = path.join(outputDir, `dashboard-baseline-${role}-1440x900.png`);
      await baselinePage.screenshot({ path: baselinePath });
      await baselinePage.close();
      await baselineCtx.close();

      const currentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await currentCtx.addInitScript(() => {
        window.localStorage.setItem(
          "aroushh_cookie_preferences_v1",
          JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, consented: true })
        );
      });
      const currentPage = await currentCtx.newPage();
      await currentPage.goto(`http://localhost:3001/dashboard?role=${role}`, { waitUntil: "domcontentloaded" });
      await currentPage.waitForTimeout(800);
      const currentPath = path.join(outputDir, `dashboard-current-${role}-1440x900.png`);
      await currentPage.screenshot({ path: currentPath });
      await currentPage.close();
      await currentCtx.close();

      const baseRaw = await sharp(baselinePath).raw().toBuffer({ resolveWithObject: true });
      const currRaw = await sharp(currentPath).raw().toBuffer({ resolveWithObject: true });

      const width = baseRaw.info.width;
      const height = baseRaw.info.height;
      const channels = baseRaw.info.channels;
      const totalPixels = width * height;

      let diffPixels = 0;
      const diffBuffer = Buffer.alloc(totalPixels * 4);

      for (let i = 0; i < totalPixels; i++) {
        const offset = i * channels;
        const outOffset = i * 4;
        let isDiff = false;
        for (let c = 0; c < 3; c++) {
          if (Math.abs(baseRaw.data[offset + c] - currRaw.data[offset + c]) > 5) {
            isDiff = true;
            break;
          }
        }
        if (isDiff) {
          diffPixels++;
          diffBuffer[outOffset] = 255;
          diffBuffer[outOffset + 1] = 0;
          diffBuffer[outOffset + 2] = 0;
          diffBuffer[outOffset + 3] = 255;
        } else {
          diffBuffer[outOffset] = currRaw.data[offset];
          diffBuffer[outOffset + 1] = currRaw.data[offset + 1];
          diffBuffer[outOffset + 2] = currRaw.data[offset + 2];
          diffBuffer[outOffset + 3] = 40;
        }
      }

      const diffPercentage = (diffPixels / totalPixels) * 100;
      results[role] = {
        totalPixels,
        diffPixels,
        diffPercentage: Number(diffPercentage.toFixed(4)),
        baselineScreenshot: baselinePath,
        currentScreenshot: currentPath,
      };

      if (diffPixels > 0) {
        const diffPath = path.join(outputDir, `dashboard-diff-${role}-1440x900.png`);
        await sharp(diffBuffer, { raw: { width, height, channels: 4 } }).png().toFile(diffPath);
        results[role].diffScreenshot = diffPath;
      }

      console.log(`Role ${role}: ${diffPixels} / ${totalPixels} pixels differing (${diffPercentage.toFixed(4)}% diff)`);
    }

    console.log("\n=== Summary Results ===");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main();
