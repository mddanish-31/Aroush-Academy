import { spawn } from "node:child_process";
import { createWriteStream, writeFileSync, readFileSync, mkdirSync, symlinkSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { freePort } from "./runtime.mjs";

export async function startHttp(runtime, clock) {
  const httpPort = await freePort();
  const project = join(runtime.root, "app");
  mkdirSync(project);
  cpSync(resolve("src"), join(project, "src"), { recursive: true });
  symlinkSync(resolve("node_modules"), join(project, "node_modules"));
  cpSync(resolve("package.json"), join(project, "package.json"));
  const tsconfig = join(project, "tsconfig.json");
  const tsconfigData = JSON.parse(readFileSync("tsconfig.json", "utf8"));
  tsconfigData.compilerOptions.incremental = false;
  writeFileSync(tsconfig, JSON.stringify(tsconfigData));
  const { default: baseConfig } = await import("../../next.config.ts");
  writeFileSync(join(project, "next.config.mjs"), `export default ${JSON.stringify({ ...baseConfig, distDir: ".next", serverExternalPackages: ["@neondatabase/serverless", "ws"], typescript: { tsconfigPath: "./tsconfig.json" } })};\n`);
  const config = join(runtime.root, "http-config.json");
  writeFileSync(config, JSON.stringify({ appUrl: runtime.appUrl, proxyPort: runtime.proxyPort, httpPort, clock }), { mode: 0o600 });
  const logPath = resolve("qa-output/attendance-postgres-server.log");
  const log = createWriteStream(logPath, { mode: 0o600 });
  const child = spawn(process.execPath, [resolve("scripts/attendance-integration/http-server.mjs")], {
    cwd: project,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
      NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_AUTH_MODE: "server", TZ: "UTC",
      LOCAL_ATTENDANCE_CONFIG: config,
      NODE_OPTIONS: `--import ${pathToFileURL(resolve("scripts/attendance-integration/configure-driver.mjs")).href}`,
      DATABASE_URL: runtime.appUrl, DATABASE_URL_UNPOOLED: runtime.appUrl, TEST_DATABASE_URL: runtime.appUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolveExit) => {
        const timeout = setTimeout(() => child.kill("SIGKILL"), 10000);
        child.once("exit", () => { clearTimeout(timeout); resolveExit(); });
      });
    }
    log.end();
  };
  try {
    await new Promise((resolveReady, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Local Next.js startup timed out; see ${logPath}`)), 45000);
      child.stdout.on("data", (chunk) => {
        if (chunk.toString().includes("ATTENDANCE_LOCAL_READY")) { clearTimeout(timeout); resolveReady(); }
      });
      child.once("error", (error) => { clearTimeout(timeout); reject(error); });
      child.once("exit", (code) => { clearTimeout(timeout); reject(new Error(`Local Next.js exited ${code}; see ${logPath}`)); });
    });
    console.log("PASS: real Next.js HTTP server uses only the disposable PostgreSQL database via local WebSockets");
    return { baseUrl: `http://127.0.0.1:${httpPort}`, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
