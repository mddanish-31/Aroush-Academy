import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  interactive = false,
  className = "",
  padding = "md",
  style,
  ...props
}: CardProps) {
  const paddingMap = {
    none: "0",
    sm: "var(--space-4)",
    md: "var(--space-6)",
    lg: "var(--space-8)",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-sm)",
    padding: paddingMap[padding],
    transition: "transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)",
    ...(interactive
      ? {
          cursor: "pointer",
        }
      : {}),
    ...style,
  };

  return (
    <div
      style={cardStyle}
      className={`surface-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
