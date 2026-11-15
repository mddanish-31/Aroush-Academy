import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { readJsonBounded, sameOrigin } from "../src/lib/auth/requestSafety.ts";

const request = (body, origin = "http://localhost:3000", url = "http://localhost:3000/api/auth/login") =>
  new NextRequest(url, { method: "POST", headers: { origin }, body });

assert.equal(sameOrigin(request("{}")), true);
assert.equal(sameOrigin(request("{}", "http://evil.example")), false);
assert.equal(sameOrigin(request("{}", "https://localhost:3000")), false);
assert.equal(sameOrigin(request("{}", "http://localhost:3000", "http://evil.example/api/auth/login")), false);
assert.equal(sameOrigin(request("{}", "http://academy.example", "http://academy.example/api/auth/login")), false);
assert.equal(sameOrigin(new NextRequest("http://localhost:3000/api/auth/login", {
  method: "POST", headers: { origin: "http://127.0.0.1:3017", host: "127.0.0.1:3017" }, body: "{}",
})), true);
assert.deepEqual(await readJsonBounded(request('{"ok":true}'), 32), { ok: true });
await assert.rejects(() => readJsonBounded(request('{"value":"' + "x".repeat(40) + '"}'), 32), /invalid_request/);
await assert.rejects(() => readJsonBounded(request("{"), 32), SyntaxError);
console.log("Safety request boundary checks passed");
