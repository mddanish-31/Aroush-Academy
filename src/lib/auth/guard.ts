import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./cookie";
import { getSessionUser, SessionUser } from "./session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return await getSessionUser(token);
}

export async function requireRole(allowedRoles: string | string[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!rolesArray.includes(user.role)) {
    redirect("/login");
  }

  return user;
}
