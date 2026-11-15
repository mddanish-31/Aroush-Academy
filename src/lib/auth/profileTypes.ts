import type { AuthUser } from "./authTypes";

export interface DashboardProfile {
  id: string;
  name: string;
  admissionNumber?: string;
}

export interface ServerIdentity extends AuthUser {
  profile: DashboardProfile | null;
  children: DashboardProfile[];
  profileStatus: "ready" | "missing";
}

export type ServerAuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error" }
  | { status: "authenticated"; user: ServerIdentity };
