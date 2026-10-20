"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";

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
  const isMotionOn = !isReduced;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isMotionOn}
      aria-label={isMotionOn ? "Turn animations off" : "Turn animations on"}
      onClick={toggleMotion}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "transparent",
        border: "none",
        padding: "4px 6px",
        borderRadius: "8px",
        cursor: "pointer",
        color: "#1D1D1F",
        fontSize: "13px",
        fontWeight: 500,
        userSelect: "none",
      }}
    >
      <span>Motion</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          width: "32px",
          height: "18px",
          backgroundColor: isMotionOn ? "#1D1D1F" : "rgba(170, 170, 170, 0.4)",
          borderRadius: "9px",
          position: "relative",
          transition: "background-color 150ms ease-out",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: isMotionOn ? "16px" : "2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
            transition: "left 150ms ease-out",
          }}
        />
      </span>
    </button>
  );
}
