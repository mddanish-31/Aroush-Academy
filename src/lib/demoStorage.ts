"use client";

/**
 * AROUSH ACADEMY — Client-Side Demo Data Persistence Utility
 *
 * PURPOSE & ARCHITECTURE:
 * This utility provides safe, typed, client-side session persistence for interactive
 * demo mutations (fee transactions, teacher evaluations, authored mock exams, exam results,
 * created batches, attendance entries, and published notices).
 *
 * STRICT DEMO SCOPE:
 * - Backed by `sessionStorage` (scoped to the active browser tab session).
 * - Storage is strictly local to the client browser and is NOT an authoritative database.
 * - Sensitive authentication credentials, passwords, or tokens are NEVER stored here.
 * - Handles missing, corrupted, or disabled storage gracefully with in-memory fallbacks.
 * - Avoids SSR/client hydration mismatches by syncing storage post-mount on the client.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

export const DEMO_STORAGE_KEYS = {
  PAYMENTS: "aroush_demo_payments_v2",
  ASSESSMENTS: "aroush_demo_assessments_v1",
  MOCK_EXAMS: "aroush_demo_mock_exams_v1",
  EXAM_RESULTS: "aroush_demo_exam_results_v1",
  BATCHES: "aroush_demo_batches_v1",
  ATTENDANCE: "aroush_demo_attendance_v1",
  NOTICES: "aroush_demo_notices_v1",
  STUDY_MATERIALS: "aroush_demo_study_materials_v1",
  CLASSROOM_SESSIONS: "aroush_demo_classroom_sessions_v1",
  STUDENTS: "aroush_demo_students_v1",
  ENROLLMENTS: "aroush_demo_enrollments_v1",
  OBLIGATIONS: "aroush_demo_obligations_v2",
  ACADEMIC_CLASSES: "aroush_demo_academic_classes_v1",
  ACADEMIC_BOARDS: "aroush_demo_academic_boards_v1",
  ACADEMIC_SUBJECTS: "aroush_demo_academic_subjects_v1",
  FACULTY: "aroush_demo_faculty_v1",
  ACCOUNT_INVITATIONS: "aroush_demo_account_invitations_v1",
  TIMETABLE: "aroush_demo_timetable_v1",
  ISSUED_CERTIFICATES: "aroush_demo_issued_certificates_v1",
  TEACHER_CERT_PERMISSION: "aroush_demo_teacher_cert_permission_v1",
  AUDIT_LOGS: "aroush_demo_audit_logs_v1",
  STUDY_MATERIAL_TYPES: "aroush_demo_study_material_types_v1",
  STUDENT_ID_CARDS: "aroush_demo_student_id_cards_v1",
  PAYMENT_DESTINATIONS: "aroush_demo_payment_destinations_v2",
  PAYMENT_SUBMISSIONS: "aroush_demo_payment_submissions_v2",
  FEE_ADJUSTMENTS: "aroush_demo_fee_adjustments_v2",
  FEE_RECEIPTS: "aroush_demo_fee_receipts_v2",
  FEE_CONFIGURATIONS: "aroush_demo_fee_configurations_v2",
} as const;

export type DemoStorageKey = (typeof DEMO_STORAGE_KEYS)[keyof typeof DEMO_STORAGE_KEYS];

// In-memory runtime cache for client-side role and tab switching
const memoryCache: Record<string, unknown> = {};

/**
 * Detects whether sessionStorage is available in the current runtime environment.
 */
export function isDemoStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__aroush_storage_test__";
    window.sessionStorage.setItem(testKey, "1");
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely retrieves and parses a stored demo record with fallback and type validation.
 */
export function getDemoStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => data is T
): T {
  // Check memory cache first
  if (memoryCache[key] !== undefined) {
    const cached = memoryCache[key];
    if (validator) {
      if (validator(cached)) return cached;
    } else {
      return cached as T;
    }
  }

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    // Basic structural validation: if fallback is array, parsed must be array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      console.warn(`[DemoStorage] Key "${key}" expected Array but found ${typeof parsed}. Falling back.`);
      return fallback;
    }

    if (validator && !validator(parsed)) {
      console.warn(`[DemoStorage] Key "${key}" failed custom validation. Falling back.`);
      return fallback;
    }

    // Populate memory cache for instant client access
    memoryCache[key] = parsed;
    return parsed as T;
  } catch (error) {
    console.warn(`[DemoStorage] Failed to read or parse key "${key}". Using fallback.`, error);
    return fallback;
  }
}

