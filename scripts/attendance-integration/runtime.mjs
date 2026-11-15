import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createServer, connect } from "node:net";
import { randomBytes } from "node:crypto";
import { neonConfig, Pool } from "@neondatabase/serverless";
import WebSocket, { WebSocketServer } from "ws";

export async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

export async function startDatabase() {
  const bin = process.env.LOCAL_POSTGRES_BIN ?? "/opt/homebrew/opt/postgresql@17/bin";
  assert.ok(existsSync(join(bin, "initdb")), "A local PostgreSQL installation is required");
  const root = mkdtempSync("/private/tmp/aroush-attendance-pg-");
  const marker = randomBytes(16).toString("hex");
  writeFileSync(join(root, "owner"), marker, { mode: 0o600 });
  const data = join(root, "data");
  const password = randomBytes(24).toString("hex");
  const pwfile = join(root, "password");
  writeFileSync(pwfile, password, { mode: 0o600 });
  let port;
  const clients = new Set();
  let bridge;
  let pool;
  const close = async () => {
    assert.equal(readFileSync(join(root, "owner"), "utf8"), marker);
    await pool?.end();
    for (const socket of clients) socket.terminate();
    if (bridge) await new Promise((resolve) => bridge.close(resolve));
    if (existsSync(join(data, "postmaster.pid"))) {
      execFileSync(join(bin, "pg_ctl"), ["-D", data, "-m", "fast", "-w", "stop"], { stdio: "pipe" });
    }
    rmSync(root, { recursive: true, force: true });
    console.log("PASS: stopped and removed only the task-owned PostgreSQL cluster, local bridge and temporary app workspace");
  };
  try {
    execFileSync(join(bin, "initdb"), ["-D", data, "-U", "attendance_owner", "--auth-host=scram-sha-256",
      "--auth-local=trust", "--pwfile", pwfile, "--no-locale", "-E", "UTF8"], { stdio: "pipe" });
    port = await freePort();
    execFileSync(join(bin, "pg_ctl"), ["-D", data, "-l", join(root, "postgres.log"), "-w", "start", "-o",
      `-h 127.0.0.1 -p ${port} -k ${root} -c timezone=UTC -c unix_socket_permissions=0700`], { stdio: "pipe" });
    bridge = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    await new Promise((resolve, reject) => { bridge.once("listening", resolve); bridge.once("error", reject); });
    bridge.on("connection", (socket) => {
      clients.add(socket);
      const tcp = connect({ host: "127.0.0.1", port });
      socket.on("message", (message) => tcp.write(message));
      tcp.on("data", (message) => { if (socket.readyState === WebSocket.OPEN) socket.send(message); });
      tcp.on("error", () => socket.close());
      tcp.on("close", () => socket.close());
      socket.on("error", () => tcp.destroy());
      socket.on("close", () => { tcp.destroy(); clients.delete(socket); });
    });
    const proxyPort = bridge.address().port;
    neonConfig.webSocketConstructor = WebSocket;
    neonConfig.wsProxy = () => `127.0.0.1:${proxyPort}`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.pipelineConnect = false;
    neonConfig.poolQueryViaFetch = false;
    const database = "attendance_integration";
    const localUrl = (user, db = database) => {
      const url = new URL(`postgresql://${user}:${password}@127.0.0.1:${port}/${db}`);
      assert.equal(url.hostname, "127.0.0.1");
      assert.equal(url.port, String(port));
      assert.ok([database, "postgres"].includes(url.pathname.slice(1)));
      return url.href;
    };
    const bootstrap = new Pool({ connectionString: localUrl("attendance_owner", "postgres") });
    try { await bootstrap.query(`CREATE DATABASE ${database}`); } finally { await bootstrap.end(); }
    pool = new Pool({ connectionString: localUrl("attendance_owner") });
    const result = await pool.query("SELECT current_database() AS name, inet_server_addr()::text AS host");
    assert.deepEqual(result.rows, [{ name: database, host: "127.0.0.1/32" }]);
    console.log(`PASS: disposable PostgreSQL on loopback, fresh ${database}, server timezone UTC`);
    return { pool, root, port, bin, proxyPort, close, database, appUrl: localUrl("attendance_app"), password };
  } catch (error) {
    await close();
    throw error;
  }
}
