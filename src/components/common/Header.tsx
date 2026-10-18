"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  GraduationCap,
  Award,
  BookMarked,
  Compass,
  CheckCircle2,
  Users,
  Send,
  MapPin,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_DEFAULT_ROUTES, ROLE_DISPLAY_NAMES } from "@/lib/auth/authTypes";
import { siteSettings } from "@/content/site";
import type { NavItem } from "@/content/types";
import { MotionToggle } from "@/lib/motion/MotionProvider";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Building2,
  GraduationCap,
  Award,
  BookMarked,
  Compass,
  CheckCircle2,
  Users,
  Send,
  MapPin,
  HelpCircle,
};

export function Header() {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const { user, isAuthenticated, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<Record<string, boolean>>({
    about: false,
    programs: true,
    "why-aroush": false,
    admissions: false,
  });

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileDrawerOpen(false);
    setActiveDropdown(null);
  }

  const navContainerRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mobileDrawerOpen) {
          setMobileDrawerOpen(false);
        } else if (activeDropdown) {
          const trigger = document.getElementById(`nav-trigger-${activeDropdown}`);
          closeDropdown();
          trigger?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen, activeDropdown, closeDropdown]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [closeDropdown]);

  useEffect(() => {
    if (!mobileDrawerOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, [mobileDrawerOpen]);

  const handleTriggerMouseEnter = (groupId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (window.matchMedia("(pointer: fine)").matches) {
      setActiveDropdown(groupId);
    }
  };

  const handleTriggerMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      closeDropdown();
    }, 180);
  };

  const handleNavBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      closeDropdown();
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent, groupIndex: number) => {
    const groups = siteSettings.navGroups;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (groupIndex + 1) % groups.length;
      const nextButton = document.getElementById(`nav-trigger-${groups[nextIndex].id}`);
      nextButton?.focus();
      setActiveDropdown(groups[nextIndex].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (groupIndex - 1 + groups.length) % groups.length;
      const prevButton = document.getElementById(`nav-trigger-${groups[prevIndex].id}`);
      prevButton?.focus();
      setActiveDropdown(groups[prevIndex].id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const firstItem = document.querySelector<HTMLElement>(`#dropdown-panel-${groups[groupIndex].id} a`);
      firstItem?.focus();
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(`#dropdown-panel-${groupId} a`)
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (currentIndex === 0) {
        document.getElementById(`nav-trigger-${groupId}`)?.focus();
      } else {
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
      document.getElementById(`nav-trigger-${groupId}`)?.focus();
    }
  };

  const toggleAccordion = (groupId: string) => {
    setMobileAccordion((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(170, 170, 170, 0.35)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "#1D1D1F",
          }}
          aria-label="ArousH Academy Home"
          onClick={closeDropdown}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#1D1D1F",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "17px",
              letterSpacing: "-0.04em",
            }}
          >
            A
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.02em" }}>
              ArousH <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>Academy</span>
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              Azhar Sir - Park Circus
            </span>
          </div>
        </Link>

        <nav
          ref={navContainerRef}
          role="navigation"
          aria-label="Primary Navigation"
          onBlur={handleNavBlur}
          className="desktop-nav"
          style={{
            display: "none",
            alignItems: "center",
            gap: "8px",
            position: "relative",
          }}
        >
          {siteSettings.navGroups.map((group, groupIndex) => {
            const isOpen = activeDropdown === group.id;
            return (
              <div
                key={group.id}
                style={{ position: "relative" }}
                onMouseEnter={() => handleTriggerMouseEnter(group.id)}
                onMouseLeave={handleTriggerMouseLeave}
              >
                <button
                  id={`nav-trigger-${group.id}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`dropdown-panel-${group.id}`}
                  aria-haspopup="true"
                  onClick={() => setActiveDropdown(isOpen ? null : group.id)}
                  onKeyDown={(e) => handleDropdownKeyDown(e, groupIndex)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isOpen ? "rgba(29, 29, 31, 0.06)" : "transparent",
                    color: isOpen ? "#007AFF" : "#1D1D1F",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "color 180ms ease-out, background-color 180ms ease-out",
                  }}
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={14}
                    strokeWidth={2}
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease-out",
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    id={`dropdown-panel-${group.id}`}
                    role="region"
                    aria-label={`${group.title} Submenu`}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: groupIndex > 1 ? "auto" : "0",
                      right: groupIndex > 1 ? "0" : "auto",
                      width: "320px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px",
                      border: "1px solid rgba(170, 170, 170, 0.35)",
                      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08)",
                      padding: "10px",
                      zIndex: 60,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {group.items.map((item: NavItem) => {
                      const IconComponent = ICON_MAP[item.icon] || BookOpen;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={closeDropdown}
                          onKeyDown={(e) => handleItemKeyDown(e, group.id)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            color: "#1D1D1F",
                            transition: "background-color 150ms ease-out",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F5F5F7";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(0, 122, 255, 0.08)",
                              color: "#007AFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          >
                            <IconComponent size={16} strokeWidth={2} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F" }}>
                              {item.title}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="desktop-nav" style={{ display: "none", alignItems: "center", gap: "12px" }}>
          <MotionToggle />
          {isAuthenticated && user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  backgroundColor: "#F5F5F7",
                  borderRadius: "8px",
                  border: "1px solid rgba(170, 170, 170, 0.35)",
                  fontSize: "var(--text-xs)",
                }}
              >
                <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{user.name.split(" ")[0]}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  ({ROLE_DISPLAY_NAMES[user.role]})
                </span>
              </div>
              <Link
                href={ROLE_DEFAULT_ROUTES[user.role]}
                className="btn-primary"
                style={{ fontSize: "var(--text-xs)", height: "36px" }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="btn-ghost"
                style={{ fontSize: "var(--text-xs)" }}
                aria-label="Sign out of session"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-ghost"
                style={{ fontSize: "var(--text-sm)" }}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="btn-primary"
                style={{ fontSize: "var(--text-sm)" }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          aria-expanded={mobileDrawerOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={mobileDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-toggle"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            border: "1px solid rgba(170, 170, 170, 0.4)",
            backgroundColor: "#FFFFFF",
            color: "#1D1D1F",
            cursor: "pointer",
          }}
        >
          {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileDrawerOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          style={{
            position: "fixed",
            top: "72px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid rgba(170, 170, 170, 0.35)",
            padding: "var(--space-6)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "var(--space-6)",
            zIndex: 99,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {siteSettings.navGroups.map((group) => {
              const isExpanded = Boolean(mobileAccordion[group.id]);
              return (
                <div
                  key={group.id}
                  style={{
                    borderBottom: "1px solid rgba(170, 170, 170, 0.25)",
                    paddingBottom: "var(--space-3)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(group.id)}
                    aria-expanded={isExpanded}
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      background: "none",
                      border: "none",
                      color: "#1D1D1F",
                      fontSize: "var(--text-base)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <span>{group.title}</span>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      style={{
                        color: "var(--color-text-secondary)",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 200ms ease-out",
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        paddingTop: "6px",
                        paddingLeft: "4px",
                      }}
                    >
                      {group.items.map((item) => {
                        const IconComponent = ICON_MAP[item.icon] || BookOpen;
                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => setMobileDrawerOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              padding: "8px",
                              borderRadius: "8px",
                              textDecoration: "none",
                              color: "#1D1D1F",
                            }}
                          >
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(0, 122, 255, 0.08)",
                                color: "#007AFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "2px",
                              }}
                            >
                              <IconComponent size={14} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.title}</span>
                              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                                {item.description}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              paddingTop: "var(--space-4)",
              borderTop: "1px solid rgba(170, 170, 170, 0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Motion Mode
              </span>
              <MotionToggle />
            </div>

            {isAuthenticated && user ? (
              <>
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#F5F5F7",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Signed in as <strong style={{ color: "#1D1D1F" }}>{user.name}</strong> ({ROLE_DISPLAY_NAMES[user.role]})
                </div>
                <Link
                  href={ROLE_DEFAULT_ROUTES[user.role]}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="btn-primary"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Open Dashboard
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileDrawerOpen(false);
                    await logout();
                  }}
                  className="btn-secondary"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="btn-secondary"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="btn-primary"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
