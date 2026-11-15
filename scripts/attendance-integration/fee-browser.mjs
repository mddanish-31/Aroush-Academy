import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function verifyFeeBrowser(base, fixture) {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const contexts = [];
      const open = async (account) => {
        const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
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
        await admin.getByRole("heading", { name: "Fees and receipts" }).waitFor();
        await admin.getByRole("heading", { name: "Central receiving details" }).waitFor();
        const create = admin.getByRole("heading", { name: "Create obligation" }).locator("..");
        await create.getByLabel("Enrollment").selectOption(await create.locator("option").filter({ hasText: "Test Child a" }).first().getAttribute("value"));
        await create.getByLabel("Period").fill(`Browser Fee ${width}`);
        await create.getByLabel("Amount in rupees").fill("90.00");
        await create.getByRole("button", { name: "Create obligation" }).click();
        await admin.getByRole("heading", { name: "Obligations and dues" }).locator("..").getByText(`Browser Fee ${width}, due`, { exact: false }).waitFor();
        const cash = admin.getByRole("heading", { name: "Record cash collection" }).locator("..");
        await cash.getByLabel("Obligation").selectOption(await cash.locator("option").filter({ hasText: `Browser Fee ${width}` }).getAttribute("value"));
        await cash.getByLabel("Collected amount in rupees").fill("30.00");
        await cash.getByRole("button", { name: "Issue cash receipt" }).click();
        await admin.getByRole("heading", { name: "Obligations and dues" }).locator("..").getByText(`Browser Fee ${width}, due`, { exact: false }).waitFor();
        const student = await open(fixture.accounts.a);
        await student.locator(".server-navigation").getByRole("button", { name: "Fee Receipts & History" }).click();
        const card = student.getByRole("heading", { name: `Browser Fee ${width}` }).locator("..");
        await card.getByText("Balance ₹60.00", { exact: false }).waitFor();
        await student.getByText(/FEE-\d{4}-\d{6}: Test Child a, ₹30.00 by cash/).first().waitFor();
        const qr = card.getByRole("img", { name: /UPI QR/ });
        const qrResponse = await student.request.get(new URL(await qr.getAttribute("src"), base).toString());
        assert.equal(qrResponse.status(), 200);
        assert.match(await qrResponse.text(), /<svg/);
        assert.match(await card.getByRole("link", { name: /Open in UPI app/ }).getAttribute("href"), /^upi:\/\/pay\?pa=fixture%40upi.test&pn=Synthetic/);
        const download = student.waitForEvent("download");
        await card.getByRole("link", { name: "Download QR" }).click();
        assert.match((await download).suggestedFilename(), /aroush-fee-qr.svg/);
        await card.getByRole("button", { name: "Copy UPI ID" }).click();
        await card.getByText("UPI ID copied.").waitFor();
        await student.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("denied"); }; });
        await card.getByRole("button", { name: "Copy UPI ID" }).click();
        await card.getByText("Could not copy.", { exact: false }).waitFor();
        const parent = await open(fixture.accounts.parent);
        await parent.locator(".server-navigation").getByRole("button", { name: "Fee Receipts & Ledger" }).click();
        const parentCard = parent.getByRole("heading", { name: `Browser Fee ${width}` }).locator("..");
        await parentCard.getByText("Balance ₹60.00", { exact: false }).waitFor();
        await parentCard.getByLabel("Intended amount in rupees").fill("20.00");
        await parentCard.getByLabel("UPI reference").fill(`BROWSER-${width}`);
        await parentCard.getByRole("button", { name: "Submit for review" }).click();
        await parentCard.getByText(`UPI reference BROWSER-${width}: pending`, { exact: false }).waitFor();
        await parentCard.getByText("Balance ₹60.00", { exact: false }).waitFor();
        await admin.reload();
        const pending = admin.getByText(`reference BROWSER-${width}, transfer date`, { exact: false }).locator("..");
        await pending.getByText("Do not approve based only", { exact: false }).waitFor();
        await pending.getByLabel("I checked settlement in the receiving account").check();
        await pending.getByRole("button", { name: "Verify and issue receipt" }).click();
        await pending.waitFor({ state: "hidden" });
        await parent.reload();
        await parent.locator(".server-navigation").getByRole("button", { name: "Fee Receipts & Ledger" }).click();
        await parent.getByRole("heading", { name: `Browser Fee ${width}` }).locator("..").getByText("Balance ₹40.00", { exact: false }).waitFor();
        assert.ok(await parent.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.ok(await admin.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      } finally { for (const context of contexts) await context.close(); }
    }
    console.log("PASS: authenticated Chromium desktop/mobile fee obligation, cash receipt, parent UPI review, QR download, clipboard success/failure and scoped balances; UPI app link inspected, not executed");
  } finally { await browser.close(); }
}
