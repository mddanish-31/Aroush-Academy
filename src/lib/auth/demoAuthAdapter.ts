import {
  AuthProvider,
  AuthUser,
  LoginCredentials,
  RegisterData,
  AuthResult,
  RegisterResult,
  RegistrationRequest,
  AccountInvitation,
  PasswordResetRequest,
  PasswordResetResult,
} from "./authTypes";
import { DEMO_ACCOUNTS_LIST } from "./demoAccounts";

const STORAGE_KEY_USER = "aroush_demo_auth_user";
const STORAGE_KEY_REGISTRATIONS = "aroush_demo_registration_requests_v1";
const STORAGE_KEY_INVITATIONS = "aroush_demo_account_invitations_v1";

export const INITIAL_REGISTRATION_REQUESTS: RegistrationRequest[] = [
  {
    id: "reg-demo-101",
    name: "Zoya Akhtar",
    identifier: "zoya.akhtar@student.aroush.in",
    password: "student2026",
    role: "student",
    classGrade: "Class XI",
    status: "pending",
    linkStatus: "unlinked",
    submittedAt: "2026-10-11 14:30",
  },
  {
    id: "reg-demo-102",
    name: "Bilal Siddiqui",
    identifier: "bilal.siddiqui@parent.aroush.in",
    password: "parent2026",
    role: "parent",
    wardName: "Sara Siddiqui",
    status: "approved",
    linkStatus: "linked",
    linkedStudentId: "std-103",
    linkedStudentIds: ["std-103"],
    submittedAt: "2026-10-09 10:15",
    reviewedAt: "2026-10-10 11:00",
    reviewedBy: "Academy Admin Office",
  },
  {
    id: "reg-demo-103",
    name: "Kabir Sen",
    identifier: "kabir.sen@external.in",
    password: "student2026",
    role: "student",
    classGrade: "Class IX",
    status: "rejected",
    linkStatus: "unlinked",
    submittedAt: "2026-10-08 09:20",
    reviewedAt: "2026-10-08 16:45",
    reviewedBy: "Academy Admin Office",
    rejectionReason: "Incomplete guardian verification details. Please re-apply with contact number.",
  },
];

export const INITIAL_ACCOUNT_INVITATIONS: AccountInvitation[] = [
  {
    id: "inv-demo-104",
    studentId: "std-104",
    studentName: "Zayan Sheikh",
    targetRole: "student",
    recipientIdentifier: "zayan.sheikh@student.aroush.in",
    invitationCode: "AA-ACTIVATE-7842",
    activationStatus: "activation_pending",
    createdAt: "2026-10-10 11:30",
  },
];

/**
 * Demo Authentication Adapter
 *
 * DISCLAIMER:
 * This adapter runs strictly in-browser for frontend UI demonstrations.
 * It DOES NOT use real encryption, JWT signatures, or secure HTTP-only cookies.
 * Browser-local demo data is not shared across devices or users and is not production storage.
 */
export class DemoAuthAdapter implements AuthProvider {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  getCurrentUser(): AuthUser | null {
    if (!this.isBrowser()) return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      if (!stored) return null;
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  }

  private setCurrentUser(user: AuthUser | null): void {
    if (!this.isBrowser()) return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  getRegistrationRequests(): RegistrationRequest[] {
    if (!this.isBrowser()) return INITIAL_REGISTRATION_REQUESTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
      if (!stored) {
        localStorage.setItem(
          STORAGE_KEY_REGISTRATIONS,
          JSON.stringify(INITIAL_REGISTRATION_REQUESTS)
        );
        return INITIAL_REGISTRATION_REQUESTS;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as RegistrationRequest[];
      }
      return INITIAL_REGISTRATION_REQUESTS;
    } catch {
      return INITIAL_REGISTRATION_REQUESTS;
    }
  }

