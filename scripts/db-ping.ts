import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const pool = new Pool({ connectionString });

async function ping() {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      const result = await client.query<{ version: string }>("SELECT version()");
      console.log("db ok");
      console.log(result.rows[0].version);
    } finally {
      client.release();
    }
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

ping();
