import { hashPassword, verifyPassword } from "../src/lib/auth/password";

async function main() {
  const dummyPassword = "SamplePassword123!";
  let lastHash = "";

  for (let i = 1; i <= 3; i++) {
    const start = performance.now();
    const hash = await hashPassword(dummyPassword);
    const duration = performance.now() - start;
    lastHash = hash;
    console.log(`Hash run ${i}: ${duration.toFixed(2)} ms`);
  }

  const roundTripValid = await verifyPassword(dummyPassword, lastHash);
  console.log(`Round trip verification: ${roundTripValid ? "PASS" : "FAIL"}`);

  const wrongPasswordValid = await verifyPassword("WrongPassword456!", lastHash);
  console.log(`Wrong password rejected: ${!wrongPasswordValid ? "PASS" : "FAIL"}`);

  if (!roundTripValid || wrongPasswordValid) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
