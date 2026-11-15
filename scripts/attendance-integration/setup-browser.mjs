import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function verifySetupBrowser(base, fixture) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const contexts = [];
      const open = async (account) => {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        contexts.push(context);
        await context.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
        const page = await context.newPage();
        await page.goto(`${base}/login`);
        const consent = page.getByRole("button", { name: "Reject Non-Essential" });
        if (await consent.isVisible()) await consent.click();
        await page.locator("#signin-identifier").fill(account.identifier);
        await page.locator("#signin-password").fill(fixture.password);
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await page.locator(".server-navigation").waitFor();
        return page;
      };
      try {
        const admin = await open(fixture.accounts.admin);
        await admin.locator(".server-navigation").getByRole("button", { name: "Academic Setup & Batches" }).click();
        await admin.getByRole("heading", { name: "Academy setup and assignments" }).waitFor();
        
        const classCard = admin.getByRole("heading", { name: "Academic class" }).locator("..");
        await classCard.locator('input[name="name"]').fill("Duplicate browser class");
        await classCard.locator('input[name="code"]').fill("SYN-ADV");
        await classCard.getByRole("button", { name: "Add class" }).click();
        await admin.getByRole("alert").getByText("This record changed or already exists. Reload before editing.").waitFor();
        assert.equal(await classCard.getByText("Duplicate browser class").count(), 0);
        const card = admin.getByRole("heading", { name: "Batches", exact: true }).locator("..");
        await card.getByRole("textbox", { name: "Name" }).fill(`Browser Batch ${width}`);
        await card.locator('select[name="classId"]').selectOption({ label: "Synthetic Advanced" });
        await card.locator('select[name="boardId"]').selectOption({ label: "Synthetic Board" });
        
        // Use selectOption for subject (handles React controlled components)
        await card.locator('select[name="subjectId"]').selectOption({ label: "Synthetic Subject" });
        
        // Wait for teacher dropdown to be enabled (depends on subjectId state)
        await admin.waitForFunction(() => {
          const select = document.querySelector('select[name="teacherId"]');
          return select && !select.disabled;
        }, { timeout: 15000 });
        
        const subjectValue = await card.locator('select[name="subjectId"]').inputValue();
        console.log("Selected subject value:", subjectValue);
        
        // Wait for teacher options to populate
        await admin.waitForFunction(() => {
          const select = document.querySelector('select[name="teacherId"]');
          return select && select.options.length > 1;
        }, { timeout: 15000 });
        const teacherOptions = await card.locator('select[name="teacherId"] option').allTextContents();
        console.log("Teacher options:", teacherOptions);
        await card.locator('select[name="teacherId"]').selectOption({ label: "Synthetic Teacher" });
        await card.locator('input[name="capacity"]').fill("12");
        await card.getByRole("button", { name: "Create batch" }).click();
        await card.getByText(`Browser Batch ${width}`).waitFor();
        const students = admin.getByRole("heading", { name: "Students and enrollments" }).locator("..");
        await students.locator('select[name="studentId"]').selectOption(fixture.accounts.a.studentId);
        await students.locator('select[name="batchId"]').selectOption({ label: `Browser Batch ${width}` });
        await students.locator('input[name="monthlyFee"]').fill("1200");
        await students.getByRole("button", { name: "Enroll student" }).click();
        await students.getByText(`Browser Batch ${width} (active)`, { exact: false }).waitFor();

        const teacher = await open(fixture.accounts.newTeacher);
        await teacher.locator(".server-navigation").getByRole("button", { name: "My Students" }).click();
        await teacher.getByRole("heading", { name: `Browser Batch ${width}` }).waitFor();
        await teacher.getByText("Test Child a (TEST-a)", { exact: false }).first().waitFor();
        const student = await open(fixture.accounts.a);
        await student.locator(".server-navigation").getByRole("button", { name: "Enrolled Subjects" }).click();
        await student.getByRole("heading", { name: `Browser Batch ${width}` }).waitFor();
        const parent = await open(fixture.accounts.parent);
        await parent.locator(".server-navigation").getByRole("button", { name: "Child's Subjects" }).click();
        await parent.getByRole("heading", { name: `Browser Batch ${width}` }).waitFor();
        await parent.getByLabel("Child", { exact: true }).selectOption(fixture.accounts.b.studentId);
        await parent.getByRole("heading", { name: `Browser Batch ${width}` }).waitFor({ state: "hidden" });
        await parent.getByLabel("Child", { exact: true }).selectOption(fixture.accounts.a.studentId);
        await parent.getByRole("heading", { name: `Browser Batch ${width}` }).waitFor();
        assert.ok(await parent.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await admin.reload();
        await admin.locator(".server-navigation").getByRole("button", { name: "Academic Setup & Batches" }).click();
        await admin.getByText(`Browser Batch ${width}`).waitFor();
        assert.ok(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      } finally { for (const context of contexts) await context.close(); }
    }
    console.log("PASS: real Chromium admin batch and enrollment persist for independent teacher, student and parent sessions at desktop/mobile sizes");
  } finally { await browser.close(); }
}