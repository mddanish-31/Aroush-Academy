import { UserRole } from "@/types";
import { AuthUser } from "./authTypes";

const VALID_USER_ROLES: readonly UserRole[] = [
  "academy-admin",
  "teacher",
  "student",
  "parent",
];

export function isValidAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
    return false;
  }
  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    return false;
  }
  if (
    typeof candidate.role !== "string" ||
    !VALID_USER_ROLES.includes(candidate.role as UserRole)
  ) {
    return false;
  }
  return true;
}

export function parseStoredAuthUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (isValidAuthUser(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
