import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const testUrl = process.env.TEST_DATABASE_URL;
const mainUrl = process.env.DATABASE_URL;
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED;

if (!testUrl || testUrl.trim() === "") {
  console.error("TEST_DATABASE_URL is empty or missing");
  process.exit(1);
}

if (testUrl === mainUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL");
  process.exit(1);
}

if (testUrl === unpooledUrl) {
  console.error("TEST_DATABASE_URL must not equal DATABASE_URL_UNPOOLED");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: testUrl,
  DATABASE_URL_UNPOOLED: testUrl,
  NEXT_PUBLIC_AUTH_MODE: "server",
  NEXT_DIST_DIR: ".next-test",
  PORT: "3005",
};

const nextBin = path.resolve(process.cwd(), "node_modules", ".bin", "next");

const child = spawn(nextBin, ["dev", "--port", "3005"], {
  env,
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
