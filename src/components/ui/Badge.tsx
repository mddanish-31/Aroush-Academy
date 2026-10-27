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
      backgroundColor: "var(--color-surface-muted)",
      color: "var(--color-primary)",
      borderColor: "var(--color-border)",
    },
    neutral: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-primary)",
      borderColor: "var(--color-neutral-light)",
    },
    success: {
      backgroundColor: "rgba(22, 101, 52, 0.08)",
      color: "#166534",
      borderColor: "rgba(22, 101, 52, 0.2)",
    },
    warning: {
      backgroundColor: "rgba(133, 77, 14, 0.08)",
      color: "#78350F",
      borderColor: "rgba(133, 77, 14, 0.2)",
    },
    danger: {
      backgroundColor: "rgba(185, 28, 28, 0.08)",
      color: "#991B1B",
      borderColor: "rgba(185, 28, 28, 0.2)",
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
