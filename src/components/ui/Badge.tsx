import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "neutral" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  style,
}: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--brand-beige)",
      color: "var(--brand-navy)",
      borderColor: "var(--color-border)",
    },
    accent: {
      backgroundColor: "var(--brand-sky-subtle)",
      color: "var(--brand-navy)",
      borderColor: "var(--color-accent-border)",
    },
    neutral: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-text-secondary)",
      borderColor: "var(--color-border)",
    },
    success: {
      backgroundColor: "var(--color-success-bg)",
      color: "var(--color-success)",
      borderColor: "var(--color-success-border)",
    },
    warning: {
      backgroundColor: "var(--color-warning-bg)",
      color: "var(--color-warning)",
      borderColor: "var(--color-warning-border)",
    },
    danger: {
      backgroundColor: "var(--color-danger-bg)",
      color: "var(--color-danger)",
      borderColor: "var(--color-danger-border)",
    },
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    padding: size === "sm" ? "2px 8px" : "4px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid",
    whiteSpace: "nowrap",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span style={badgeStyle} className={`badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
