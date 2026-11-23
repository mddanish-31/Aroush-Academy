"use client";

import React, { createContext, useContext, useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types";
import {
  AuthUser,
  LoginCredentials,
  RegisterData,
  AuthResult,
  RegisterResult,
  RegistrationRequest,
  AccountInvitation,
  PasswordResetRequest,
  PasswordResetResult,
  ROLE_DEFAULT_ROUTES,
} from "./authTypes";
import { demoAuthAdapter } from "./demoAuthAdapter";
import { DEMO_ACCOUNTS } from "./demoAccounts";
import { loadServerIdentity } from "./loadServerIdentity";
import type { ServerAuthState } from "./profileTypes";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverAuth: ServerAuthState;
  refreshIdentity: () => Promise<ServerAuthState>;
  registrationRequests: RegistrationRequest[];
  invitations: AccountInvitation[];
  refreshRegistrations: () => void;
  refreshInvitations: () => void;
  approveRegistration: (
    id: string,
    linkedStudentId?: string,
    linkedStudentIds?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  rejectRegistration: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  createInvitation: (data: {
    studentId: string;
    studentName: string;
    targetRole: "student" | "parent";
    identifier: string;
  }) => Promise<AccountInvitation>;
  activateInvitation: (
    invitationId: string,
    tempPassword?: string
  ) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  requestPasswordReset: (req: PasswordResetRequest) => Promise<PasswordResetResult>;
  quickSignInDemo: (role: UserRole) => Promise<AuthResult>;
  getDashboardRouteForRole: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const isServerMode = process.env.NEXT_PUBLIC_AUTH_MODE === "server" || process.env.NODE_ENV === "production";
const allowDemoQuickSignIn =
  !isServerMode ||
  process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverAuth, setServerAuth] = useState<ServerAuthState>({ status: "loading" });
  const identityRequest = useRef(0);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const refreshIdentity = useCallback(async (): Promise<ServerAuthState> => {
    if (!isServerMode) return { status: "unauthenticated" };
    const requestId = ++identityRequest.current;
    setServerAuth({ status: "loading" });
    setUser(null);
    setIsLoading(true);
    const state = await loadServerIdentity();
    if (requestId !== identityRequest.current) return { status: "unauthenticated" };
    setServerAuth(state);
    setUser(state.status === "authenticated" ? state.user : null);
    setIsLoading(false);
    return state;
  }, []);

  const refreshRegistrations = () => {
    if (isServerMode) {
      return;
    }
    try {
      const reqs = demoAuthAdapter.getRegistrationRequests();
      setRegistrationRequests(reqs);
    } catch {
    }
  };

  const refreshInvitations = () => {
    if (isServerMode) {
      return;
    }
    try {
      const invs = demoAuthAdapter.getAccountInvitations();
      setInvitations(invs);
    } catch {
    }
  };

  useEffect(() => {
    if (isServerMode) {
      const requestCounter = identityRequest;
      const handleServerAuthChanged = () => {
        startTransition(() => { void refreshIdentity(); });
      };

      handleServerAuthChanged();
      window.addEventListener("aroush-auth-changed", handleServerAuthChanged);
      return () => {
        requestCounter.current++;
        window.removeEventListener("aroush-auth-changed", handleServerAuthChanged);
      };
    }

    const hydrate = () => {
      try {
        const current = demoAuthAdapter.getCurrentUser();
        const reqs = demoAuthAdapter.getRegistrationRequests();
        const invs = demoAuthAdapter.getAccountInvitations();
        startTransition(() => {
          setUser(current);
          setRegistrationRequests(reqs);
          setInvitations(invs);
          setIsLoading(false);
        });
      } catch {
        startTransition(() => {
          setIsLoading(false);
        });
      }
    };

    hydrate();

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        hydrate();
      }
    };

    const handleRegistrationSync = () => {
      refreshRegistrations();
    };

    const handleInvitationSync = () => {
      refreshInvitations();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("aroush-registration-updated", handleRegistrationSync);
    window.addEventListener("aroush-invitations-updated", handleInvitationSync);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("aroush-registration-updated", handleRegistrationSync);
      window.removeEventListener("aroush-invitations-updated", handleInvitationSync);
    };
  }, [refreshIdentity]);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    if (isServerMode) {
      identityRequest.current++;
      setUser(null);
      setServerAuth({ status: "loading" });
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            identifier: credentials.identifier,
            password: credentials.password,
          }),
        });
        if (res.status === 429) {
          setServerAuth({ status: "unauthenticated" });
          return { success: false, error: "Too many attempts, try later" };
        }
        if (res.status >= 500) {
          setServerAuth({ status: "error" });
          return { success: false, error: "Sign in is currently unavailable. Please try again later." };
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.ok) {
          setServerAuth({ status: "unauthenticated" });
          return { success: false, error: "Invalid credentials" };
        }
        const identity = await refreshIdentity();
        if (identity.status !== "authenticated") {
          return { success: false, error: "Could not load your account. Please try again." };
        }
        return { success: true, user: identity.user };
      } catch {
        setServerAuth({ status: "error" });
        return { success: false, error: "Could not load your account. Please try again." };
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    try {
      const result = await demoAuthAdapter.login(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<RegisterResult> => {
    if (isServerMode) {
      return { success: false, error: "Use server registration endpoint" };
    }
    setIsLoading(true);
    try {
      const result = await demoAuthAdapter.register(data);
      if (result.success) {
        refreshRegistrations();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRegistration = async (
    id: string,
    linkedStudentId?: string,
    linkedStudentIds?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (isServerMode) {
      return { success: false, error: "Unsupported in client context" };
    }
    const res = await demoAuthAdapter.updateRegistrationStatus(
      id,
      "approved",
      undefined,
      linkedStudentId,
      linkedStudentIds
    );
    if (res.success) {
      refreshRegistrations();
    }
    return res;
  };

  const rejectRegistration = async (
    id: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (isServerMode) {
      return { success: false, error: "Unsupported in client context" };
    }
    const res = await demoAuthAdapter.updateRegistrationStatus(id, "rejected", reason);
    if (res.success) {
      refreshRegistrations();
    }
    return res;
  };

  const createInvitation = async (data: {
    studentId: string;
    studentName: string;
    targetRole: "student" | "parent";
    identifier: string;
  }): Promise<AccountInvitation> => {
    if (isServerMode) throw new Error("Unsupported in server mode");
    const inv = await demoAuthAdapter.createAccountInvitation(data);
    refreshInvitations();
    return inv;
  };

  const activateInvitation = async (
    invitationId: string,
    tempPassword?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    if (isServerMode) return { success: false, error: "Unsupported in server mode" };
    const res = await demoAuthAdapter.activateAccountInvitation(invitationId, tempPassword);
    if (res.success && res.user) {
      setUser(res.user);
      refreshInvitations();
      refreshRegistrations();
    }
    return res;
  };

  const logout = async (): Promise<void> => {
    if (isServerMode) {
      identityRequest.current++;
      setUser(null);
      setServerAuth({ status: "loading" });
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Sign out failed");
      } catch {
        setServerAuth({ status: "error" });
        setIsLoading(false);
        return;
      }
      identityRequest.current++;
      setUser(null);
      setServerAuth({ status: "unauthenticated" });
      setIsLoading(false);
      if (typeof window !== "undefined") {
        router.replace("/login");
      }
      return;
    }

    setIsLoading(true);
    try {
      await demoAuthAdapter.logout();
      setUser(null);
      if (typeof window !== "undefined") {
        router.replace("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (
    req: PasswordResetRequest
  ): Promise<PasswordResetResult> => {
    if (isServerMode) {
      return { success: false, message: "Automatic recovery is unavailable. Contact the academy for manual identity verification.", isSimulated: false };
    }
    return await demoAuthAdapter.requestPasswordReset(req);
  };

  const quickSignInDemo = async (role: UserRole): Promise<AuthResult> => {
    if (!allowDemoQuickSignIn) {
      return { success: false, error: "Invalid credentials" };
    }
    const demo = DEMO_ACCOUNTS[role];
    if (!demo) {
      return { success: false, error: "Demo account not found for role" };
    }
    return login({
      identifier: demo.user.identifier,
      password: demo.demoPassword,
      preferredRole: role,
    });
  };

  const getDashboardRouteForRole = (role: UserRole): string => {
    return ROLE_DEFAULT_ROUTES[role] || "/dashboard";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        serverAuth,
        refreshIdentity,
        registrationRequests,
        invitations,
        refreshRegistrations,
        refreshInvitations,
        approveRegistration,
        rejectRegistration,
        createInvitation,
        activateInvitation,
        login,
        register,
        logout,
        requestPasswordReset,
        quickSignInDemo,
        getDashboardRouteForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
