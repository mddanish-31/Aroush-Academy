import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { MetricItem } from "@/types";

export interface MetricCardProps {
  metric: MetricItem;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card padding="md">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-neutral-dark)", letterSpacing: "0.02em" }}>
          {metric.label}
        </span>
        {metric.delta && (
          <Badge
            variant={
              metric.deltaType === "positive"
                ? "success"
                : metric.deltaType === "negative"
                ? "warning"
                : "neutral"
            }
            size="sm"
          >
            {metric.delta}
          </Badge>
        )}
      </div>
      <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-primary)", letterSpacing: "-0.02em" }}>
        {metric.value}
      </div>
    </Card>
  );
}
