import { isValidAuthUser } from "./authGuard";
import type { DashboardProfile, ServerAuthState, ServerIdentity } from "./profileTypes";

function isProfile(value: unknown): value is DashboardProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.id === "string" && profile.id.trim().length > 0
    && typeof profile.name === "string" && profile.name.trim().length > 0
    && (profile.admissionNumber === undefined || typeof profile.admissionNumber === "string");
}

function isServerIdentity(value: unknown): value is ServerIdentity {
  if (!isValidAuthUser(value)) return false;
  const user = value as ServerIdentity;
  if (typeof user.identifier !== "string"
    || (user.profile !== null && !isProfile(user.profile))
    || !Array.isArray(user.children) || !user.children.every(isProfile)
    || (user.profileStatus !== "ready" && user.profileStatus !== "missing")) return false;
  if (user.role === "academy-admin" || user.role === "developer") {
    return user.profile === null && user.children.length === 0 && user.profileStatus === "ready";
  }
  if (user.role !== "parent" && user.children.length > 0) return false;
  if (user.role === "parent" && !user.profile && user.children.length > 0) return false;
  const missing = !user.profile || (user.role === "parent" && user.children.length === 0);
  return user.profileStatus === (missing ? "missing" : "ready");
}

export async function loadServerIdentity(
  request: typeof fetch = fetch,
): Promise<ServerAuthState> {
  try {
    const response = await request("/api/auth/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 401) return { status: "unauthenticated" };
    if (!response.ok) return { status: "error" };
    const data = await response.json();
    if (data?.ok !== true || !isServerIdentity(data.user)) return { status: "error" };
    return { status: "authenticated", user: data.user };
  } catch {
    return { status: "error" };
  }
}
