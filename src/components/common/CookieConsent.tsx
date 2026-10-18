"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { CookiePreferences } from "@/types";

const COOKIE_STORAGE_KEY = "aroushh_cookie_preferences_v1";
const CONSENT_VERSION = "1.0.0";

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  consented: false,
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("cookie-consent-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("cookie-consent-updated", callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(COOKIE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "__SERVER__";
}

export function CookieConsent() {
  const storedJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  const parsedPreferences: CookiePreferences = React.useMemo(() => {
    if (!storedJson || storedJson === "__SERVER__") {
      return DEFAULT_PREFERENCES;
    }
    try {
      return JSON.parse(storedJson);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }, [storedJson]);

  useEffect(() => {
    const handleReopen = () => {
      setDraftPreferences(parsedPreferences);
      setIsModalOpen(true);
    };
    window.addEventListener("open-cookie-preferences", handleReopen);
    return () => {
      window.removeEventListener("open-cookie-preferences", handleReopen);
    };
  }, [parsedPreferences]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const savePreferences = (updated: CookiePreferences) => {
    const record: CookiePreferences = {
      ...updated,
      necessary: true,
      consented: true,
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(record));
    } catch {
    }
    setIsModalOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cookie-consent-updated"));
    }
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      consented: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      consented: true,
    });
  };

  const handleSaveCustom = () => {
    savePreferences(draftPreferences);
  };

  if (storedJson === "__SERVER__") return null;

  const isBannerVisible = !parsedPreferences.consented && !isModalOpen;

  return (
    <>
      {isBannerVisible && (
        <aside
          role="region"
          aria-label="Cookie Preferences"
          style={{
            position: "fixed",
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            right: "var(--space-4)",
            maxWidth: "760px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(170, 170, 170, 0.4)",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
            padding: "var(--space-5)",
            zIndex: 90,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "#1D1D1F" }}>
                Cookie and Privacy Preferences
              </h3>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                Strict DPDP Act 2023 alignment
              </span>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
              ArousH Academy uses essential cookies to ensure secure authentication, portal session persistence, and system reliability. Optional cookies remember preferences. No third-party advertising trackers are active.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                justifyContent: "flex-end",
                marginTop: "var(--space-2)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setDraftPreferences(parsedPreferences);
                  setIsModalOpen(true);
                }}
                className="btn-secondary"
                style={{ fontSize: "var(--text-xs)", minWidth: "110px", height: "36px" }}
                aria-label="Customize cookie preferences"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="btn-secondary"
                style={{ fontSize: "var(--text-xs)", minWidth: "150px", height: "36px" }}
                aria-label="Reject non-essential cookies"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn-secondary"
                style={{ fontSize: "var(--text-xs)", minWidth: "110px", height: "36px" }}
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
              border: "1px solid rgba(170, 170, 170, 0.4)",
              padding: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-5)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 id="cookie-preferences-title" style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "#1D1D1F" }}>
                  Cookie Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close preferences modal"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: "#1D1D1F",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)", lineHeight: 1.6 }}>
                Control which cookies and telemetry categories you allow. Changes will take effect immediately and are stored with version and timestamp.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid rgba(170, 170, 170, 0.35)",
                  borderRadius: "10px",
                  backgroundColor: "rgba(245, 245, 247, 0.7)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "var(--text-sm)", color: "#1D1D1F" }}>Strictly Necessary Cookies</strong>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "4px 0 0", lineHeight: 1.5 }}>
                      Essential for authentication, secure portal access, and session integrity. Cannot be disabled.
                    </p>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", whiteSpace: "nowrap", marginLeft: "12px" }}>
                    Always Active
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid rgba(170, 170, 170, 0.35)",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ paddingRight: "var(--space-3)" }}>
                    <label htmlFor="pref-functional" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "#1D1D1F", cursor: "pointer" }}>
                      Functional Preferences
                    </label>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "4px 0 0", lineHeight: 1.5 }}>
                      Remembers motion mode and portal interface layout preferences across visits.
                    </p>
                  </div>
                  <input
                    id="pref-functional"
                    type="checkbox"
                    checked={draftPreferences.functional}
                    onChange={(e) => setDraftPreferences({ ...draftPreferences, functional: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#007AFF", cursor: "pointer" }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid rgba(170, 170, 170, 0.35)",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ paddingRight: "var(--space-3)" }}>
                    <label htmlFor="pref-analytics" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "#1D1D1F", cursor: "pointer" }}>
                      Performance and Reliability
                    </label>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "4px 0 0", lineHeight: 1.5 }}>
                      Aggregated metrics for page load speeds and API performance. Zero third-party trackers.
                    </p>
                  </div>
                  <input
                    id="pref-analytics"
                    type="checkbox"
                    checked={draftPreferences.analytics}
                    onChange={(e) => setDraftPreferences({ ...draftPreferences, analytics: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "#007AFF", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-3)",
                justifyContent: "flex-end",
                paddingTop: "var(--space-3)",
                borderTop: "1px solid rgba(170, 170, 170, 0.35)",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "var(--text-xs)", height: "36px" }}
                onClick={handleRejectNonEssential}
              >
                Reject All Optional
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: "var(--text-xs)", height: "36px" }}
                onClick={handleSaveCustom}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  }
}
