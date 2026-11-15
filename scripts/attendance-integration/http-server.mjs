import { createServer } from "node:http";
import next from "next";
import { config } from "./configure-driver.mjs";

process.env.NEXT_PUBLIC_AUTH_MODE = "server";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const app = next({
  dev: true, webpack: true, hostname: "127.0.0.1", port: config.httpPort,
});
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((request, response) => handle(request, response));
await new Promise((resolve) => server.listen(config.httpPort, "127.0.0.1", resolve));
console.log("ATTENDANCE_LOCAL_READY");
process.once("SIGTERM", async () => {
  server.close();
  await app.close();
  process.exit(0);
});
