import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function verifyBrowser(base, fixture) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/dashboard`);
      await page.waitForURL("**/login");
      const cookieChoice = page.getByRole("button", { name: "Reject Non-Essential" });
      if (await cookieChoice.isVisible()) await cookieChoice.click();
      await page.getByRole("textbox", { name: "Email Address or Mobile Phone" }).fill(fixture.accounts.parent.identifier);
      await page.locator("#signin-password").fill(fixture.password);
      await page.getByRole("button", { name: "Show password key" }).click();
      assert.equal(await page.locator("#signin-password").getAttribute("type"), "text");
      await page.getByRole("button", { name: "Hide password key" }).click();
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.getByLabel("Child", { exact: true }).waitFor();
      await page.locator(".server-navigation").getByRole("button", { name: "Attendance Record", exact: true }).click();
      await page.getByText("This summary covers only this page.", { exact: false }).waitFor();
      await page.getByText("No attendance marks in this date range.").waitFor({ state: "hidden" });
      if (width === 1440) {
        let release;
        let signalHeld;
        let signalFinished;
        let holdNext = true;
        const held = new Promise((resolve) => { signalHeld = resolve; });
        const finished = new Promise((resolve) => { signalFinished = resolve; });
        const gate = new Promise((resolve) => { release = resolve; });
        await page.route("**/api/attendance?**", async (route) => {
          if (holdNext && route.request().url().includes(fixture.accounts.b.studentId)) {
            holdNext = false;
            signalHeld();
            await gate;
            await route.continue().catch(() => {});
            signalFinished();
            return;
          }
          await route.continue();
        });
        await page.getByLabel("Child", { exact: true }).selectOption(fixture.accounts.b.studentId);
        await held;
        await page.getByLabel("Child", { exact: true }).selectOption(fixture.accounts.a.studentId);
        await page.getByText("Loaded page 1: 2 attended of 4 classes", { exact: false }).waitFor();
        release();
        await finished;
        assert.equal(await page.getByText("Loaded page 1: 0 attended of 1 classes", { exact: false }).count(), 0);
        await page.unroute("**/api/attendance?**");
      }
      await page.getByLabel("Child", { exact: true }).selectOption(fixture.accounts.b.studentId);
      await page.getByText("Loaded page 1: 0 attended of 1 classes").waitFor();
      await page.getByLabel("From", { exact: true }).fill("2024-02-29");
      await page.getByLabel("To", { exact: true }).fill("2024-02-29");
      await page.getByRole("button", { name: "Apply dates" }).click();
      await page.getByText("No attendance marks in this date range.").waitFor();
      if (await cookieChoice.isVisible()) await cookieChoice.click();
      await cookieChoice.waitFor({ state: "hidden" });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `/private/tmp/aroush-account-attendance-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await context.close();

      const adminContext = await browser.newContext({ viewport: { width, height: 900 } });
      await adminContext.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const adminPage = await adminContext.newPage();
      adminPage.on("pageerror", (error) => errors.push(error.message));
      await adminPage.goto(`${base}/login`);
      await adminPage.locator("#signin-identifier").fill(fixture.accounts.admin.identifier);
      await adminPage.locator("#signin-password").fill(fixture.password);
      await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
      await adminPage.locator(".server-navigation").getByRole("button", { name: "Account", exact: true }).click();
      await adminPage.getByLabel("Teacher name").fill("Browser Teacher");
      await adminPage.getByLabel("Email", { exact: true }).fill(`browser.teacher.${width}@synthetic.example.test`);
      await adminPage.getByRole("button", { name: "Create teacher" }).click();
      await adminPage.getByText("One-time code:", { exact: false }).waitFor();
      await adminPage.getByRole("link", { name: "Set up password" }).click();
      await adminPage.getByRole("heading", { name: "Set up your password" }).waitFor();
      assert.ok(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await adminContext.close();

      const studentContext = await browser.newContext({ viewport: { width, height: 900 } });
      await studentContext.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      const studentPage = await studentContext.newPage();
      studentPage.on("pageerror", (error) => errors.push(error.message));
      await studentPage.goto(`${base}/login`);
      await studentPage.locator("#signin-identifier").fill(fixture.accounts.a.identifier);
      await studentPage.locator("#signin-password").fill(fixture.password);
      await studentPage.getByRole("button", { name: "Sign in", exact: true }).click();
      await studentPage.locator(".server-navigation").getByRole("button", { name: "Attendance Record", exact: true }).click();
      await studentPage.getByText("Loaded page 1: 2 attended of 4 classes", { exact: false }).waitFor();
      assert.equal(await studentPage.getByLabel("Child", { exact: true }).count(), 0);
      await studentPage.locator(".server-content").getByRole("button", { name: "Sign out" }).click();
      await studentPage.waitForURL("**/login");
      assert.deepEqual(errors, []);
      await studentContext.close();
    }
    console.log("PASS: real Chromium student/parent login, child attendance, date filtering, logout, admin teacher provisioning and activation entry at desktop/mobile sizes");
  } finally { await browser.close(); }
}
