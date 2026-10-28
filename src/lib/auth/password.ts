import { BinaryLike, randomBytes, scrypt, ScryptOptions, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: BinaryLike,
  salt: BinaryLike,
  keylen: number,
  options: ScryptOptions
) => Promise<Buffer>;

const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 268435456;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(plain, salt, SCRYPT_KEYLEN, {
    cost: SCRYPT_N,
    blockSize: SCRYPT_R,
    parallelization: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64")}$${derivedKey.toString("base64")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    if (typeof plain !== "string" || typeof stored !== "string") {
      return false;
    }

    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") {
      return false;
    }

    const n = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);

    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || n <= 1 || r <= 0 || p <= 0) {
      return false;
    }

    const salt = Buffer.from(parts[4], "base64");
    const expectedHash = Buffer.from(parts[5], "base64");

    if (salt.length === 0 || expectedHash.length === 0) {
      return false;
    }

    const derivedKey = await scryptAsync(plain, salt, expectedHash.length, {
      cost: n,
      blockSize: r,
      parallelization: p,
      maxmem: SCRYPT_MAXMEM,
    });

    if (derivedKey.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedHash);
  } catch {
    return false;
  }
}
