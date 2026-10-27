import { pool } from "../src/db";

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