/**
 * Safely persists a demo record to sessionStorage and updates the runtime cache.
 */
export function setDemoStorage<T>(key: string, value: T): boolean {
  // Always update in-memory runtime cache
  memoryCache[key] = value;

  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[DemoStorage] Failed to write key "${key}" to sessionStorage.`, error);
    return false;
  }
}

/**
 * Removes a specific demo key from sessionStorage and the runtime cache.
 */
export function removeDemoStorage(key: string): boolean {
  delete memoryCache[key];
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resets all AROUSH Academy demo storage keys back to default sample data.
 */
export function clearAllDemoStorage(): boolean {
  for (const k of Object.values(DEMO_STORAGE_KEYS)) {
    delete memoryCache[k];
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(k);
      } catch {
        // Ignore errors
      }
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aroush-demo-storage-reset"));
  }
  return true;
}

/**
 * Resets only fee-related demo keys to fallback sample data.
 * Does not disturb other modules like attendance, timetable, or mock exams.
 */
export function resetFeeDemoStorage(): boolean {
  const feeKeys = [
    DEMO_STORAGE_KEYS.PAYMENTS,
    DEMO_STORAGE_KEYS.OBLIGATIONS,
    DEMO_STORAGE_KEYS.PAYMENT_DESTINATIONS,
    DEMO_STORAGE_KEYS.PAYMENT_SUBMISSIONS,
    DEMO_STORAGE_KEYS.FEE_ADJUSTMENTS,
    DEMO_STORAGE_KEYS.FEE_RECEIPTS,
    DEMO_STORAGE_KEYS.FEE_CONFIGURATIONS,
    // Also clean up any legacy v1 fee keys if present
    "aroush_demo_payments_v1",
    "aroush_demo_obligations_v1",
    "aroush_demo_payment_destinations_v1",
    "aroush_demo_payment_submissions_v1",
    "aroush_demo_fee_adjustments_v1",
    "aroush_demo_fee_receipts_v1",
    "aroush_demo_fee_configurations_v1",
  ];

  for (const k of feeKeys) {
    delete memoryCache[k];
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(k);
      } catch {
        // Ignore
      }
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aroush-demo-storage-reset"));
  }
  return true;
}

/**
 * Custom React hook for seamless demo data persistence across role and tab switching.
 *
 * Guarantees:
 * 1. ZERO SSR/client hydration mismatch (initial render matches server fallback).
 * 2. Instant client-side hydration from sessionStorage.
 * 3. Immediate in-memory availability when switching roles within the dashboard.
 * 4. Cross-component synchronization via window event dispatch.
 */
export function useDemoStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => data is T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  // If already in memoryCache on the client, initialize directly to avoid flicker.
  // During SSR or initial page load before hydration, memoryCache is empty, matching fallback.
  const [state, setState] = useState<T>(() => {
    if (memoryCache[key] !== undefined) {
      const cached = memoryCache[key];
      if (!validator || validator(cached)) {
        return cached as T;
      }
    }
    return fallback;
  });

  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isInitialMount = useRef<boolean>(true);

  // Client-side hydration from sessionStorage on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const loaded = getDemoStorage<T>(key, fallback, validator);
      setState(loaded);
      setIsHydrated(true);
    }
  }, [key, fallback, validator]);

  // Synchronize with external changes or other instances of this key
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string; value?: unknown }>;
      if (customEvent.detail && customEvent.detail.key === key) {
        if (customEvent.detail.value !== undefined) {
          setState(customEvent.detail.value as T);
        } else {
          const loaded = getDemoStorage<T>(key, fallback, validator);
          setState(loaded);
        }
      }
    };

    const handleStorageReset = () => {
      setState(fallback);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("aroush-demo-storage-change", handleStorageChange);
      window.addEventListener("aroush-demo-storage-reset", handleStorageReset);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("aroush-demo-storage-change", handleStorageChange);
        window.removeEventListener("aroush-demo-storage-reset", handleStorageReset);
      }
    };
  }, [key, fallback, validator]);

  // Wrapped state setter that updates state, runtime memory cache, and sessionStorage
  const setStoredState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setState((prev) => {
        const next = typeof action === "function" ? (action as (prevVal: T) => T)(prev) : action;
        setDemoStorage<T>(key, next);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("aroush-demo-storage-change", {
              detail: { key, value: next },
            })
          );
        }
        return next;
      });
    },
    [key]
  );

  return [state, setStoredState, isHydrated];
}
