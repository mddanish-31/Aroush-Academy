"use client";

import React, { createContext, useContext, useState, useEffect, useTransition } from "react";
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

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
const isServerMode = process.env.NEXT_PUBLIC_AUTH_MODE === "server";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();

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
      let active = true;
      const loadServerUser = async () => {
        try {
          const res = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin",
          });
          if (!active) {
            return;
          }
          if (res.ok) {
            const data = await res.json().catch(() => null);
            startTransition(() => {
              setUser(data && data.ok && data.user ? data.user : null);
              setIsLoading(false);
            });
          } else {
            startTransition(() => {
              setUser(null);
              setIsLoading(false);
            });
          }
        } catch {
          if (!active) {
            return;
          }
          startTransition(() => {
            setUser(null);
            setIsLoading(false);
          });
        }
      };

      loadServerUser();

      const handleServerAuthChanged = () => {
        loadServerUser();
      };

      window.addEventListener("aroush-auth-changed", handleServerAuthChanged);
      return () => {
        active = false;
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
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    if (isServerMode) {
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
          return { success: false, error: "Too many attempts, try later" };
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.ok) {
          return { success: false, error: "Invalid credentials" };
        }
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
        });
        const meData = meRes.ok ? await meRes.json().catch(() => null) : null;
        const serverUser: AuthUser =
          meData && meData.ok && meData.user
            ? meData.user
            : {
                id: "server-user",
                name: typeof data.name === "string" ? data.name : "",
                identifier: credentials.identifier,
                role: data.role,
              };
        setUser(serverUser);
        return { success: true, user: serverUser };
      } catch {
        return { success: false, error: "Invalid credentials" };
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
    const inv = await demoAuthAdapter.createAccountInvitation(data);
    refreshInvitations();
    return inv;
  };

  const activateInvitation = async (
    invitationId: string,
    tempPassword?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
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
      setIsLoading(true);
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch {
      } finally {
        setUser(null);
        setIsLoading(false);
        if (typeof window !== "undefined") {
          router.replace("/login");
        }
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
      return {
        success: true,
        message: "If an account exists for that identifier, recovery instructions will be sent.",
        isSimulated: false,
      };
    }
    return await demoAuthAdapter.requestPasswordReset(req);
  };

  const quickSignInDemo = async (role: UserRole): Promise<AuthResult> => {
    if (isServerMode) {
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
