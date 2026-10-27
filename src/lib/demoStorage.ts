"use client";



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


const memoryCache: Record<string, unknown> = {};


let crossTabBroadcastChannel: BroadcastChannel | null = null;

function getCrossTabChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return null;
  }
  if (!crossTabBroadcastChannel) {
    try {
      crossTabBroadcastChannel = new BroadcastChannel("aroush_demo_cross_tab_sync");
    } catch {
      crossTabBroadcastChannel = null;
    }
  }
  return crossTabBroadcastChannel;
}


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


export function getDemoStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => data is T
): T {
  
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
    let raw = window.sessionStorage.getItem(key);

    
    if (!raw) {
      try {
        raw = window.localStorage.getItem(key);
        if (raw) {
          
          window.sessionStorage.setItem(key, raw);
        }
      } catch {
        
      }
    }

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      console.warn(`[DemoStorage] Key "${key}" expected Array but found ${typeof parsed}. Falling back.`);
      return fallback;
    }

    if (validator && !validator(parsed)) {
      console.warn(`[DemoStorage] Key "${key}" failed custom validation. Falling back.`);
      return fallback;
    }

    
    memoryCache[key] = parsed;
    return parsed as T;
  } catch (error) {
    console.warn(`[DemoStorage] Failed to read or parse key "${key}". Using fallback.`, error);
    return fallback;
  }
}


export function setDemoStorage<T>(key: string, value: T): boolean {
  
  memoryCache[key] = value;

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    window.sessionStorage.setItem(key, serialized);

    try {
      window.localStorage.setItem(key, serialized);
    } catch {
      
    }

    const channel = getCrossTabChannel();
    if (channel) {
      channel.postMessage({ type: "change", key, value });
    }

    return true;
  } catch (error) {
    console.warn(`[DemoStorage] Failed to write key "${key}".`, error);
    return false;
  }
}


export function removeDemoStorage(key: string): boolean {
  delete memoryCache[key];
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.removeItem(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      
    }

    const channel = getCrossTabChannel();
    if (channel) {
      channel.postMessage({ type: "remove", key });
    }
    return true;
  } catch {
    return false;
  }
}


export function clearAllDemoStorage(): boolean {
  for (const k of Object.values(DEMO_STORAGE_KEYS)) {
    delete memoryCache[k];
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(k);
        window.localStorage.removeItem(k);
      } catch {
        
      }
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aroush-demo-storage-reset"));
    const channel = getCrossTabChannel();
    if (channel) {
      channel.postMessage({ type: "reset" });
    }
  }
  return true;
}


export function resetFeeDemoStorage(): boolean {
  const feeKeys = [
    DEMO_STORAGE_KEYS.PAYMENTS,
    DEMO_STORAGE_KEYS.OBLIGATIONS,
    DEMO_STORAGE_KEYS.PAYMENT_DESTINATIONS,
    DEMO_STORAGE_KEYS.PAYMENT_SUBMISSIONS,
    DEMO_STORAGE_KEYS.FEE_ADJUSTMENTS,
    DEMO_STORAGE_KEYS.FEE_RECEIPTS,
    DEMO_STORAGE_KEYS.FEE_CONFIGURATIONS,
    
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
        window.localStorage.removeItem(k);
      } catch {
        
      }
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("aroush-demo-storage-reset"));
    const channel = getCrossTabChannel();
    if (channel) {
      channel.postMessage({ type: "reset-fee" });
    }
  }
  return true;
}


export function useDemoStorage<T>(
  key: string,
  fallback: T,
  validator?: (data: unknown) => data is T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  
  
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

  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const loaded = getDemoStorage<T>(key, fallback, validator);
      setState(loaded);
      setIsHydrated(true);
    }
  }, [key, fallback, validator]);

  
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

    
    const ch = getCrossTabChannel();
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "change" && event.data.key === key) {
        const val = event.data.value;
        if (!validator || validator(val)) {
          memoryCache[key] = val;
          try {
            window.sessionStorage.setItem(key, JSON.stringify(val));
          } catch {
            
          }
          setState(val as T);
        }
      } else if (event.data.type === "remove" && event.data.key === key) {
        delete memoryCache[key];
        try {
          window.sessionStorage.removeItem(key);
        } catch {
          
        }
        setState(fallback);
      } else if (event.data.type === "reset" || event.data.type === "reset-fee") {
        const loaded = getDemoStorage<T>(key, fallback, validator);
        setState(loaded);
      }
    };

    
    const handleWindowStorage = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (!validator || validator(parsed)) {
              memoryCache[key] = parsed;
              try {
                window.sessionStorage.setItem(key, e.newValue);
              } catch {
                
              }
              setState(parsed as T);
            }
          } catch {
            
          }
        } else {
          delete memoryCache[key];
          try {
            window.sessionStorage.removeItem(key);
          } catch {
            
          }
          setState(fallback);
        }
      }
    };

    const handleStorageReset = () => {
      setState(fallback);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("aroush-demo-storage-change", handleStorageChange);
      window.addEventListener("storage", handleWindowStorage);
      window.addEventListener("aroush-demo-storage-reset", handleStorageReset);
    }
    if (ch) {
      ch.addEventListener("message", handleBroadcastMessage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("aroush-demo-storage-change", handleStorageChange);
        window.removeEventListener("storage", handleWindowStorage);
        window.removeEventListener("aroush-demo-storage-reset", handleStorageReset);
      }
      if (ch) {
        ch.removeEventListener("message", handleBroadcastMessage);
      }
    };
  }, [key, fallback, validator]);

  
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
