import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const QA_URL = process.env.QA_URL || "http://localhost:3000";
const outputDir = path.resolve(process.cwd(), "qa-output");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let hasFailures = false;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    hasFailures = true;
  }
}

async function run() {
  console.log(`=== Starting QA Browser Tests targeting ${QA_URL} ===\n`);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });
  } catch (err) {
    console.error(`Failed to launch Playwright chromium: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  try {
    // 1. Screenshots and no horizontal scroll at 390, 820, 1440
    for (const width of [390, 820, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(!hasHorizontalScroll, `Width ${width}px: page scrollWidth does not exceed viewport innerWidth`);

      const screenshotPath = path.join(outputDir, `screenshot-${width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      assert(fs.existsSync(screenshotPath), `Screenshot saved at ${width}px -> ${screenshotPath}`);

      await page.close();
    }

    // 2. Programs dropdown with keyboard navigation (Tab, Enter, Escape)
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);

      const trigger = page.locator("#nav-trigger-programs");
      await trigger.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(300);

      const isExpanded = await trigger.getAttribute("aria-expanded");
      assert(isExpanded === "true", "Programs dropdown opens with keyboard Enter and has aria-expanded=true");

      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      const isClosed = await trigger.getAttribute("aria-expanded");
      assert(isClosed === "false", "Programs dropdown closes on Escape");

      const isFocusReturned = await page.evaluate(() => {
        return document.activeElement?.id === "nav-trigger-programs";
      });
      assert(isFocusReturned, "Focus returns to Programs trigger after Escape closes dropdown");

      await page.close();
    }

    // 3. Mobile drawer at 390px, scroll lock, Escape closes
    {
      const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await mobilePage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await mobilePage.waitForTimeout(400);

      const menuBtn = mobilePage.locator('button.mobile-toggle, button[aria-controls="mobile-navigation-drawer"]');
      await menuBtn.click();
      await mobilePage.waitForTimeout(300);

      const isScrollLocked = await mobilePage.evaluate(() => {
        return document.body.style.overflow === "hidden";
      });
      assert(isScrollLocked, "At 390px, mobile drawer opens and body scroll is locked with overflow:hidden");

      await mobilePage.keyboard.press("Escape");
      await mobilePage.waitForTimeout(300);

      const isDrawerClosed = await mobilePage.evaluate(() => {
        return !document.getElementById("mobile-navigation-drawer") && document.body.style.overflow !== "hidden";
      });
      assert(isDrawerClosed, "Escape key closes mobile drawer and releases body scroll lock");

      await mobilePage.close();
    }

    // 4. Motion toggle, data-motion="reduced", gallery track no running animation
    {
      const motionPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await motionPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await motionPage.waitForTimeout(400);

      const toggleBtn = motionPage.locator('button[aria-label*="motion"], button[aria-label*="Motion"]').first();
      await toggleBtn.click();
      await motionPage.waitForTimeout(300);

      const dataMotion = await motionPage.evaluate(() => {
        return document.documentElement.getAttribute("data-motion");
      });
      assert(dataMotion === "reduced", "Clicking motion toggle sets html[data-motion='reduced']");

      const isAnimationStopped = await motionPage.evaluate(() => {
        const track = document.querySelector(".hero-gallery-track");
        if (!track) return true;
        const style = window.getComputedStyle(track);
        return style.animationName === "none" || style.animationPlayState === "paused";
      });
      assert(isAnimationStopped, "Hero gallery track has no running animation under reduced motion");

      await motionPage.close();
    }

    // 5. Cookie banner: 3 buttons with equal height, choice persists after reload
    {
      const cookiePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await cookiePage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await cookiePage.evaluate(() => localStorage.clear());
      await cookiePage.reload({ waitUntil: "domcontentloaded" });
      await cookiePage.waitForTimeout(400);

      const bannerButtons = cookiePage.locator('aside[aria-label="Cookie Preferences"] button');
      const btnCount = await bannerButtons.count();
      assert(btnCount === 3, "Cookie banner renders three action buttons (Customize, Reject, Accept)");

      const heights = await bannerButtons.evaluateAll((btns) =>
        btns.map((b) => Math.round(b.getBoundingClientRect().height))
      );
      const heightsMatch =
        heights.length === 3 &&
        Math.abs(heights[0] - heights[1]) <= 1 &&
        Math.abs(heights[1] - heights[2]) <= 1;
      assert(heightsMatch, `All 3 cookie banner buttons have equal height (${heights.join("px, ")}px)`);

      const acceptBtn = cookiePage.locator('button[aria-label="Accept all cookies"]');
      await acceptBtn.click();
      await cookiePage.waitForTimeout(300);

      await cookiePage.reload({ waitUntil: "domcontentloaded" });
      await cookiePage.waitForTimeout(400);

      const bannerAfterReload = await cookiePage.locator('aside[aria-label="Cookie Preferences"]').count();
      assert(bannerAfterReload === 0, "Cookie choice persists after reload and banner remains hidden");

      await cookiePage.close();
    }

    // 6. Exactly one h1 on / and all non-duplicate images have non-empty alt
    {
      const auditPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await auditPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await auditPage.waitForTimeout(400);

      const h1Count = await auditPage.locator("h1").count();
      assert(h1Count === 1, `Page / has exactly one h1 heading (count: ${h1Count})`);

      const imgAudit = await auditPage.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        let missingAltCount = 0;
        let checkedCount = 0;

        for (const img of imgs) {
          const isAriaHidden = img.closest('[aria-hidden="true"]') !== null;
          if (isAriaHidden) continue;
          checkedCount++;
          const alt = img.getAttribute("alt");
          if (!alt || alt.trim() === "") {
            missingAltCount++;
          }
        }
        return { checkedCount, missingAltCount };
      });

      assert(
        imgAudit.missingAltCount === 0,
        `All ${imgAudit.checkedCount} visible, non-duplicate images have valid non-empty alt text`
      );

      await auditPage.close();
    }
  } finally {
    await browser.close();
  }

  if (hasFailures) {
    console.error("\nQA Browser verification finished with FAILURES.");
    process.exit(1);
  } else {
    console.log("\nAll QA Browser assertions PASSED successfully!");
  }
}

run();
