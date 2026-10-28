import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

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

const pool = new Pool({ connectionString: testUrl });
const db = drizzle(pool);

async function run() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("migrated test db");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    try {
      await pool.end();
    } catch {
    }
    process.exit(1);
  }
}

run();
