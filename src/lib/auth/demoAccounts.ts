import { UserRole } from "@/types";
import { AuthUser } from "./authTypes";

/**
 * Predefined Demo Accounts for Frontend Preview
 * IMPORTANT: This module is strictly for client-side demo testing.
 * No production secrets, tokens, or hashes are stored here.
 * Real credentials will be managed by server-side identity providers.
 */

export interface DemoAccountDefinition {
  user: AuthUser;
  demoPassword: string;
  notes: string;
}

export const DEMO_ACCOUNTS: Record<UserRole, DemoAccountDefinition> = {
  "academy-admin": {
    user: {
      id: "demo-usr-admin",
      name: "Academy Administrator",
      identifier: "admin@aroushacademy.in",
      role: "academy-admin",
      profileId: "adm-central",
      linkStatus: "linked",
      activationStatus: "activated",
      createdAt: "2026-01-01",
    },
    demoPassword: "admin2026",
    notes: "Central institutional administrator with academy-wide ledger and faculty oversight.",
  },
  "teacher": {
    user: {
      id: "demo-usr-teacher",
      name: "Azhar Sir",
      identifier: "azhar.maths@aroush.academy",
      role: "teacher",
      profileId: "tch-azhar",
      linkedTeacherId: "tch-azhar",
      linkStatus: "linked",
      activationStatus: "activated",
      createdAt: "2026-03-01",
    },
    demoPassword: "teacher2026",
    notes: "Lead Mathematics faculty with Class IX-XII batch rosters and cash collection ledger.",
  },
  "student": {
    user: {
      id: "demo-usr-student",
      name: "Taha Rahman",
      identifier: "taha.rahman@student.aroush.in",
      role: "student",
      profileId: "std-101",
      linkedStudentId: "std-101",
      linkStatus: "linked",
      activationStatus: "activated",
      createdAt: "2026-04-10",
    },
    demoPassword: "student2026",
    notes: "Enrolled in Mathematics & Physics, includes fee history and Digital Student ID.",
  },
  "parent": {
    user: {
      id: "demo-usr-parent",
      name: "Mrs. Amina Rahman",
      identifier: "amina.rahman@parent.aroush.in",
      role: "parent",
      profileId: "std-101", // Linked to Taha Rahman
      linkedStudentId: "std-101",
      linkedStudentIds: ["std-101"],
      linkStatus: "linked",
      activationStatus: "activated",
      createdAt: "2026-04-10",
    },
    demoPassword: "parent2026",
    notes: "Guardian linked to Taha Rahman, with access to fee receipts and ward attendance.",
  },
};

/**
 * List of all demo accounts for quick UI testing
 */
export const DEMO_ACCOUNTS_LIST = Object.values(DEMO_ACCOUNTS);
