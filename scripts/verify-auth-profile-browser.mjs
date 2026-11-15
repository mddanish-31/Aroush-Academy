import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.PROFILE_TEST_URL ?? "http://127.0.0.1:3017";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname));
const browser = await chromium.launch({ headless: true, channel: process.env.PROFILE_TEST_BROWSER ?? "chrome" });
const context = await browser.newContext();
await context.addCookies([{ name: "aroush_session", value: "isolated-fixture", url: baseUrl }]);
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let payload;
let status = 200;
let hold;
let release;
await context.addInitScript(() => {
  window.profileTestDemoAccesses = [];
  for (const method of ["getItem", "setItem", "removeItem"]) {
    const original = Storage.prototype[method];
    Storage.prototype[method] = function (key, ...args) {
      if (String(key).startsWith("aroush_demo_")) {
        window.profileTestDemoAccesses.push(key);
        throw new Error("Server workspace accessed demo storage");
      }
      return original.call(this, key, ...args);
    };
  }
});
await context.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.origin !== new URL(baseUrl).origin) return route.abort();
  if (url.pathname === "/api/auth/me") {
    if (hold) await hold;
    return route.fulfill({ status, json: payload });
  }
  if (url.pathname === "/api/auth/login") {
    return route.fulfill({ json: { ok: true, role: "academy-admin", name: "Untrusted login identity" } });
  }
  if (url.pathname === "/api/auth/logout") return route.fulfill({ json: { ok: true } });
  if (url.pathname.startsWith("/api/")) {
    return route.fulfill({ status: 503, json: { ok: false } });
  }
  return route.continue();
});

const identity = (role) => ({
  id: `user-${role}`, role, name: `Account ${role}`, identifier: `${role}@example.test`,
  profile: role === "academy-admin" ? null : { id: `own-${role}`, name: `Own ${role}` },
  children: role === "parent" ? [
    { id: "child-a", name: "Child Alpha", admissionNumber: "TEST-A" },
    { id: "child-b", name: "Child Beta", admissionNumber: "TEST-B" },
  ] : [],
  profileStatus: "ready",
});
const open = async (user, responseStatus = 200) => {
  payload = { ok: responseStatus === 200, user };
  status = responseStatus;
  await page.goto(`${baseUrl}/dashboard?role=academy-admin&profileId=other&childId=unlinked`);
};
const visible = (text) => page.getByText(text, { exact: true }).waitFor();
const noDemo = async () => assert.deepEqual(await page.evaluate(() => window.profileTestDemoAccesses), []);

try {
  hold = new Promise((resolve) => { release = resolve; });
  await open(identity("student"));
  await visible("Loading your workspace...");
  release();
  hold = null;
  await page.getByRole("heading", { name: "Own student", exact: true }).waitFor();
  console.log("PASS: loading remains distinct until the server identity arrives");

  for (const role of ["student", "teacher", "parent", "academy-admin"]) {
    await open(identity(role));
    await page.getByRole("heading", { name: role === "academy-admin" ? `Account ${role}` : `Own ${role}`, exact: true }).waitFor();
    const tabs = await page.locator(".server-navigation nav button").allTextContents();
    for (const tab of tabs) {
      await page.locator(".server-navigation").getByRole("button", { name: tab, exact: true }).click();
      if (role === "academy-admin" && ["Registrations", "Registration Approvals"].includes(tab)) {
        await visible("Could not load registration requests.");
        continue;
      }
      await visible(tab.startsWith("Overview")
        ? "Attendance, fees, results and other academic records are currently unavailable."
        : "This module is currently unavailable for your account.");
    }
    assert.equal(await page.getByText("Untrusted login identity", { exact: true }).count(), 0);
    await noDemo();
  }
  console.log("PASS: every role and unsupported module uses server identity without demo storage or records");

  await open(identity("parent"));
  await page.getByLabel("Child", { exact: true }).waitFor();
  assert.deepEqual(await page.locator("#workspace-child option").allTextContents(), ["Child Alpha", "Child Beta"]);
  await page.getByLabel("Child", { exact: true }).selectOption("child-b");
  await visible("Admission number: TEST-B");
  assert.equal(await page.getByText("Admission number: TEST-A", { exact: true }).count(), 0);
  await noDemo();
  await page.screenshot({ path: "/private/tmp/aroush-profile-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/private/tmp/aroush-profile-mobile.png" });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  }
  console.log("PASS: parent selects only authorized children; workspace fits 320, 768, 1024 and 1440px");

  for (const role of ["student", "teacher", "parent"]) {
    await open({ ...identity(role), profile: null, children: [], profileStatus: "missing" });
    await visible("Your account setup is incomplete. Contact the academy.");
    assert.equal(await page.locator(".server-navigation").count(), 0);
    await noDemo();
  }
  await open({ ...identity("parent"), children: [], profileStatus: "missing" });
  await visible("Your account setup is incomplete. Contact the academy.");
  assert.equal(await page.getByLabel("Child", { exact: true }).count(), 0);
  console.log("PASS: missing profiles and parents without children show setup state without substitution");

  await open(null, 401);
  await visible("Sign in to access your workspace.");
  await noDemo();
  await open(null, 503);
  await visible("We could not load your account. Please try again.");
  payload = { ok: true, user: identity("teacher") };
  status = 200;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("heading", { name: "Own teacher", exact: true }).waitFor();
  await noDemo();
  console.log("PASS: unauthorized and server errors stay distinct; retry loads only server identity");

  status = 503;
  payload = { ok: false };
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email Address or Mobile Phone").fill("isolated@example.test");
  await page.locator("#signin-password").fill("isolated-test-password");
  await page.locator('button[type="submit"]').click();
  await visible("Could not load your account. Please try again.");
  assert.equal(new URL(page.url()).pathname, "/login");
  await noDemo();
  assert.deepEqual(errors, []);
  console.log("PASS: successful login with failed profile loading never fabricates identity; no browser exceptions");
} finally {
  await browser.close();
}
