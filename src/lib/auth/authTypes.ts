import { UserRole } from "@/types";

/**
 * Authentication Interface & Types for ArousH Academy
 * Designed for clean backend readiness:
 * Any future backend (NextAuth, Supabase, Firebase, custom OAuth/JWT)
 * can implement AuthProvider without changing UI consumers.
 */

export type AccountActivationStatus = "invited" | "activation_pending" | "activated";
export type RecordLinkStatus = "unlinked" | "linked" | "requires_review";

export interface AuthUser {
  id: string;
  name: string;
  identifier: string; // Email or phone
  role: UserRole;
  profileId?: string; // e.g. tch-azhar, std-101
  linkedStudentId?: string; // For student accounts: explicit student record ID e.g. "std-101"
  linkedTeacherId?: string; // For teacher accounts: explicit teacher ID e.g. "tch-azhar"
  linkedStudentIds?: string[]; // For parent accounts: explicit child student IDs e.g. ["std-101"]
  activationStatus?: AccountActivationStatus;
  linkStatus?: RecordLinkStatus;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  identifier: string; // Email or 10-digit mobile number
  password: string;
  preferredRole?: UserRole;
}

export interface RegisterData {
  name: string;
  identifier: string; // Email or mobile number
  password: string;
  role: "student" | "parent"; // Admin & Teacher registration is restricted
  classGrade?: string; // Optional for student
  wardName?: string; // Optional for parent
}

export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface RegistrationRequest {
  id: string;
  name: string;
  identifier: string; // Normalized (lowercased) email or phone
  password: string; // Kept in client demo storage for demo authentication upon approval
  role: "student" | "parent";
  classGrade?: string;
  wardName?: string;
  status: RegistrationStatus;
  linkStatus: RecordLinkStatus;
  linkedStudentId?: string;
  linkedStudentIds?: string[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface AccountInvitation {
  id: string;
  studentId: string;
  studentName: string;
  targetRole: "student" | "parent";
  recipientIdentifier: string;
  invitationCode: string;
  activationStatus: AccountActivationStatus;
  createdAt: string;
  activatedAt?: string;
}

export interface RegisterResult {
  success: boolean;
  request?: RegistrationRequest;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface PasswordResetRequest {
  identifier: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  isSimulated: boolean;
}

/**
 * Clean interface for Authentication Provider.
 * Real backend will implement this interface.
 */
export interface AuthProvider {
  getCurrentUser(): AuthUser | null;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(data: RegisterData): Promise<RegisterResult>;
  logout(): Promise<void>;
  requestPasswordReset(req: PasswordResetRequest): Promise<PasswordResetResult>;
  getRegistrationRequests(): RegistrationRequest[];
  updateRegistrationStatus(
    id: string,
    status: "approved" | "rejected",
    reason?: string,
    linkedStudentId?: string,
    linkedStudentIds?: string[]
  ): Promise<{ success: boolean; error?: string }>;
  getAccountInvitations(): AccountInvitation[];
  createAccountInvitation(data: {
    studentId: string;
    studentName: string;
    targetRole: "student" | "parent";
    identifier: string;
  }): Promise<AccountInvitation>;
  activateAccountInvitation(
    invitationId: string,
    tempPassword?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }>;
}

/**
 * Centralized Role-to-Dashboard route mapping
 * Note: These routes represent UX navigation mappings only.
 * Client-side routing is NOT a security boundary.
 */
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  "academy-admin": "/dashboard?role=academy-admin",
  "teacher": "/dashboard?role=teacher",
  "student": "/dashboard?role=student",
  "parent": "/dashboard?role=parent",
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  "academy-admin": "Academy Admin",
  "teacher": "Teacher Portal",
  "student": "Student Workspace",
  "parent": "Parent Oversight",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  "academy-admin": "Institutional branches, faculty rosters & subject fee ledgers",
  "teacher": "Assigned student rosters, subject monthly fees & cash collections",
  "student": "Enrolled subject classes, mock exams & digital ID cards",
  "parent": "Subject fee receipts, progress reports & attendance records",
};
