import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { neonConfig } from "@neondatabase/serverless";

export const config = JSON.parse(readFileSync(process.env.LOCAL_ATTENDANCE_CONFIG, "utf8"));
const url = new URL(config.appUrl);
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.pathname, "/attendance_integration");
assert.equal(url.username, "attendance_app");
assert.ok(Number.isInteger(config.proxyPort) && config.proxyPort > 0);
if (config.clock) {
  const timestamp = Date.parse(config.clock);
  assert.ok(Number.isFinite(timestamp));
  const RealDate = Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [timestamp])); }
    static now() { return timestamp; }
    static parse(value) { return RealDate.parse(value); }
    static UTC(...args) { return RealDate.UTC(...args); }
  };
}
for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "TEST_DATABASE_URL"]) process.env[key] = config.appUrl;
const require = createRequire(import.meta.url);
for (const driverConfig of [neonConfig, require("@neondatabase/serverless").neonConfig]) {
  driverConfig.wsProxy = () => `127.0.0.1:${config.proxyPort}`;
  driverConfig.useSecureWebSocket = false;
  driverConfig.pipelineConnect = false;
  driverConfig.poolQueryViaFetch = false;
}
