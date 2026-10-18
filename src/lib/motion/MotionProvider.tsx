"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { SlidersHorizontal } from "lucide-react";

export type MotionMode = "full" | "reduced";

interface MotionContextType {
  motion: MotionMode;
  toggleMotion: () => void;
  setMotion: (mode: MotionMode) => void;
}

const MotionContext = createContext<MotionContextType>({
  motion: "full",
  toggleMotion: () => {},
  setMotion: () => {},
});

const STORAGE_KEY = "aroush_motion_preference";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("motion-preference-changed", callback);
  let mql: MediaQueryList | null = null;
  if (typeof window !== "undefined" && window.matchMedia) {
    mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", callback);
  }
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("motion-preference-changed", callback);
    if (mql) mql.removeEventListener("change", callback);
  };
}

function getSnapshot(): MotionMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "full" || stored === "reduced") return stored;
  } catch {
  }
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }
  return "full";
}

function getServerSnapshot(): MotionMode {
  return "full";
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const motion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-motion", motion);
  }, [motion]);

  const setMotion = (mode: MotionMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("motion-preference-changed"));
    }
  };

  const toggleMotion = () => {
    const next = motion === "full" ? "reduced" : "full";
    setMotion(next);
  };

  return (
    <MotionContext.Provider value={{ motion, toggleMotion, setMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}

export function MotionToggle({ className }: { className?: string }) {
  const { motion, toggleMotion } = useMotion();
  const isReduced = motion === "reduced";

  return (
    <button
      type="button"
      onClick={toggleMotion}
      aria-pressed={isReduced}
      aria-label={isReduced ? "Reduced motion active. Click to enable full animations." : "Full animations active. Click to reduce motion."}
      title={isReduced ? "Motion: reduced" : "Motion: full"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-md)",
        border: "1px solid rgba(170, 170, 170, 0.4)",
        backgroundColor: isReduced ? "rgba(29, 29, 31, 0.08)" : "transparent",
        color: isReduced ? "var(--color-accent)" : "var(--color-primary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
    >
      <SlidersHorizontal size={16} strokeWidth={2} />
    </button>
  );
}
