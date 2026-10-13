"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Button } from "../ui/Button";
import { CookiePreferences } from "@/types";

const COOKIE_STORAGE_KEY = "aroushh_cookie_preferences_v1";

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

  // Sync draft preferences whenever storedJson changes
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

  // Global listener so Footer or Settings link can reopen preferences anytime
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

  // Close modal on Escape
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
      necessary: true, // strictly enforced
      consented: true,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // ponytail: graceful storage fallback
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

  // SSR check: Do not render during server pass
  if (storedJson === "__SERVER__") return null;

  const isBannerVisible = !parsedPreferences.consented && !isModalOpen;

  return (
    <>
      {/* Floating Bottom Consent Banner */}
      {isBannerVisible && (
        <aside
          role="region"
          aria-label="Cookie Preferences"
          style={{
            position: "fixed",
            bottom: "var(--space-4)",
            left: "var(--space-4)",
            right: "var(--space-4)",
            maxWidth: "720px",
            margin: "0 auto",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            padding: "var(--space-5)",
            zIndex: 90,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-2)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>Cookie &amp; Privacy Preferences</h3>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>Apple-grade transparency</span>
            </div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", margin: 0 }}>
              ArousH Academy uses essential cookies to ensure the platform operates reliably and securely. Optional cookies help improve learning insights. No advertising trackers are active in this environment.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                justifyContent: "flex-end",
                marginTop: "var(--space-2)",
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraftPreferences(parsedPreferences);
                  setIsModalOpen(true);
                }}
                aria-label="Manage individual cookie preferences"
              >
                Manage Preferences
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRejectNonEssential}
                aria-label="Reject non-essential cookies"
              >
                Reject Non-Essential
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleAcceptAll}
                aria-label="Accept all cookies"
              >
                Accept All
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal / Dialog for Detailed Preferences */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
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
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-border)",
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
                <h2 id="cookie-preferences-title" style={{ fontSize: "var(--text-xl)", fontWeight: 600 }}>
                  Cookie Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close preferences modal"
                  style={{
                    padding: "var(--space-1) var(--space-2)",
                    fontSize: "var(--text-lg)",
                    color: "var(--color-neutral-dark)",
                  }}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-neutral-dark)", marginTop: "var(--space-2)" }}>
                Control which cookies and telemetry categories you allow. Changes will take effect immediately.
              </p>
            </div>

            {/* Cookie Categories List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {/* Strictly Necessary */}
              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--color-surface-muted)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)" }}>Strictly Necessary Cookies</strong>
                    <p style={{ fontSize: "var(--text-xs)", margin: "4px 0 0" }}>
                      Essential for authentication, security, and session management. Cannot be disabled.
                    </p>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-neutral-dark)" }}>Always Active</span>
                </div>
              </div>

              {/* Functional Cookies */}
              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ paddingRight: "var(--space-3)" }}>
                    <label htmlFor="pref-functional" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)", cursor: "pointer" }}>
                      Functional &amp; Experience
                    </label>
                    <p style={{ fontSize: "var(--text-xs)", margin: "4px 0 0" }}>
                      Remembers theme preferences, language, and role portal state across sessions.
                    </p>
                  </div>
                  <input
                    id="pref-functional"
                    type="checkbox"
                    checked={draftPreferences.functional}
                    onChange={(e) => setDraftPreferences({ ...draftPreferences, functional: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "var(--color-accent)", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Analytics & Performance */}
              <div
                style={{
                  padding: "var(--space-3) var(--space-4)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ paddingRight: "var(--space-3)" }}>
                    <label htmlFor="pref-analytics" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-primary)", cursor: "pointer" }}>
                      Performance &amp; Analytics
                    </label>
                    <p style={{ fontSize: "var(--text-xs)", margin: "4px 0 0" }}>
                      Aggregated metrics for loading speed and site performance. Zero third-party advertising trackers loaded.
                    </p>
                  </div>
                  <input
                    id="pref-analytics"
                    type="checkbox"
                    checked={draftPreferences.analytics}
                    onChange={(e) => setDraftPreferences({ ...draftPreferences, analytics: e.target.checked })}
                    style={{ width: "18px", height: "18px", accentColor: "var(--color-accent)", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-2)",
                justifyContent: "flex-end",
                paddingTop: "var(--space-2)",
                borderTop: "1px solid var(--color-border)",
              }}
            >
              <Button variant="secondary" size="sm" onClick={handleRejectNonEssential}>
                Reject All Optional
              </Button>
              <Button variant="accent" size="sm" onClick={handleSaveCustom}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Utility helper to trigger the preferences modal from any link or button (e.g. Footer)
 */
export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  }
}
