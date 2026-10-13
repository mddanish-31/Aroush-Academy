"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "../ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_DEFAULT_ROUTES, ROLE_DISPLAY_NAMES } from "@/lib/auth/authTypes";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      className="glass-nav"
      role="banner"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "68px",
        }}
      >
        {/* Brand Logo & Wordmark */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            textDecoration: "none",
            color: "var(--color-primary)",
          }}
          aria-label="ArousH Academy Home"
        >
          {/* Logo Mark Placeholder */}
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "-0.04em",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            A
          </div>

          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.02em" }}>
              ArousH <span style={{ color: "var(--color-neutral-dark)", fontWeight: 400 }}>Academy</span>
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Azhar Sir &bull; Park Circus
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          role="navigation"
          aria-label="Primary Navigation"
          style={{
            display: "none",
            alignItems: "center",
            gap: "var(--space-6)",
          }}
          className="desktop-nav"
        >
          <Link
            href="/#about"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            About
          </Link>
          <Link
            href="/#courses"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            Courses
          </Link>
          <Link
            href="/#features"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            Why Choose Us
          </Link>
          <Link
            href="/#faculty"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            Faculty
          </Link>
          <Link
            href="/#enquiry"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            Admissions
          </Link>
          <Link
            href="/faq"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-neutral-dark)",
              fontWeight: 500,
              transition: "color var(--transition-fast)",
            }}
          >
            FAQ
          </Link>
        </nav>

        {/* Header Right Actions: Login & Admission Enquiry / Dashboard & Sign Out */}
        <div style={{ display: "none", alignItems: "center", gap: "var(--space-2)" }} className="desktop-nav">
          {isAuthenticated && user ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "4px 10px",
                  backgroundColor: "var(--color-surface-muted)",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border)",
                  fontSize: "var(--text-xs)",
                }}
              >
                <span style={{ fontWeight: 600 }}>{user.name.split(" ")[0]}</span>
                <span style={{ color: "var(--color-neutral-dark)", fontSize: "11px" }}>
                  ({ROLE_DISPLAY_NAMES[user.role]})
                </span>
              </div>
              <Button href={ROLE_DEFAULT_ROUTES[user.role]} variant="accent" size="sm">
                Dashboard
              </Button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-neutral-dark)",
                  cursor: "pointer",
                  padding: "6px 10px",
                  background: "none",
                  border: "none",
                }}
                aria-label="Sign out of session"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Log In
              </Button>
              <Button href="/register" variant="accent" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="mobile-toggle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            cursor: "pointer",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            padding: "var(--space-4) var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            animation: "fadeIn 150ms ease-out",
          }}
        >
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            About ArousH Academy
          </Link>
          <Link
            href="/#courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            Courses (Classes V–XII)
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            Why Choose Us
          </Link>
          <Link
            href="/#faculty"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            Faculty &amp; Teaching Team
          </Link>
          <Link
            href="/#enquiry"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            Admission Enquiry
          </Link>
          <Link
            href="/faq"
            onClick={() => setMobileMenuOpen(false)}
            style={{ padding: "var(--space-2) 0", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-primary)" }}
          >
            Frequently Asked Questions
          </Link>
          <div style={{ paddingTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {isAuthenticated && user ? (
              <>
                <div
                  style={{
                    padding: "var(--space-2)",
                    fontSize: "var(--text-xs)",
                    backgroundColor: "var(--color-surface-muted)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  Signed in as <strong>{user.name}</strong> ({ROLE_DISPLAY_NAMES[user.role]})
                </div>
                <Button
                  href={ROLE_DEFAULT_ROUTES[user.role]}
                  variant="accent"
                  size="sm"
                  style={{ width: "100%" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Button>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-neutral-dark)",
                    padding: "var(--space-2)",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                  aria-label="Sign out of session"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Button
                  href="/login"
                  variant="ghost"
                  size="sm"
                  style={{ width: "100%" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Button>
                <Button
                  href="/register"
                  variant="accent"
                  size="sm"
                  style={{ width: "100%" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Button>
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
        @media (max-width: 540px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
