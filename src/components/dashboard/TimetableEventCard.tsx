"use client";
import { User } from "lucide-react";

import React from "react";
import type { TimetableSlot } from "@/types";
import { getSubjectTheme, calculateSlotLayout } from "@/lib/timetableUtils";

export interface TimetableEventCardProps {
  slot: TimetableSlot;
  startMinutes: number;
  endMinutes: number;
  colIndex: number;
  totalCols: number;
  gridStartHour: number;
  gridEndHour: number;
  onClick?: (slot: TimetableSlot) => void;
}


export function TimetableEventCard({
  slot,
  startMinutes,
  endMinutes,
  colIndex,
  totalCols,
  gridStartHour,
  gridEndHour,
  onClick,
}: TimetableEventCardProps) {
  const theme = getSubjectTheme(slot.subject);
  const isCancelled = slot.status === "cancelled";
  const isSpecificDate = slot.scheduleType === "specific_date";

  
  
  const { topPx, heightPx } = calculateSlotLayout(
    startMinutes,
    endMinutes,
    gridStartHour,
    gridEndHour,
    30
  );

  
  const isShortCard = heightPx < 50; 
  const isMediumCard = heightPx >= 50 && heightPx < 70; 
  const isTallCard = heightPx >= 70; 

  
  const colWidthPercent = 100 / totalCols;
  const leftPercent = colIndex * colWidthPercent;

  
  const displaySubject = slot.subject?.trim() || "Scheduled Class";
  const displayTime = slot.time?.trim() || "Scheduled Time";
  const displayTeacher = slot.teacherName?.trim() || "Faculty";
  const displayBatch = slot.batch?.trim() || "General Batch";
  const displayGrade = slot.classGrade?.trim() || "";

  const visibleBadge = isCancelled ? "Cancelled" : isSpecificDate ? "Session" : "";
  const visibleLabelParts = [
    displaySubject,
    visibleBadge,
    displayTime,
    !isShortCard ? displayBatch : null,
    isTallCard ? displayTeacher : null,
    isTallCard && displayGrade ? displayGrade : null,
  ].filter(Boolean);
  const visibleText = visibleLabelParts.join(", ");
  const extraDetail = [
    isShortCard ? displayBatch : null,
    `Faculty: ${displayTeacher}`,
    isCancelled && !visibleLabelParts.includes("Cancelled") ? "Cancelled" : null,
  ].filter(Boolean).join(", ");
  const cardAriaLabel = extraDetail ? `${visibleText}, ${extraDetail}` : visibleText;

  return (
    <div
      data-testid={`timetable-event-${slot.id}`}
      className={`timetable-event-card ${isShortCard ? "card-short" : isMediumCard ? "card-medium" : "card-tall"}`}
      onClick={() => onClick?.(slot)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(slot);
        }
      }}
      aria-label={cardAriaLabel}
      style={{
        position: "absolute",
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${colWidthPercent}% - 4px)`,
        backgroundColor: isCancelled ? "rgba(255, 59, 48, 0.08)" : theme.bgSubtle,
        borderLeft: `4px solid ${isCancelled ? "var(--color-danger, #FF3B30)" : theme.primary}`,
        borderTop: `1px solid ${isCancelled ? "rgba(255, 59, 48, 0.2)" : theme.border}`,
        borderRight: `1px solid ${isCancelled ? "rgba(255, 59, 48, 0.2)" : theme.border}`,
        borderBottom: `1px solid ${isCancelled ? "rgba(255, 59, 48, 0.2)" : theme.border}`,
        borderRadius: "var(--radius-sm)",
        padding: isShortCard ? "2px 6px" : isMediumCard ? "4px 6px" : "6px 8px",
        boxSizing: "border-box",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: isShortCard ? "center" : "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        zIndex: 2,
        opacity: isCancelled ? 0.75 : 1,
      }}
      title={`${displaySubject} • ${displayBatch} • ${displayTime} • ${displayTeacher} (Click for details)`}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "4px",
            lineHeight: 1.15,
            marginBottom: isShortCard ? "1px" : "2px",
          }}
        >
          <span
            style={{
              fontSize: isShortCard ? "10.5px" : "11px",
              fontWeight: 700,
              color: isCancelled ? "var(--color-danger)" : "var(--color-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textDecoration: isCancelled ? "line-through" : "none",
            }}
          >
            {displaySubject}
          </span>
          {" "}
          {isCancelled ? (
            <span
              style={{
                fontSize: "7.5px",
                fontWeight: 700,
                backgroundColor: "var(--color-danger)",
                color: "#FFFFFF",
                padding: "1px 3px",
                borderRadius: "2px",
                textTransform: "uppercase",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              Cancelled
            </span>
          ) : isSpecificDate ? (
            <span
              style={{
                fontSize: "7.5px",
                fontWeight: 600,
                backgroundColor: "var(--color-surface)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-border)",
                padding: "1px 3px",
                borderRadius: "2px",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              Session
            </span>
          ) : null}
        </div>
        {" "}
        <div
          style={{
            fontSize: isShortCard ? "9px" : "10px",
            fontWeight: 600,
            color: "var(--color-primary)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            lineHeight: 1.2,
          }}
        >
          {displayTime}
        </div>
        {" "}
        {!isShortCard && (
          <div
            style={{
              fontSize: "9px",
              color: "var(--color-neutral-dark)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: "2px",
              lineHeight: 1.2,
            }}
          >
            {displayBatch}
          </div>
        )}
      </div>
      {" "}
      {isTallCard && (
        <div
          style={{
            fontSize: "9px",
            color: "var(--color-neutral-dark)",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            paddingTop: "2px",
            marginTop: "2px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
            <User size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "2px" }} />{displayTeacher}
          </span>
          {" "}
          <span style={{ fontSize: "8.5px", color: "var(--color-neutral-dark)", flexShrink: 0 }}>
            {displayGrade}
          </span>
        </div>
      )}
    </div>
  );
}
