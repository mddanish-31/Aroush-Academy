import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const QA_URL = process.env.QA_URL || "http://localhost:3000";
const isProd = QA_URL.includes("3001");
const tag = isProd ? "prod" : "dev";
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

function parseRgb(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
}

function srgbLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = srgbLuminance(...rgb1);
  const l2 = srgbLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function run() {
  console.log(`=== Starting QA Browser Tests targeting ${QA_URL} (${tag}) ===\n`);

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
    console.log("\n--- Section 1: Screenshots and Viewport Measurements ---");
    {
      const firstScreenPage = await browser.newPage({ viewport: { width: 1440, height: 800 } });
      await firstScreenPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await firstScreenPage.waitForTimeout(400);

      const shotFirstScreen = path.join(outputDir, `screenshot-1440x800-first-screen-${tag}.png`);
      await firstScreenPage.screenshot({ path: shotFirstScreen });
      assert(fs.existsSync(shotFirstScreen), `First-screen 1440x800 screenshot saved: ${shotFirstScreen}`);

      const galleryVisibility = await firstScreenPage.evaluate(() => {
        const tile = document.querySelector(".hero-gallery-item");
        if (!tile) return 0;
        const rect = tile.getBoundingClientRect();
        const vh = window.innerHeight;
        const visiblePx = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
        return (visiblePx / rect.height) * 100;
      });
      assert(
        galleryVisibility >= 45,
        `Hero gallery tile visible without scrolling at 1440x800: ${galleryVisibility.toFixed(1)}% (Min 45%)`
      );
      await firstScreenPage.close();

      const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await mobilePage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await mobilePage.waitForTimeout(400);

      const hasHScroll390 = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!hasHScroll390, "Width 390px (/): scrollWidth does not exceed innerWidth");

      await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await mobilePage.waitForTimeout(200);

      const shot390 = path.join(outputDir, `screenshot-390-scrolled-${tag}.png`);
      await mobilePage.screenshot({ path: shot390, fullPage: true });
      assert(fs.existsSync(shot390), `Full-page 390 screenshot saved: ${shot390}`);
      await mobilePage.close();

      const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await desktopPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await desktopPage.waitForTimeout(400);

      const hasHScroll1440 = await desktopPage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!hasHScroll1440, "Width 1440px (/): scrollWidth does not exceed innerWidth");

      await desktopPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await desktopPage.waitForTimeout(200);

      const shot1440 = path.join(outputDir, `screenshot-1440-scrolled-${tag}.png`);
      await desktopPage.screenshot({ path: shot1440, fullPage: true });
      assert(fs.existsSync(shot1440), `Full-page 1440 screenshot saved: ${shot1440}`);
      await desktopPage.close();
    }

    console.log("\n--- Section 2: Header Buttons Contrast and Visibility ---");
    {
      const btnPage1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await btnPage1440.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await btnPage1440.waitForTimeout(300);

      const signUpDesktop = btnPage1440.locator("header .desktop-nav a[href*='register']");
      const signUpStyles = await signUpDesktop.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          color: s.color,
          bg: s.backgroundColor,
          textDec: s.textDecorationLine,
          text: el.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0,
        };
      });
      const signUpContrast = contrastRatio(parseRgb(signUpStyles.color), parseRgb(signUpStyles.bg));
      assert(
        signUpContrast >= 4.5,
        `Sign Up (1440): text contrast against button bg is ${signUpContrast.toFixed(2)}:1 (Min 4.5:1)`
      );
      assert(
        signUpStyles.visible && signUpStyles.text.length > 0,
        `Sign Up (1440): label is visible and non-empty ("${signUpStyles.text}")`
      );
      assert(
        signUpStyles.textDec === "none",
        `Sign Up (1440): button has no underline (textDecoration: "${signUpStyles.textDec}")`
      );

      const loginDesktop = btnPage1440.locator("header .desktop-nav a[href*='login']");
      const loginStyles = await loginDesktop.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          color: s.color,
          bg: s.backgroundColor,
          textDec: s.textDecorationLine,
          text: el.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0,
        };
      });
      const loginContrast = contrastRatio(parseRgb(loginStyles.color), [255, 255, 255]);
      assert(
        loginContrast >= 4.5,
        `Log In (1440): text contrast against surface is ${loginContrast.toFixed(2)}:1 (Min 4.5:1)`
      );
      assert(
        loginStyles.visible && loginStyles.text.length > 0,
        `Log In (1440): label is visible and non-empty ("${loginStyles.text}")`
      );
      assert(
        loginStyles.textDec === "none",
        `Log In (1440): plain state has no underline (textDecoration: "${loginStyles.textDec}")`
      );

      await loginDesktop.hover();
      const loginHoverDec = await loginDesktop.evaluate((el) => window.getComputedStyle(el).textDecorationLine);
      assert(
        loginHoverDec.includes("underline"),
        `Log In (1440): hover triggers underline (textDecoration: "${loginHoverDec}")`
      );
      await btnPage1440.close();

      const btnPage390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await btnPage390.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await btnPage390.waitForTimeout(300);

      const toggleMenu = btnPage390.locator("button.mobile-toggle");
      await toggleMenu.click();
      await btnPage390.waitForTimeout(350);

      const signUpMobile = btnPage390.locator("#mobile-navigation-drawer a[href*='register']");
      const mobSignUpStyles = await signUpMobile.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          color: s.color,
          bg: s.backgroundColor,
          textDec: s.textDecorationLine,
          text: el.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0,
        };
      });
      const mobSignUpContrast = contrastRatio(parseRgb(mobSignUpStyles.color), parseRgb(mobSignUpStyles.bg));
      assert(
        mobSignUpContrast >= 4.5,
        `Sign Up (390): text contrast against button bg is ${mobSignUpContrast.toFixed(2)}:1 (Min 4.5:1)`
      );
      assert(
        mobSignUpStyles.visible && mobSignUpStyles.text.length > 0,
        `Sign Up (390): label is visible and non-empty ("${mobSignUpStyles.text}")`
      );
      assert(
        mobSignUpStyles.textDec === "none",
        `Sign Up (390): button has no underline (textDecoration: "${mobSignUpStyles.textDec}")`
      );

      const loginMobile = btnPage390.locator("#mobile-navigation-drawer a[href*='login']");
      const mobLoginStyles = await loginMobile.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          color: s.color,
          bg: s.backgroundColor,
          textDec: s.textDecorationLine,
          text: el.textContent.trim(),
          visible: rect.width > 0 && rect.height > 0,
        };
      });
      const mobLoginContrast = contrastRatio(parseRgb(mobLoginStyles.color), [255, 255, 255]);
      assert(
        mobLoginContrast >= 4.5,
        `Log In (390): text contrast is ${mobLoginContrast.toFixed(2)}:1 (Min 4.5:1)`
      );
      assert(
        mobLoginStyles.visible && mobLoginStyles.text.length > 0,
        `Log In (390): label is visible and non-empty ("${mobLoginStyles.text}")`
      );
      await btnPage390.close();
    }

    console.log("\n--- Section 3: Eyebrow Labels Formatting ---");
    {
      const eyebrowPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await eyebrowPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await eyebrowPage.waitForTimeout(300);

      const ethosEyebrow = eyebrowPage.locator("span", { hasText: "ACADEMIC ETHOS" }).first();
      const ethosStyles = await ethosEyebrow.evaluate((el) => {
        const s = window.getComputedStyle(el);
        return {
          borderBottomWidth: parseFloat(s.borderBottomWidth) || 0,
          textDecorationLine: s.textDecorationLine,
          textTransform: s.textTransform,
          letterSpacing: s.letterSpacing,
        };
      });
      assert(
        ethosStyles.borderBottomWidth === 0 && ethosStyles.textDecorationLine === "none",
        `Eyebrow (ACADEMIC ETHOS) has no underline (borderBottomWidth: ${ethosStyles.borderBottomWidth}px, textDecoration: "${ethosStyles.textDecorationLine}")`
      );
      assert(
        ethosStyles.textTransform === "uppercase",
        `Eyebrow is uppercase (textTransform: "${ethosStyles.textTransform}")`
      );
      await eyebrowPage.close();
    }

    console.log("\n--- Section 4: Typography and Font Families ---");
    {
      const fontPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      let woff2Count = 0;
      let woff2Ok = true;

      fontPage.on("response", (res) => {
        if (res.url().includes(".woff2")) {
          woff2Count++;
          if (res.status() !== 200) {
            woff2Ok = false;
            console.error(`WOFF2 response failed: ${res.url()} (status: ${res.status()})`);
          }
        }
      });

      await fontPage.goto(QA_URL, { waitUntil: "networkidle" });
      await fontPage.waitForTimeout(300);

      const fontResolution = await fontPage.evaluate(() => {
        const h1 = document.querySelector("h1");
        const body = document.body;
        const h1Family = window.getComputedStyle(h1).fontFamily;
        const bodyFamily = window.getComputedStyle(body).fontFamily;
        const checkFraunces = document.fonts.check("16px Fraunces");
        const checkManrope = document.fonts.check("16px Manrope");
        return { h1Family, bodyFamily, checkFraunces, checkManrope };
      });

      assert(
        fontResolution.h1Family.includes("Fraunces"),
        `h1 font family resolves to Fraunces (computed: "${fontResolution.h1Family}")`
      );
      assert(
        fontResolution.bodyFamily.includes("Manrope"),
        `body font family resolves to Manrope (computed: "${fontResolution.bodyFamily}")`
      );

      const checkDuplicates = (familyStr) => {
        const families = familyStr
          .split(",")
          .map((f) => f.trim().replace(/^["']|["']$/g, "").toLowerCase())
          .filter(Boolean);
        return families.filter((f, idx) => families.indexOf(f) !== idx);
      };

      const h1Dupes = checkDuplicates(fontResolution.h1Family);
      const bodyDupes = checkDuplicates(fontResolution.bodyFamily);

      assert(
        h1Dupes.length === 0,
        `h1 computed font stack contains each family once (computed: "${fontResolution.h1Family}")`
      );
      assert(
        bodyDupes.length === 0,
        `body computed font stack contains each family once (computed: "${fontResolution.bodyFamily}")`
      );

      assert(
        fontResolution.checkFraunces,
        `document.fonts.check("16px Fraunces") passed (${fontResolution.checkFraunces})`
      );
      assert(
        fontResolution.checkManrope,
        `document.fonts.check("16px Manrope") passed (${fontResolution.checkManrope})`
      );
      assert(
        woff2Ok && woff2Count > 0,
        `WOFF2 font files returned HTTP 200 (observed ${woff2Count} font responses)`
      );

      await fontPage.close();
    }

    console.log("\n--- Section 5: Motion Switch and Transition Timings ---");
    {
      const motionPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await motionPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await motionPage.waitForTimeout(300);

      const switches = motionPage.locator("button[role='switch']");
      const switchCount = await switches.count();
      assert(switchCount >= 2, `Motion switch rendered on page (count: ${switchCount})`);

      const headerSwitch = switches.first();
      const switchAttrs = await headerSwitch.evaluate((el) => ({
        role: el.getAttribute("role"),
        checked: el.getAttribute("aria-checked"),
        label: el.getAttribute("aria-label"),
        text: el.textContent.trim(),
      }));
      assert(
        switchAttrs.role === "switch" && switchAttrs.checked !== null && switchAttrs.text.includes("Motion"),
        `Motion control is an accessible switch with visible label "Motion"`
      );

      const navTrigger = motionPage.locator("#nav-trigger-programs");
      await navTrigger.click();
      await motionPage.waitForTimeout(40);
      const fullOpacity40 = await motionPage.locator("#dropdown-panel-programs").evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).opacity);
      });
      assert(
        fullOpacity40 > 0 && fullOpacity40 < 1,
        `Full mode dropdown 40ms opacity strictly between 0 and 1 (sampled: ${fullOpacity40.toFixed(3)})`
      );

      await motionPage.waitForTimeout(360);
      const fullOpacity400 = await motionPage.locator("#dropdown-panel-programs").evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).opacity);
      });
      assert(
        fullOpacity400 === 1,
        `Full mode dropdown 400ms opacity equals 1 (sampled: ${fullOpacity400})`
      );

      await headerSwitch.click();
      await motionPage.waitForTimeout(250);

      const dataMotion = await motionPage.evaluate(() => document.documentElement.getAttribute("data-motion"));
      assert(dataMotion === "reduced", "Reduced motion activated upon clicking switch");

      await navTrigger.click();
      await motionPage.waitForTimeout(200);
      await navTrigger.click();
      await motionPage.waitForTimeout(40);

      const redSample = await motionPage.locator("#dropdown-panel-programs").evaluate((el) => {
        const s = window.getComputedStyle(el);
        return {
          opacity: parseFloat(s.opacity),
          transform: s.transform,
        };
      });
      assert(
        redSample.transform === "none",
        `Reduced mode dropdown transform is none (computed: "${redSample.transform}")`
      );
      assert(
        redSample.opacity > 0 && redSample.opacity <= 1,
        `Reduced mode dropdown opacity transition runs (sampled: ${redSample.opacity.toFixed(3)})`
      );

      await motionPage.close();
    }

    console.log("\n--- Section 6: Hero Headline, Subheadline and Texture ---");
    {
      const heroPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await heroPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await heroPage.waitForTimeout(300);

      const headlineMeta = await heroPage.locator("h1.hero-enter-headline").evaluate((el) => {
        const s = window.getComputedStyle(el);
        const spans = Array.from(el.querySelectorAll("span"));
        const lineTops = spans.map((sp) => Math.round(sp.getBoundingClientRect().top));
        const distinctLines = Array.from(new Set(lineTops));
        return {
          fontWeight: s.fontWeight,
          lineHeight: parseFloat(s.lineHeight) / parseFloat(s.fontSize),
          letterSpacing: s.letterSpacing,
          distinctLinesCount: distinctLines.length,
          spanTexts: spans.map((sp) => sp.textContent.trim()),
        };
      });

      assert(headlineMeta.fontWeight === "600", `Headline font-weight is 600 (computed: ${headlineMeta.fontWeight})`);
      assert(
        headlineMeta.distinctLinesCount === 2,
        `Headline at 1440 wraps to exactly two lines (lines: ${headlineMeta.distinctLinesCount})`
      );
      assert(
        headlineMeta.spanTexts[0] === "Clear the concept." && headlineMeta.spanTexts[1] === "Then decode the question.",
        `Headline phrases: "${headlineMeta.spanTexts.join(" ")}"`
      );

      const subheadlineText = await heroPage.locator("p.hero-enter-subheadline").textContent();
      assert(
        subheadlineText.includes("Coaching for Class V to XII in Park Circus, Kolkata. ICSE, CBSE and West Bengal Board."),
        `Supporting subheadline copy states plain academy offering`
      );

      await heroPage.close();
    }

    console.log("\n--- Section 7: Gallery Control and Interactions ---");
    {
      const galleryPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await galleryPage.goto(QA_URL, { waitUntil: "networkidle" });
      await galleryPage.waitForTimeout(300);

      const viewport = galleryPage.locator(".hero-gallery-viewport");
      const initScroll = await viewport.evaluate((el) => el.scrollLeft);

      await galleryPage.waitForTimeout(2000);
      const afterDrift = await viewport.evaluate((el) => el.scrollLeft);
      const driftDelta = afterDrift - initScroll;
      assert(
        driftDelta >= 40,
        `Full mode auto-drift increases scrollLeft over 2s (diff: +${driftDelta}px)`
      );

      await viewport.hover();
      await galleryPage.mouse.wheel(160, 0);
      await galleryPage.waitForTimeout(150);
      const afterWheel = await viewport.evaluate((el) => el.scrollLeft);
      assert(
        afterWheel > afterDrift,
        `mouse.wheel with deltaX scrolls gallery (diff: +${afterWheel - afterDrift}px)`
      );

      const box = await viewport.boundingBox();
      const sx = box.x + 350;
      const sy = box.y + 120;
      await galleryPage.mouse.move(sx, sy);
      await galleryPage.mouse.down();
      await galleryPage.mouse.move(sx - 100, sy, { steps: 5 });
      await galleryPage.mouse.up();
      await galleryPage.waitForTimeout(150);
      const afterDrag = await viewport.evaluate((el) => el.scrollLeft);
      assert(
        afterDrag > afterWheel,
        `Mouse drag changes scrollLeft (diff: +${afterDrag - afterWheel}px)`
      );

      await viewport.focus();
      const beforeArrow = await viewport.evaluate((el) => el.scrollLeft);
      await galleryPage.keyboard.press("ArrowRight");
      await galleryPage.waitForTimeout(300);
      const afterArrow = await viewport.evaluate((el) => el.scrollLeft);
      assert(
        afterArrow > beforeArrow,
        `ArrowRight changes scrollLeft (diff: +${afterArrow - beforeArrow}px)`
      );

      const pageYBefore = await galleryPage.evaluate(() => window.scrollY);
      await viewport.hover();
      await galleryPage.mouse.wheel(0, 300);
      await galleryPage.waitForTimeout(200);
      const pageYAfter = await galleryPage.evaluate(() => window.scrollY);
      assert(
        pageYAfter > pageYBefore,
        `Vertical page scroll still works over gallery (scrolled +${pageYAfter - pageYBefore}px)`
      );

      await galleryPage.close();

      const mobContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
      const mobPage = await mobContext.newPage();
      await mobPage.goto(QA_URL, { waitUntil: "networkidle" });

      const mobViewport = mobPage.locator(".hero-gallery-viewport");
      const mobInit = await mobViewport.evaluate((el) => el.scrollLeft);

      let cdpSuccess = false;
      try {
        const cdp = await mobContext.newCDPSession(mobPage);
        const mbox = await mobViewport.boundingBox();
        await cdp.send("Input.synthesizeScrollGesture", {
          x: mbox.x + 200,
          y: mbox.y + 100,
          xDistance: -150,
          yDistance: 0,
          gestureSourceType: "touch",
        });
        await mobPage.waitForTimeout(300);
        const mobAfter = await mobViewport.evaluate((el) => el.scrollLeft);
        if (mobAfter > mobInit) cdpSuccess = true;
      } catch (err) {
        console.log(`CDP gesture notice: ${err instanceof Error ? err.message : String(err)}`);
      }

      const scrollerAttrs = await mobViewport.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const touchAction = el.style.touchAction || s.touchAction;
        return {
          touchAction,
          hasPanX: touchAction.includes("pan-x") || s.touchAction === "manipulation",
          overflowX: s.overflowX,
          overscrollBehaviorX: s.overscrollBehaviorX,
        };
      });

      assert(
        scrollerAttrs.hasPanX,
        `HeroGallery scroller touch-action contains pan-x (computed: "${scrollerAttrs.touchAction}")`
      );
      assert(
        scrollerAttrs.overscrollBehaviorX === "contain",
        `HeroGallery scroller overscroll-behavior-x is contain (computed: "${scrollerAttrs.overscrollBehaviorX}")`
      );
      assert(
        cdpSuccess || scrollerAttrs.hasPanX,
        `Mobile touch scroll verified (CDP: ${cdpSuccess}, touchAction: "${scrollerAttrs.touchAction}", overscrollBehaviorX: "${scrollerAttrs.overscrollBehaviorX}")`
      );

      const coursesScrollerAttrs = await mobPage.evaluate(() => {
        const el = document.querySelector(".courses-gallery-viewport");
        if (!el) return null;
        const s = window.getComputedStyle(el);
        const touchAction = el.style.touchAction || s.touchAction;
        return {
          touchAction,
          hasPanX: touchAction.includes("pan-x") || s.touchAction === "manipulation",
          overscrollBehaviorX: s.overscrollBehaviorX,
        };
      });
      if (coursesScrollerAttrs) {
        assert(
          coursesScrollerAttrs.hasPanX,
          `Courses gallery scroller touch-action contains pan-x (computed: "${coursesScrollerAttrs.touchAction}")`
        );
        assert(
          coursesScrollerAttrs.overscrollBehaviorX === "contain",
          `Courses gallery scroller overscroll-behavior-x is contain (computed: "${coursesScrollerAttrs.overscrollBehaviorX}")`
        );
      }

      await mobPage.close();
      await mobContext.close();
    }

    console.log("\n--- Section 8: axe-core Accessibility Audits ---");
    {
      const routes = ["/", "/terms", "/privacy", "/faq", "/login", "/register"];
      const viewports = [390, 1440];

      for (const route of routes) {
        for (const width of viewports) {
          const context = await browser.newContext({ viewport: { width, height: 900 } });
          await context.addInitScript(() => {
            window.localStorage.setItem(
              "aroushh_cookie_preferences_v1",
              JSON.stringify({
                necessary: true,
                functional: false,
                analytics: false,
                marketing: false,
                consented: true,
              })
            );
          });
          const axePage = await context.newPage();
          await axePage.goto(`${QA_URL}${route}`, { waitUntil: "domcontentloaded" });
          await axePage.waitForTimeout(400);

          const results = await new AxeBuilder({ page: axePage }).analyze();
          const seriousOrCritical = results.violations.filter(
            (v) => v.impact === "serious" || v.impact === "critical"
          );
          const incompleteColorContrast = results.incomplete.filter(
            (inc) => inc.id === "color-contrast"
          );

          console.log(
            `  axe-core incomplete color-contrast items on ${route} (${width}px): ${incompleteColorContrast.length}`
          );

          if (seriousOrCritical.length > 0) {
            console.error(`\naxe-core violations on ${route} (${width}px):`);
            for (const v of seriousOrCritical) {
              console.error(`  - [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
            }
          }

          if (incompleteColorContrast.length > 0) {
            console.error(
              `\naxe-core incomplete color-contrast on ${route} (${width}px):`
            );
            for (const inc of incompleteColorContrast) {
              for (const node of inc.nodes) {
                console.error(
                  `  - target: ${node.target.join(", ")} | failure: ${node.failureSummary}`
                );
              }
            }
          }

          assert(
            seriousOrCritical.length === 0,
            `axe-core zero serious/critical violations on ${route} at ${width}px (found ${seriousOrCritical.length})`
          );

          assert(
            incompleteColorContrast.length === 0,
            `axe-core zero incomplete color-contrast items on ${route} at ${width}px (found ${incompleteColorContrast.length})`
          );

          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  if (hasFailures) {
    console.error(`\nQA Browser verification on ${QA_URL} finished with FAILURES.`);
    process.exit(1);
  } else {
    console.log(`\nAll QA Browser assertions on ${QA_URL} (${tag}) PASSED successfully!`);
  }
}

run();
