import React from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "accent" | "outline" | "soft" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: variant === "primary" || variant === "accent" || variant === "soft" ? 600 : 500,
    borderRadius: "var(--radius-md)",
    transition: "background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.58 : 1,
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
      padding: "9px 18px",
      fontSize: "var(--text-sm)",
      height: "40px",
    },
    lg: {
      padding: "12px 26px",
      fontSize: "var(--text-base)",
      height: "48px",
    },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--brand-navy)",
      color: "var(--brand-white)",
      borderColor: "var(--brand-navy)",
      boxShadow: "var(--shadow-sm)",
    },
    accent: {
      backgroundColor: "var(--brand-teal)",
      color: "var(--brand-white)",
      borderColor: "var(--brand-teal)",
      boxShadow: "var(--shadow-sm)",
    },
    secondary: {
      backgroundColor: "var(--brand-white)",
      color: "var(--brand-navy)",
      borderColor: "var(--brand-teal)",
      boxShadow: "var(--shadow-sm)",
    },
    outline: {
      backgroundColor: "transparent",
      color: "var(--brand-navy)",
      borderColor: "var(--brand-navy)",
    },
    soft: {
      backgroundColor: "var(--brand-sky)",
      color: "var(--brand-navy)",
      borderColor: "var(--brand-sky-strong)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--brand-navy)",
      borderColor: "transparent",
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  if (href && !disabled) {
    return (
      <Link href={href} style={combinedStyles} className={`btn-${variant} ${className}`.trim()}>
        {children}
      </Link>
    );
  }

  return (
    <button
      style={combinedStyles}
      disabled={disabled}
      className={`btn-${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
