import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    borderRadius: "var(--radius-full)",
    transition: "all var(--transition-fast)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    textDecoration: "none",
    border: "1px solid transparent",
    letterSpacing: "-0.01em",
  };

  const sizeStyles: Record<"sm" | "md" | "lg", React.CSSProperties> = {
    sm: {
      padding: "6px 14px",
      fontSize: "var(--text-xs)",
      height: "32px",
    },
    md: {
      padding: "9px 20px",
      fontSize: "var(--text-sm)",
      height: "40px",
    },
    lg: {
      padding: "13px 28px",
      fontSize: "var(--text-base)",
      height: "48px",
    },
  };

  const variantStyles: Record<"primary" | "secondary" | "accent" | "ghost", React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "var(--color-surface)",
      borderColor: "var(--color-primary)",
      boxShadow: "var(--shadow-sm)",
    },
    accent: {
      backgroundColor: "var(--color-accent)",
      color: "#FFFFFF",
      borderColor: "var(--color-accent)",
      boxShadow: "0 2px 8px rgba(0, 122, 255, 0.25)",
    },
    secondary: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-primary)",
      borderColor: "var(--color-border)",
      boxShadow: "var(--shadow-sm)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-primary)",
      borderColor: "transparent",
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  if (href && !disabled) {
    return (
      <Link href={href} style={combinedStyles} className={`btn-${variant} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      style={combinedStyles}
      disabled={disabled}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