  saveRegistrationRequests(requests: RegistrationRequest[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(requests));
      window.dispatchEvent(new CustomEvent("aroush-registration-updated"));
    } catch {
      // Storage unavailable or disabled
    }
  }

  getAccountInvitations(): AccountInvitation[] {
    if (!this.isBrowser()) return INITIAL_ACCOUNT_INVITATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVITATIONS);
      if (!stored) {
        localStorage.setItem(
          STORAGE_KEY_INVITATIONS,
          JSON.stringify(INITIAL_ACCOUNT_INVITATIONS)
        );
        return INITIAL_ACCOUNT_INVITATIONS;
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as AccountInvitation[];
      }
      return INITIAL_ACCOUNT_INVITATIONS;
    } catch {
      return INITIAL_ACCOUNT_INVITATIONS;
    }
  }

  saveAccountInvitations(invitations: AccountInvitation[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY_INVITATIONS, JSON.stringify(invitations));
      window.dispatchEvent(new CustomEvent("aroush-invitations-updated"));
    } catch {
      // Storage unavailable or disabled
    }
  }

  async createAccountInvitation(data: {
    studentId: string;
    studentName: string;
    targetRole: "student" | "parent";
    identifier: string;
  }): Promise<AccountInvitation> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const existing = this.getAccountInvitations();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newInvitation: AccountInvitation = {
      id: `inv-${data.studentId}-${Date.now().toString().slice(-4)}`,
      studentId: data.studentId,
      studentName: data.studentName,
      targetRole: data.targetRole,
      recipientIdentifier: data.identifier.trim().toLowerCase(),
      invitationCode: `AA-ACTIVATE-${randomSuffix}`,
      activationStatus: "activation_pending",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    const nextList = [newInvitation, ...existing.filter((i) => !(i.studentId === data.studentId && i.targetRole === data.targetRole))];
    this.saveAccountInvitations(nextList);
    return newInvitation;
  }

  async activateAccountInvitation(
    invitationId: string,
    tempPassword = "student2026"
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const existing = this.getAccountInvitations();
    const index = existing.findIndex((i) => i.id === invitationId || i.invitationCode === invitationId);
    if (index === -1) {
      return { success: false, error: "Account invitation not found or expired." };
    }

    const inv = existing[index];
    const activated: AccountInvitation = {
      ...inv,
      activationStatus: "activated",
      activatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    const nextList = [...existing];
    nextList[index] = activated;
    this.saveAccountInvitations(nextList);

    const user: AuthUser = {
      id: `usr-${inv.studentId}`,
      name: inv.studentName,
      identifier: inv.recipientIdentifier,
      role: inv.targetRole,
      profileId: inv.studentId,
      linkedStudentId: inv.studentId,
      linkedStudentIds: [inv.studentId],
      activationStatus: "activated",
      linkStatus: "linked",
      createdAt: activated.activatedAt?.split(" ")[0] || "2026-10-12",
    };

    // Save as current user so user is authenticated
    this.setCurrentUser(user);

    // Also register in requests so login with tempPassword works subsequently
    const regList = this.getRegistrationRequests();
    const existingReq = regList.find((r) => r.identifier.toLowerCase() === inv.recipientIdentifier.toLowerCase());
    if (!existingReq) {
      const synchedReq: RegistrationRequest = {
        id: `reg-inv-${inv.studentId}`,
        name: inv.studentName,
        identifier: inv.recipientIdentifier,
        password: tempPassword,
        role: inv.targetRole,
        status: "approved",
        linkStatus: "linked",
        linkedStudentId: inv.studentId,
        linkedStudentIds: [inv.studentId],
        submittedAt: activated.createdAt,
        reviewedAt: activated.activatedAt,
        reviewedBy: "Academy Admin Office (Provisioned Invitation)",
      };
      this.saveRegistrationRequests([synchedReq, ...regList]);
    }

    return { success: true, user };
  }

  async updateRegistrationStatus(
    id: string,
    status: "approved" | "rejected",
    reason?: string,
    linkedStudentId?: string,
    linkedStudentIds?: string[],
    reviewer = "Academy Admin Office"
  ): Promise<{ success: boolean; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const existing = this.getRegistrationRequests();
    const index = existing.findIndex((r) => r.id === id);
    if (index === -1) {
      return { success: false, error: "Registration request not found." };
    }

    const current = existing[index];
    if (current.status !== "pending") {
      return {
        success: false,
        error: `This application has already been marked as ${current.status}.`,
      };
    }

    const updated: RegistrationRequest = {
      ...current,
      status,
      linkStatus: status === "approved" ? (linkedStudentId ? "linked" : "requires_review") : "unlinked",
      linkedStudentId: linkedStudentId || undefined,
      linkedStudentIds: linkedStudentIds || (linkedStudentId ? [linkedStudentId] : undefined),
      reviewedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      reviewedBy: reviewer,
      rejectionReason: reason?.trim() || undefined,
    };

    const nextList = [...existing];
    nextList[index] = updated;
    this.saveRegistrationRequests(nextList);

    return { success: true };
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Artificial latency (300ms) to simulate real async request and show UI loading states
    await new Promise((resolve) => setTimeout(resolve, 300));

    const identifier = credentials.identifier.trim().toLowerCase();
    const password = credentials.password;

    if (!identifier || !password) {
      return {
        success: false,
        error: "Please enter both your email/phone and password.",
      };
    }

    // 1. Check predefined demo accounts
    const matchDemo = DEMO_ACCOUNTS_LIST.find((d) => {
      const demoId = d.user.identifier.toLowerCase();
      return (
        demoId === identifier ||
        (d.user.role === "academy-admin" && identifier === "admin@aroush.in") ||
        (d.user.role === "student" && identifier === "taha.student@aroush.in")
      );
    });

    if (matchDemo) {
      if (matchDemo.demoPassword === password) {
        this.setCurrentUser(matchDemo.user);
        return { success: true, user: matchDemo.user };
      }
      return {
        success: false,
        error: "Invalid password for this demo account. Please check credentials.",
      };
    }

    // 2. Check registration requests
    const registrations = this.getRegistrationRequests();
    const matchReq = registrations.find((r) => r.identifier.toLowerCase() === identifier);

    if (matchReq) {
      if (matchReq.status === "pending") {
        return {
          success: false,
          error: "Your registration is currently pending Academy Admin approval. Please wait for an administrator to authorize your account before signing in.",
        };
      }
      if (matchReq.status === "rejected") {
        return {
          success: false,
          error: matchReq.rejectionReason
            ? `Your registration was not approved by Academy Administration. Reason: ${matchReq.rejectionReason}`
            : "Your registration was not approved by Academy Administration. Please contact the front office for further inquiries.",
        };
      }
      if (matchReq.status === "approved") {
        if (matchReq.password !== password) {
          return {
            success: false,
            error: "Invalid password for this account. Please check your credentials.",
          };
        }

        // Verify explicit academic record link
        if (!matchReq.linkedStudentId && !matchReq.linkedStudentIds?.length) {
          return {
            success: false,
            error: "Your user account is approved, but has not yet been linked to an active academic student record. Please contact Academy Administration to complete enrollment matching.",
          };
        }

        const primaryLinkedId = matchReq.linkedStudentId || matchReq.linkedStudentIds?.[0] || "";
        const user: AuthUser = {
          id: matchReq.id,
          name: matchReq.name,
          identifier: matchReq.identifier,
          role: matchReq.role,
          profileId: primaryLinkedId,
          linkedStudentId: matchReq.linkedStudentId,
          linkedStudentIds: matchReq.linkedStudentIds || (matchReq.linkedStudentId ? [matchReq.linkedStudentId] : []),
          linkStatus: primaryLinkedId ? "linked" : "unlinked",
          activationStatus: "activated",
          createdAt: matchReq.submittedAt.split(" ")[0],
        };
        this.setCurrentUser(user);
        return { success: true, user };
      }
    }

    // 3. Check Account Invitations
    const invitations = this.getAccountInvitations();
    const matchInv = invitations.find((i) => i.recipientIdentifier.toLowerCase() === identifier);
    if (matchInv) {
      if (matchInv.activationStatus !== "activated") {
        return {
          success: false,
          error: `Your account invitation (${matchInv.invitationCode}) is awaiting activation. Please activate your account first.`,
        };
      }
    }

    // 4. Unknown account
    return {
      success: false,
      error: "Account not found or invalid credentials. If you recently registered, please ensure you use your registered email address.",
    };
  }

  async register(data: RegisterData): Promise<RegisterResult> {
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Institutional guard: Academy Admin & Teacher registration is restricted
    if (data.role !== "student" && data.role !== "parent") {
      return {
        success: false,
        error: "Self-registration is restricted for institutional roles (Academy Admin, Teacher). Staff accounts must be provisioned directly by Academy Management.",
      };
    }

    const name = data.name.trim();
    const rawIdentifier = data.identifier.trim();
    const identifier = rawIdentifier.toLowerCase();
    const password = data.password;

    if (!name || name.length < 2) {
      return { success: false, error: "Please enter your full legal name." };
    }
    if (!rawIdentifier || rawIdentifier.length < 5) {
      return { success: false, error: "Please provide a valid email or 10-digit mobile number." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Check against predefined demo accounts
    const isDemoAccount = DEMO_ACCOUNTS_LIST.some(
      (d) =>
        d.user.identifier.toLowerCase() === identifier ||
        (d.user.role === "academy-admin" && identifier === "admin@aroush.in") ||
        (d.user.role === "student" && identifier === "taha.student@aroush.in")
    );
    if (isDemoAccount) {
      return {
        success: false,
        error: "An account with this email/phone already exists. Please log in directly on the login page.",
      };
    }

    // Check existing registration requests
    const existing = this.getRegistrationRequests();
    const existingReq = existing.find((r) => r.identifier.toLowerCase() === identifier);
    if (existingReq) {
      if (existingReq.status === "pending") {
        return {
          success: false,
          error: "A registration request with this email is already awaiting Academy Admin approval. Please wait for authorization.",
        };
      }
      if (existingReq.status === "approved") {
        return {
          success: false,
          error: "An account with this email has already been approved. Please sign in with your password.",
        };
      }
      if (existingReq.status === "rejected") {
        return {
          success: false,
          error: "A previous registration with this email was rejected. Please contact the front office for assistance.",
        };
      }
    }

    const newRequest: RegistrationRequest = {
      id: `reg-${Date.now()}`,
      name,
      identifier,
      password,
      role: data.role,
      classGrade: data.classGrade,
      wardName: data.wardName,
      status: "pending",
      linkStatus: "unlinked",
      submittedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    this.saveRegistrationRequests([newRequest, ...existing]);

    // Crucial: We do NOT authenticate the user here.
    // They must wait for Academy Admin approval and identity matching.
    return { success: true, request: newRequest };
  }

  async logout(): Promise<void> {
    this.setCurrentUser(null);
  }

  async requestPasswordReset(req: PasswordResetRequest): Promise<PasswordResetResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const identifier = req.identifier.trim();

    if (!identifier) {
      return {
        success: false,
        message: "Please enter a registered email address or phone number.",
        isSimulated: true,
      };
    }

    return {
      success: true,
      message: `Demo Mode Notice: In this frontend preview, no email or SMS has been dispatched to "${identifier}". You can sign in directly using the pre-configured demo account passwords shown on the login page.`,
      isSimulated: true,
    };
  }
}

export const demoAuthAdapter = new DemoAuthAdapter();
