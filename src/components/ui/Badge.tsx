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
      backgroundColor: "var(--color-surface-muted)",
      color: "var(--color-primary)",
      borderColor: "var(--color-border)",
    },
    accent: {
      backgroundColor: "var(--color-accent-subtle)",
      color: "var(--color-accent)",
      borderColor: "rgba(0, 122, 255, 0.2)",
    },
    neutral: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-neutral-dark)",
      borderColor: "var(--color-neutral-light)",
    },
    success: {
      backgroundColor: "rgba(52, 199, 89, 0.1)",
      color: "var(--color-success)",
      borderColor: "rgba(52, 199, 89, 0.2)",
    },
    warning: {
      backgroundColor: "rgba(255, 149, 0, 0.1)",
      color: "var(--color-warning)",
      borderColor: "rgba(255, 149, 0, 0.2)",
    },
    danger: {
      backgroundColor: "rgba(255, 59, 48, 0.1)",
      color: "#FF3B30",
      borderColor: "rgba(255, 59, 48, 0.25)",
    },
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    fontSize: size === "sm" ? "var(--text-xs)" : "var(--text-sm)",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    padding: size === "sm" ? "2px 8px" : "4px 12px",
    borderRadius: "var(--radius-full)",
    border: "1px solid",
    whiteSpace: "nowrap",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span style={badgeStyle} className={`badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
