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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [invitations, setInvitations] = useState<AccountInvitation[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const refreshRegistrations = () => {
    try {
      const reqs = demoAuthAdapter.getRegistrationRequests();
      setRegistrationRequests(reqs);
    } catch {
      // Storage unavailable
    }
  };

  const refreshInvitations = () => {
    try {
      const invs = demoAuthAdapter.getAccountInvitations();
      setInvitations(invs);
    } catch {
      // Storage unavailable
    }
  };

  // Hydrate user and registrations from client storage on mount and handle bfcache restores
  useEffect(() => {
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
    setIsLoading(true);
    try {
      const result = await demoAuthAdapter.register(data);
      // Explicit policy: Public registrations do NOT automatically authenticate.
      // Must await Academy Admin review and approval.
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
    return await demoAuthAdapter.requestPasswordReset(req);
  };

  const quickSignInDemo = async (role: UserRole): Promise<AuthResult> => {
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
