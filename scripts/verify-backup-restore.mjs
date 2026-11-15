import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { startDatabase } from "./attendance-integration/runtime.mjs";

const runtime = await startDatabase();
try {
  await migrate(drizzle(runtime.pool), { migrationsFolder: "./drizzle" });
  await runtime.pool.query("CREATE TABLE restore_probe (marker text NOT NULL)");
  await runtime.pool.query("INSERT INTO restore_probe (marker) VALUES ($1)", ["synthetic-restore-ok"]);
  const options = ["-h", runtime.root, "-p", String(runtime.port), "-U", "attendance_owner"];
  const backup = join(runtime.root, "backup.dump");
  execFileSync(join(runtime.bin, "pg_dump"), [...options, "-Fc", "-f", backup, runtime.database], { stdio: "pipe" });
  execFileSync(join(runtime.bin, "createdb"), [...options, "restore_check"], { stdio: "pipe" });
  execFileSync(join(runtime.bin, "pg_restore"), [...options, "-d", "restore_check", backup], { stdio: "pipe" });
  const result = execFileSync(join(runtime.bin, "psql"), [...options, "-d", "restore_check", "-Atc", "SELECT marker FROM restore_probe"], { encoding: "utf8" }).trim();
  assert.equal(result, "synthetic-restore-ok");
  console.log("PASS: synthetic row restored into a second disposable database from a custom-format dump");
} finally {
  await runtime.close();
}
