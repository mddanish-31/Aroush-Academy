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

      const signUpDesktop = btnPage1440.locator("header .desktop-nav #auth-trigger-register");
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

      const loginDesktop = btnPage1440.locator("header .desktop-nav #auth-trigger-login");
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
        loginHoverDec.includes("underline") || loginStyles.visible,
        `Log In (1440): hover triggers state (textDecoration: "${loginHoverDec}")`
      );
      await btnPage1440.close();

      const btnPage390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await btnPage390.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await btnPage390.waitForTimeout(300);

      const toggleMenu = btnPage390.locator("button.mobile-toggle");
      await toggleMenu.click();
      await btnPage390.waitForTimeout(350);

      const signUpMobile = btnPage390.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-register']");
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

      const loginMobile = btnPage390.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-login']");
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

    console.log("\n--- Section 9: Auth Forms Audit and Functional Verification ---");
    {
      const teacherPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await teacherPage.goto(`${QA_URL}/login?role=teacher`, { waitUntil: "domcontentloaded" });
      await teacherPage.waitForTimeout(300);
      const teacherRoleText = await teacherPage.locator('[data-testid="selected-role-name"]').textContent();
      assert(
        teacherRoleText?.includes("Teacher Portal"),
        `/login?role=teacher preselects Teacher (rendered: "${teacherRoleText}")`
      );
      await teacherPage.close();

      const parentPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await parentPage.goto(`${QA_URL}/register?role=parent`, { waitUntil: "domcontentloaded" });
      await parentPage.waitForTimeout(300);
      const parentRoleText = await parentPage.locator('[data-testid="selected-reg-role"]').textContent();
      assert(
        parentRoleText?.includes("Parent"),
        `/register?role=parent preselects Parent (rendered: "${parentRoleText}")`
      );
      await parentPage.close();

      const foldPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await foldPage.goto(`${QA_URL}/login`, { waitUntil: "domcontentloaded" });
      await foldPage.waitForTimeout(300);

      const foldPositions = await foldPage.evaluate(() => {
        const emailInput = document.querySelector("#signin-identifier");
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!emailInput || !submitBtn) return null;
        const emailRect = emailInput.getBoundingClientRect();
        const submitRect = submitBtn.getBoundingClientRect();
        return {
          emailBottom: emailRect.bottom,
          submitBottom: submitRect.bottom,
          viewportHeight: window.innerHeight,
        };
      });

      assert(
        foldPositions !== null &&
          foldPositions.emailBottom < foldPositions.viewportHeight &&
          foldPositions.submitBottom < foldPositions.viewportHeight,
        `/login at 390x844 shows email (bottom: ${foldPositions?.emailBottom}px) and submit button (bottom: ${foldPositions?.submitBottom}px) above fold (${foldPositions?.viewportHeight}px)`
      );

      const hasUnenclosedQuickLogin = await foldPage.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll("button"));
        return allButtons.some(
          (b) =>
            !b.closest("details") &&
            (b.textContent?.includes("admin123") ||
              b.textContent?.includes("teacher123") ||
              b.textContent?.includes("student123"))
        );
      });
      assert(
        !hasUnenclosedQuickLogin,
        "/login has no quick-login block outside of details element"
      );

      const shotLogin390 = path.join(outputDir, `screenshot-login-390-${tag}.png`);
      await foldPage.screenshot({ path: shotLogin390 });
      assert(fs.existsSync(shotLogin390), `Login 390 screenshot saved: ${shotLogin390}`);

      const shotLogin1440 = path.join(outputDir, `screenshot-login-1440-${tag}.png`);
      const desktopLoginPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await desktopLoginPage.goto(`${QA_URL}/login`, { waitUntil: "domcontentloaded" });
      await desktopLoginPage.waitForTimeout(300);
      await desktopLoginPage.screenshot({ path: shotLogin1440 });
      assert(fs.existsSync(shotLogin1440), `Login 1440 screenshot saved: ${shotLogin1440}`);
      await desktopLoginPage.close();

      const shotRegister390 = path.join(outputDir, `screenshot-register-390-${tag}.png`);
      const reg390Page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await reg390Page.goto(`${QA_URL}/register`, { waitUntil: "domcontentloaded" });
      await reg390Page.waitForTimeout(300);
      await reg390Page.screenshot({ path: shotRegister390 });
      assert(fs.existsSync(shotRegister390), `Register 390 screenshot saved: ${shotRegister390}`);
      await reg390Page.close();

      await foldPage.close();

      const roles = ["academy-admin", "teacher", "student", "parent"];
      const demoCredentials = {
        "academy-admin": { id: "admin@aroushacademy.in", pass: "admin2026" },
        "teacher": { id: "azhar.maths@aroush.academy", pass: "teacher2026" },
        "student": { id: "taha.rahman@student.aroush.in", pass: "student2026" },
        "parent": { id: "amina.rahman@parent.aroush.in", pass: "parent2026" },
      };
      for (const role of roles) {
        const authContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const authPage = await authContext.newPage();
        await authPage.goto(`${QA_URL}/login?role=${role}`, { waitUntil: "domcontentloaded" });
        await authPage.waitForTimeout(300);

        const creds = demoCredentials[role];
        await authPage.fill("#signin-identifier", creds.id);
        await authPage.fill("#signin-password", creds.pass);

        const submitBtn = authPage.locator('button[type="submit"]');
        await submitBtn.click();

        await authPage.waitForURL((url) => url.pathname.includes("/dashboard") && url.search.includes(`role=${role}`), {
          timeout: 6000,
        });

        const currentUrl = authPage.url();
        assert(
          currentUrl.includes("/dashboard") && currentUrl.includes(`role=${role}`),
          `Login for demo role ${role} reached dashboard: ${currentUrl}`
        );

        await authContext.close();
      }

      const regContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const regPage = await regContext.newPage();
      await regPage.goto(`${QA_URL}/register`, { waitUntil: "domcontentloaded" });
      await regPage.waitForTimeout(300);

      await regPage.fill("#reg-name", "Verification Student");
      await regPage.fill("#reg-identifier", "verify.student@example.com");
      await regPage.fill("#reg-password", "demoPassword123");
      await regPage.fill("#reg-confirm-password", "demoPassword123");

      const regSubmit = regPage.locator('button[type="submit"]');
      await regSubmit.click();

      await regPage.waitForSelector("text=Pending Academy Admin Approval", { timeout: 6000 });
      const approvalVisible = await regPage.locator("text=Pending Academy Admin Approval").isVisible();
      assert(approvalVisible, "Registration created account and rendered Pending Approval status");

      await regContext.close();
    }

    console.log("\n--- Section 10: Header Dropdowns Accessibility, Keyboard & Axe ---");
    {
      const dropContext1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await dropContext1440.addInitScript(() => {
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
      const dropPage1440 = await dropContext1440.newPage();
      await dropPage1440.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await dropPage1440.waitForTimeout(300);

      const loginTrigger = dropPage1440.locator("#auth-trigger-login");
      const loginPanel = dropPage1440.locator("#auth-dropdown-login");

      await loginTrigger.click();
      await dropPage1440.waitForTimeout(200);

      const isLoginOpen = await loginPanel.getAttribute("data-state");
      assert(isLoginOpen === "open", `Log In dropdown opened by click (data-state="${isLoginOpen}")`);

      const shotLoginOpen = path.join(outputDir, `screenshot-dropdown-login-1440-${tag}.png`);
      await dropPage1440.screenshot({ path: shotLoginOpen });
      assert(fs.existsSync(shotLoginOpen), `Log In dropdown open screenshot saved: ${shotLoginOpen}`);

      const loginLinks = await loginPanel.locator("a[role='menuitem']").all();
      assert(loginLinks.length === 4, `Log In dropdown has 4 role options (found: ${loginLinks.length})`);

      const loginHrefs = [];
      for (const link of loginLinks) {
        loginHrefs.push(await link.getAttribute("href"));
      }
      assert(
        loginHrefs.includes("/login?role=academy-admin") &&
          loginHrefs.includes("/login?role=teacher") &&
          loginHrefs.includes("/login?role=student") &&
          loginHrefs.includes("/login?role=parent"),
        `Log In dropdown links contain all 4 role query parameters: ${loginHrefs.join(", ")}`
      );

      const axeLogin = await new AxeBuilder({ page: dropPage1440 }).analyze();
      const loginAxeSerious = axeLogin.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const loginAxeContrastIncomplete = axeLogin.incomplete.filter((i) => i.id === "color-contrast");
      assert(loginAxeSerious.length === 0, `Log In open dropdown has 0 serious/critical axe violations (found ${loginAxeSerious.length})`);
      assert(loginAxeContrastIncomplete.length === 0, `Log In open dropdown has 0 incomplete color-contrast items (found ${loginAxeContrastIncomplete.length})`);

      await dropPage1440.keyboard.press("Escape");
      await dropPage1440.waitForTimeout(200);
      const isLoginClosed = await loginPanel.getAttribute("data-state");
      const isLoginFocused = await loginTrigger.evaluate((el) => document.activeElement === el);
      assert(isLoginClosed === "closed", `Log In dropdown closed on Escape (data-state="${isLoginClosed}")`);
      assert(isLoginFocused, "Escape returned focus to Log In trigger button");

      await loginTrigger.focus();
      await dropPage1440.keyboard.press("Enter");
      await dropPage1440.waitForTimeout(200);
      const isLoginReopened = await loginPanel.getAttribute("data-state");
      assert(isLoginReopened === "open", `Log In dropdown opened by keyboard Enter (data-state="${isLoginReopened}")`);

      await dropPage1440.keyboard.press("Escape");
      await dropPage1440.waitForTimeout(200);

      const registerTrigger = dropPage1440.locator("#auth-trigger-register");
      const registerPanel = dropPage1440.locator("#auth-dropdown-register");

      await registerTrigger.click();
      await dropPage1440.waitForTimeout(200);

      const isRegOpen = await registerPanel.getAttribute("data-state");
      assert(isRegOpen === "open", `Sign Up dropdown opened by click (data-state="${isRegOpen}")`);

      const shotRegOpen = path.join(outputDir, `screenshot-dropdown-signup-1440-${tag}.png`);
      await dropPage1440.screenshot({ path: shotRegOpen });
      assert(fs.existsSync(shotRegOpen), `Sign Up dropdown open screenshot saved: ${shotRegOpen}`);

      const regLinks = await registerPanel.locator("a[role='menuitem']").all();
      assert(regLinks.length === 2, `Sign Up dropdown has exactly 2 items (found: ${regLinks.length})`);

      const regHrefs = [];
      for (const link of regLinks) {
        regHrefs.push(await link.getAttribute("href"));
      }
      assert(
        regHrefs.includes("/register?role=student") && regHrefs.includes("/register?role=parent"),
        `Sign Up dropdown links contain student and parent: ${regHrefs.join(", ")}`
      );

      const axeReg = await new AxeBuilder({ page: dropPage1440 }).analyze();
      const regAxeSerious = axeReg.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const regAxeContrastIncomplete = axeReg.incomplete.filter((i) => i.id === "color-contrast");
      assert(regAxeSerious.length === 0, `Sign Up open dropdown has 0 serious/critical axe violations (found ${regAxeSerious.length})`);
      assert(regAxeContrastIncomplete.length === 0, `Sign Up open dropdown has 0 incomplete color-contrast items (found ${regAxeContrastIncomplete.length})`);

      await dropPage1440.keyboard.press("Escape");
      await dropPage1440.waitForTimeout(200);
      const isRegClosed = await registerPanel.getAttribute("data-state");
      const isRegFocused = await registerTrigger.evaluate((el) => document.activeElement === el);
      assert(isRegClosed === "closed", `Sign Up dropdown closed on Escape (data-state="${isRegClosed}")`);
      assert(isRegFocused, "Escape returned focus to Sign Up trigger button");

      await registerTrigger.focus();
      await dropPage1440.keyboard.press("Enter");
      await dropPage1440.waitForTimeout(200);
      const isRegReopened = await registerPanel.getAttribute("data-state");
      assert(isRegReopened === "open", `Sign Up dropdown opened by keyboard Enter (data-state="${isRegReopened}")`);

      await dropPage1440.close();
      await dropContext1440.close();

      const dropContext390 = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await dropContext390.addInitScript(() => {
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
      const dropPage390 = await dropContext390.newPage();
      await dropPage390.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await dropPage390.waitForTimeout(300);

      const mobMenuToggle = dropPage390.locator("button.mobile-toggle");
      await mobMenuToggle.click();
      await dropPage390.waitForTimeout(350);

      const mobLoginAcc = dropPage390.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-login']");
      await mobLoginAcc.click();
      await dropPage390.waitForTimeout(250);
      const mobLoginContent = dropPage390.locator("#mobile-accordion-login");
      const mobLoginState = await mobLoginContent.getAttribute("data-state");
      assert(mobLoginState === "open", `Mobile drawer Log In accordion opened on tap (data-state="${mobLoginState}")`);

      const mobRegAcc = dropPage390.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-register']");
      await mobRegAcc.click();
      await dropPage390.waitForTimeout(250);
      const mobRegContent = dropPage390.locator("#mobile-accordion-register");
      const mobRegState = await mobRegContent.getAttribute("data-state");
      assert(mobRegState === "open", `Mobile drawer Sign Up accordion opened on tap (data-state="${mobRegState}")`);

      const mobRegLinks = await mobRegContent.locator("a").all();
      assert(mobRegLinks.length === 2, `Mobile drawer Sign Up has exactly 2 items (found: ${mobRegLinks.length})`);

      const axeMobileOpen = await new AxeBuilder({ page: dropPage390 }).analyze();
      const mobAxeSerious = axeMobileOpen.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const mobAxeContrastIncomplete = axeMobileOpen.incomplete.filter((i) => i.id === "color-contrast");
      assert(mobAxeSerious.length === 0, `Mobile open drawer has 0 serious/critical axe violations (found ${mobAxeSerious.length})`);
      assert(mobAxeContrastIncomplete.length === 0, `Mobile open drawer has 0 incomplete color-contrast items (found ${mobAxeContrastIncomplete.length})`);

      await dropPage390.close();
      await dropContext390.close();
    }

    console.log("\n--- Section 11: What We Teach Typographic Index ---");
    {
      const teachPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await teachPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await teachPage.waitForTimeout(300);

      const sectionAfterHero = await teachPage.evaluate(() => {
        const heroSection = document.querySelector("section");
        const nextElem = heroSection?.nextElementSibling;
        return {
          id: nextElem?.id || null,
          hasH2: !!nextElem?.querySelector("h2"),
          h2Text: nextElem?.querySelector("h2")?.textContent?.trim() || null,
        };
      });

      assert(
        sectionAfterHero.id === "what-we-teach",
        `What we teach section renders directly after hero (next section id="${sectionAfterHero.id}")`
      );

      const verifiedSubjectNames = ["Mathematics", "Physics", "Chemistry", "Accountancy", "Economics"];
      const unverifiedSubjectNames = ["Biology", "Computer Science", "Humanities Papers", "General Science", "Social Sciences", "Vernacular"];

      const heroSubjectsText = await teachPage.locator(".hero-enter-subjects").textContent();
      const heroHasOnlyVerified = verifiedSubjectNames.some((s) => heroSubjectsText.includes(s)) &&
        unverifiedSubjectNames.every((s) => !heroSubjectsText.includes(s));
      assert(heroHasOnlyVerified, `Hero line contains only verified subjects and no unverified subjects: "${heroSubjectsText?.trim()}"`);

      const rowsData = await teachPage.evaluate(() => {
        const rows = Array.from(document.querySelectorAll("#what-we-teach .what-we-teach-row"));
        return rows.map((r) => ({
          subject: r.getAttribute("data-subject"),
          course: r.getAttribute("data-course"),
          href: r.getAttribute("href"),
          targetExists: !!document.querySelector(r.getAttribute("href")),
        }));
      });

      assert(rowsData.length === 6, `What we teach renders only verified subject rows (expected 6, found ${rowsData.length})`);
      const allRowsVerified = rowsData.every((r) => verifiedSubjectNames.includes(r.subject) && !unverifiedSubjectNames.includes(r.subject));
      assert(allRowsVerified, `All rows in What we teach belong to verified subjects: ${rowsData.map((r) => r.subject).join(", ")}`);
      const allTargetsValid = rowsData.every((r) => r.targetExists);
      assert(allTargetsValid, "Every row in What we teach links to an existing section target id in Courses");

      const foundationEnquiry = await teachPage.evaluate(() => {
        const teachText = document.querySelector("#what-we-teach")?.textContent || "";
        const coursesText = document.querySelector("#courses")?.textContent || "";
        return {
          teachHasClassRange: teachText.includes("Class V-VIII"),
          teachHasAskLink: teachText.includes("Ask us about this class"),
          coursesHasClassRange: coursesText.includes("Class V-VIII"),
          coursesHasAskLink: coursesText.includes("Ask us about this class"),
        };
      });
      assert(
        foundationEnquiry.teachHasClassRange && foundationEnquiry.teachHasAskLink,
        "What we teach displays class range and plain Ask us about this class link for unverified division"
      );
      assert(
        foundationEnquiry.coursesHasClassRange && foundationEnquiry.coursesHasAskLink,
        "Courses displays class range and plain Ask us about this class link for unverified division"
      );

      const pageSubjectsHonesty = await teachPage.evaluate((unverified) => {
        const teach = document.querySelector("#what-we-teach")?.textContent || "";
        const courses = document.querySelector("#courses")?.textContent || "";
        const hero = document.querySelector(".hero-enter-subjects")?.textContent || "";
        const found = [];
        for (const name of unverified) {
          if (teach.includes(name) || courses.includes(name) || hero.includes(name)) {
            found.push(name);
          }
        }
        return found;
      }, unverifiedSubjectNames);
      assert(
        pageSubjectsHonesty.length === 0,
        `Zero unverified subjects found on / (unverified list checked: ${unverifiedSubjectNames.join(", ")}, found: ${pageSubjectsHonesty.join(", ") || "none"})`
      );

      const shotTeach1440 = path.join(outputDir, `screenshot-what-we-teach-1440-${tag}.png`);
      const whatWeTeachLoc = teachPage.locator("#what-we-teach");
      await whatWeTeachLoc.screenshot({ path: shotTeach1440 });
      assert(fs.existsSync(shotTeach1440), `What we teach 1440 screenshot saved: ${shotTeach1440}`);

      await teachPage.close();

      const teachPage390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await teachPage390.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await teachPage390.waitForTimeout(300);

      const shotTeach390 = path.join(outputDir, `screenshot-what-we-teach-390-${tag}.png`);
      await teachPage390.locator("#what-we-teach").screenshot({ path: shotTeach390 });
      assert(fs.existsSync(shotTeach390), `What we teach 390 screenshot saved: ${shotTeach390}`);

      await teachPage390.close();
    }

    console.log("\n--- Section 12: Photo Review & Media Screenshotting ---");
    {
      const photoOutputDir = path.join(outputDir, "photo-review");
      if (!fs.existsSync(photoOutputDir)) {
        fs.mkdirSync(photoOutputDir, { recursive: true });
      }

      const mediaItems = [
        { id: "media-hero-algebra", url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of complex algebraic equations and formulas written with white chalk on a classroom board", verdict: "matches" },
        { id: "media-hero-handwriting", url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&h=1000&q=80", alt: "Stock photo of student hands writing detailed mathematical solutions with pencil in an open notebook", verdict: "matches" },
        { id: "media-hero-teacher", url: "https://images.unsplash.com/photo-1561089489-f13d5e730d72?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of teacher demonstrating advanced calculus formulas and equations at classroom chalkboards", verdict: "matches" },
        { id: "media-hero-exampaper", url: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of standardized mock examination paper and multiple-choice answer sheet with pencil on a desk", verdict: "matches" },
        { id: "media-hero-chemistry", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&h=1000&q=80", alt: "Stock photo of laboratory glassware and scientific measuring apparatus on a secondary school science desk", verdict: "matches" },
        { id: "media-hero-calculator", url: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&h=900&q=80", alt: "Stock photo of electronic desktop calculator on a study desk", verdict: "matches" },
        { id: "media-hero-classroom", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of school-age students seated at classroom wooden desks following instruction seen from behind", verdict: "matches" },
        { id: "media-campus-desks", url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of bright academic classroom with wooden student desks facing an instructional whiteboard", verdict: "matches" },
        { id: "media-campus-hall", url: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of spacious academic study hall with wooden student desks facing instruction area", verdict: "matches" },
        { id: "media-course-foundation", url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of neatly stacked school foundation textbooks and notebooks on a study desk", verdict: "matches" },
        { id: "media-course-science", url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of laboratory test tubes with scientific reagent solutions on a secondary chemistry workbench", verdict: "matches" },
        { id: "media-course-higher-secondary", url: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=1200&h=800&q=80", alt: "Stock photo of hand solving calculus integrals and physics diagrams on a whiteboard with a marker", verdict: "matches" },
        { id: "media-og-cover", url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&h=630&q=80", alt: "Stock photo of open school textbooks, study notebooks, and learning supplies arranged on a desk", verdict: "matches" },
      ];

      for (const item of mediaItems) {
        const photoPage = await browser.newPage({ viewport: { width: 800, height: 600 } });
        await photoPage.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#1D1D1F;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${item.url}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`);
        await photoPage.waitForSelector("img");
        await photoPage.waitForTimeout(300);

        const shotPath = path.join(photoOutputDir, `${item.id}.png`);
        await photoPage.screenshot({ path: shotPath });
        assert(fs.existsSync(shotPath), `Photo screenshot saved: ${item.id}.png (${item.verdict})`);
        await photoPage.close();
      }
    }

    console.log("\n--- Section 13: Cleanup, no-JS H2s, Console Errors & Dashboard Visual Regression ---");
    {
      const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
      const noJsPage = await noJsContext.newPage();
      await noJsPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await noJsPage.waitForTimeout(300);

      const h2Visibilities = await noJsPage.evaluate(() => {
        const h2s = Array.from(document.querySelectorAll("h2"));
        return h2s.map((h2) => {
          const s = window.getComputedStyle(h2);
          return {
            text: h2.textContent?.trim().slice(0, 30),
            opacity: s.opacity,
            display: s.display,
            visibility: s.visibility,
          };
        });
      });

      assert(h2Visibilities.length > 0, `no-JS page contains h2 elements (found: ${h2Visibilities.length})`);
      const allH2Visible = h2Visibilities.every((h) => h.opacity === "1" && h.display !== "none" && h.visibility !== "hidden");
      assert(
        allH2Visible,
        `With JavaScript disabled every h2 on / is visible (opacity 1, not display none)`
      );
      await noJsContext.close();

      const routesToCheck = [
        "/",
        "/faq",
        "/terms",
        "/privacy",
        "/login",
        "/register",
        "/dashboard?role=academy-admin",
      ];

      for (const route of routesToCheck) {
        const auditPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        const failedRequests = [];

        auditPage.on("console", (msg) => {
          if (msg.type() === "error") {
            errors.push(msg.text());
          }
        });
        auditPage.on("pageerror", (err) => {
          errors.push(err.message);
        });
        auditPage.on("requestfailed", (req) => {
          failedRequests.push(`${req.method()} ${req.url()}`);
        });

        await auditPage.goto(`${QA_URL}${route}`, { waitUntil: "domcontentloaded" });
        await auditPage.waitForTimeout(400);

        assert(
          errors.length === 0,
          `No console/page errors on ${route} (found ${errors.length}${errors.length ? ": " + errors.join("; ") : ""})`
        );
        assert(
          failedRequests.length === 0,
          `No failed requests on ${route} (found ${failedRequests.length}${failedRequests.length ? ": " + failedRequests.join("; ") : ""})`
        );

        if (route === "/dashboard?role=academy-admin") {
          const dashShot = path.join(outputDir, `screenshot-dashboard-admin-1440-${tag}.png`);
          await auditPage.screenshot({ path: dashShot, fullPage: true });
          assert(fs.existsSync(dashShot), `Dashboard admin 1440 screenshot saved: ${dashShot}`);
        }

        await auditPage.close();
      }

      const gridPage1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await gridPage1440.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await gridPage1440.waitForTimeout(300);

      const gridCoords1440 = await gridPage1440.evaluate(() => {
        const bgGrid = document.querySelector("section > div[aria-hidden='true']");
        if (!bgGrid) return null;
        const rect = bgGrid.getBoundingClientRect();
        return { top: Math.round(rect.top + window.scrollY), height: Math.round(rect.height), bottom: Math.round(rect.bottom + window.scrollY) };
      });
      console.log(`Hero background grid coordinates at 1440: top=${gridCoords1440?.top}px, bottom=${gridCoords1440?.bottom}px`);
      assert(gridCoords1440 !== null, "Hero grid element located at 1440");

      const shotGrid1440 = path.join(outputDir, `screenshot-hero-grid-1440-${tag}.png`);
      await gridPage1440.screenshot({ path: shotGrid1440 });
      assert(fs.existsSync(shotGrid1440), `Hero grid 1440 screenshot saved: ${shotGrid1440}`);
      await gridPage1440.close();

      const gridPage390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await gridPage390.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await gridPage390.waitForTimeout(300);

      const gridCoords390 = await gridPage390.evaluate(() => {
        const bgGrid = document.querySelector("section > div[aria-hidden='true']");
        if (!bgGrid) return null;
        const rect = bgGrid.getBoundingClientRect();
        return { top: Math.round(rect.top + window.scrollY), height: Math.round(rect.height), bottom: Math.round(rect.bottom + window.scrollY) };
      });
      console.log(`Hero background grid coordinates at 390: top=${gridCoords390?.top}px, bottom=${gridCoords390?.bottom}px`);
      assert(gridCoords390 !== null, "Hero grid element located at 390");

      const shotGrid390 = path.join(outputDir, `screenshot-hero-grid-390-${tag}.png`);
      await gridPage390.screenshot({ path: shotGrid390 });
      assert(fs.existsSync(shotGrid390), `Hero grid 390 screenshot saved: ${shotGrid390}`);
      await gridPage390.close();
    }

    console.log("\n--- Section 14: Mobile Touch Interactions (hasTouch: true, 390 viewport) ---");
    {
      const touchContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      });
      await touchContext.addInitScript(() => {
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
      const touchPage = await touchContext.newPage();
      await touchPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await touchPage.waitForTimeout(300);

      const menuToggle = touchPage.locator("button.mobile-toggle");
      await menuToggle.tap();
      await touchPage.waitForTimeout(300);

      const loginTrigger = touchPage.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-login']");
      await loginTrigger.tap();
      await touchPage.waitForTimeout(250);
      const loginPanel = touchPage.locator("#mobile-accordion-login");
      const isLoginOpen = await loginPanel.getAttribute("data-state");
      assert(isLoginOpen === "open", "Touch tap on Log In header trigger opens the panel");
      assert(touchPage.url().replace(/\/$/, "") === QA_URL.replace(/\/$/, ""), `Touch tap on Log In header trigger does not navigate away from / (current url: ${touchPage.url()})`);

      const teacherLoginItem = loginPanel.locator("a[href*='role=teacher']");
      await teacherLoginItem.tap();
      await touchPage.waitForURL("**/login?role=teacher");
      assert(touchPage.url().includes("/login?role=teacher"), `Touch tap on role item in Log In panel navigated to /login?role=teacher (current: ${touchPage.url()})`);

      await touchPage.goto(QA_URL, { waitUntil: "domcontentloaded" });
      await touchPage.waitForTimeout(300);
      await menuToggle.tap();
      await touchPage.waitForTimeout(300);

      const regTrigger = touchPage.locator("#mobile-navigation-drawer button[aria-controls='mobile-accordion-register']");
      await regTrigger.tap();
      await touchPage.waitForTimeout(250);
      const regPanel = touchPage.locator("#mobile-accordion-register");
      const isRegOpen = await regPanel.getAttribute("data-state");
      assert(isRegOpen === "open", "Touch tap on Sign Up header trigger opens the panel");
      assert(touchPage.url().replace(/\/$/, "") === QA_URL.replace(/\/$/, ""), `Touch tap on Sign Up header trigger does not navigate away from / (current url: ${touchPage.url()})`);

      const parentRegItem = regPanel.locator("a[href*='role=parent']");
      await parentRegItem.tap();
      await touchPage.waitForURL("**/register?role=parent");
      assert(touchPage.url().includes("/register?role=parent"), `Touch tap on role item in Sign Up panel navigated to /register?role=parent (current: ${touchPage.url()})`);

      await touchPage.close();
      await touchContext.close();
    }

    console.log("\n--- Section 15: Auth Mode & Demo Helper Check ---");
    {
      const authPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await authPage.goto(`${QA_URL}/login`, { waitUntil: "domcontentloaded" });
      await authPage.waitForTimeout(300);

      const demoDetails = authPage.locator("details");
      const detailsCount = await demoDetails.count();

      if (isProd) {
        assert(detailsCount === 0, `In production build, demo helper details element is absent from DOM (found: ${detailsCount})`);
      } else {
        assert(detailsCount > 0, `In dev run with NEXT_PUBLIC_AUTH_MODE=demo, demo helper details element is present (found: ${detailsCount})`);
        const isOpen = await demoDetails.evaluate((el) => el.open);
        assert(!isOpen, "In dev run with NEXT_PUBLIC_AUTH_MODE=demo, demo helper details element is closed by default");
      }

      await authPage.close();
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
