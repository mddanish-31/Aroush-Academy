"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  UserRole,
  ClassroomSession,
  ClassroomChatMessage,
  ClassroomParticipant,
} from "@/types";
import {
  SAMPLE_CLASSROOM_SESSIONS,
  INITIAL_CHAT_MESSAGES,
  getSessionParticipants,
} from "@/data/classroomData";
import { SAMPLE_ENROLLMENTS, SAMPLE_STUDENTS, SAMPLE_TEACHERS } from "@/data/enrollmentFeeData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDemoStorage, DEMO_STORAGE_KEYS } from "@/lib/demoStorage";

interface ClassroomModuleProps {
  role: UserRole;
  currentTeacherId?: string;
  currentStudentId?: string;
}

export function ClassroomModule({
  role,
  currentTeacherId = "tch-azhar",
  currentStudentId = "std-101",
}: ClassroomModuleProps) {
  // Session repository in local state (enables starting / ending demo sessions, persisted across roles)
  const [sessions, setSessions] = useDemoStorage<ClassroomSession[]>(
    DEMO_STORAGE_KEYS.CLASSROOM_SESSIONS,
    SAMPLE_CLASSROOM_SESSIONS
  );

  // Filter states
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");

  // Active Live Classroom interface state (null = session listing mode)
  const [activeLiveSessionId, setActiveLiveSessionId] = useState<string | null>(null);

  // Live session interactive states
  const [chatMessages, setChatMessages] = useState<Record<string, ClassroomChatMessage[]>>(INITIAL_CHAT_MESSAGES);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "participants" | "notes">("chat");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(842); // Demo initial elapsed time ~14 mins
  const [countdownSeconds, setCountdownSeconds] = useState<number>(7200); // 2 hours countdown demo

  // Whiteboard drawing tools
  const [activeBoardTool, setActiveBoardTool] = useState<"pen" | "eraser">("pen");
  const [penColor, setPenColor] = useState<string>("#1D1D1F");
  const [penWidth, setPenWidth] = useState<number>(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Session notes editing for teacher
  const [activeNotesSessionId, setActiveNotesSessionId] = useState<string | null>(null);
  const [sessionNotesInput, setSessionNotesInput] = useState<string>("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Roster inspection modal for teacher / admin
  const [rosterModalSession, setRosterModalSession] = useState<ClassroomSession | null>(null);

  // Details modal for student / parent viewing session instructions
  const [detailsModalSession, setDetailsModalSession] = useState<ClassroomSession | null>(null);

  // Ticker effect for elapsed session timer and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Escape key handler for open modals
  useEffect(() => {
    if (!rosterModalSession && !detailsModalSession && !activeNotesSessionId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRosterModalSession(null);
        setDetailsModalSession(null);
        setActiveNotesSessionId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rosterModalSession, detailsModalSession, activeNotesSessionId]);

  // Format seconds into HH:MM:SS
  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Determine role-scoped sessions
  const visibleSessions = useMemo(() => {
    return sessions.filter((session) => {
      // 1. Role Scoping
      if (role === "teacher") {
        if (session.teacherId !== currentTeacherId) return false;
      } else if (role === "student" || role === "parent") {
        // Enrolled subjects for Taha Rahman (std-101): Class X Maths & Physics/Chemistry
        if (session.classGrade !== "Class X") return false;
      } else if (role === "academy-admin") {
        // Admin sees all, but can filter by teacher
        if (filterTeacher !== "all" && session.teacherId !== filterTeacher) return false;
      }

      // 2. Filter Controls
      if (filterSubject !== "all" && session.subject !== filterSubject) return false;
      if (filterStatus !== "all" && session.status !== filterStatus) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = session.topic.toLowerCase().includes(q);
        const matchesTeacher = session.teacherName.toLowerCase().includes(q);
        const matchesBatch = session.batchName.toLowerCase().includes(q);
        const matchesSubject = session.subject.toLowerCase().includes(q);
        if (!matchesTopic && !matchesTeacher && !matchesBatch && !matchesSubject) return false;
      }

      return true;
    });
  }, [sessions, role, currentTeacherId, filterTeacher, filterSubject, filterStatus, searchQuery]);

  // Current active session object if in live room
  const activeSession = useMemo(() => {
    if (!activeLiveSessionId) return null;
    return sessions.find((s) => s.id === activeLiveSessionId) || null;
  }, [sessions, activeLiveSessionId]);

  // Compute participants for active live session
  const currentParticipants: ClassroomParticipant[] = useMemo(() => {
    if (!activeSession) return [];
    const base = getSessionParticipants(activeSession, role, currentStudentId);
    // Reflect local hand-raise state
    return base.map((p) => {
      if ((role === "student" && p.role === "student" && p.name.includes("(You)")) ||
          (role === "teacher" && p.role === "teacher")) {
        return {
          ...p,
          isHandRaised: isHandRaised,
          isAudioMuted: isMicMuted,
          isVideoEnabled: isVideoEnabled,
        };
      }
      return p;
    });
  }, [activeSession, role, currentStudentId, isHandRaised, isMicMuted, isVideoEnabled]);

  // Current session's chat messages
  const currentChat = useMemo(() => {
    if (!activeLiveSessionId) return [];
    return chatMessages[activeLiveSessionId] || [];
  }, [activeLiveSessionId, chatMessages]);

  // Next scheduled class for countdown display
  const nextScheduledClass = useMemo(() => {
    const live = visibleSessions.find((s) => s.status === "live-demo");
    if (live) return { session: live, isLiveNow: true };
    const upcoming = visibleSessions.find((s) => s.status === "upcoming");
    if (upcoming) return { session: upcoming, isLiveNow: false };
    return null;
  }, [visibleSessions]);

  // Handlers for starting and ending demo sessions
  const handleStartDemoSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: "live-demo" } : s))
    );
    setActiveLiveSessionId(sessionId);
    setIsHandRaised(false);
    setActionNotice("Demo session activated. Local simulation live.");
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleEndDemoSession = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: "completed", recordingAvailable: true } : s))
    );
    if (activeLiveSessionId === sessionId) {
      setActiveLiveSessionId(null);
    }
    setActionNotice("Demo session marked as completed. Local state updated.");
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleJoinClass = (sessionId: string) => {
    setActiveLiveSessionId(sessionId);
    setIsHandRaised(false);
  };

  const handleLeaveClass = () => {
    setActiveLiveSessionId(null);
    setIsHandRaised(false);
  };

  // Chat message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeLiveSessionId) return;

    const senderName =
      role === "teacher"
        ? (SAMPLE_TEACHERS.find((t) => t.id === currentTeacherId)?.name || "Faculty")
        : role === "student"
        ? (SAMPLE_STUDENTS.find((s) => s.id === currentStudentId)?.name || "Student")
        : role === "parent"
        ? "Mrs. Amina Rahman (Parent)"
        : "Academy Administrator";

    const newMessage: ClassroomChatMessage = {
      id: `msg-${Date.now()}`,
      sessionId: activeLiveSessionId,
      senderName,
      senderRole: role,
      senderId: role === "teacher" ? currentTeacherId : currentStudentId,
      text: chatInputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => ({
      ...prev,
      [activeLiveSessionId]: [...(prev[activeLiveSessionId] || []), newMessage],
    }));
    setChatInputText("");
  };

  // Hand raise toggle
  const handleToggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    if (activeLiveSessionId) {
      const studentName =
        role === "student"
          ? (SAMPLE_STUDENTS.find((s) => s.id === currentStudentId)?.name || "Student")
          : role === "parent"
          ? "Parent Observer"
          : "Participant";

      const systemMessage: ClassroomChatMessage = {
        id: `sys-${Date.now()}`,
        sessionId: activeLiveSessionId,
        senderName: "Classroom System",
        senderRole: "academy-admin",
        senderId: "system",
        text: nextState
          ? `✋ ${studentName} raised their hand.`
          : `${studentName} lowered their hand.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSystem: true,
      };

      setChatMessages((prev) => ({
        ...prev,
        [activeLiveSessionId]: [...(prev[activeLiveSessionId] || []), systemMessage],
      }));
    }
  };

  // Canvas Drawing Methods (Native HTML5 Canvas)
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = activeBoardTool === "eraser" ? 18 : penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = activeBoardTool === "eraser" ? "#FFFFFF" : penColor;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAddSampleFormula = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = "bold 18px -apple-system, sans-serif";
    ctx.fillStyle = "#007AFF";
    ctx.fillText("Discriminant Condition: D = b² - 4ac", 30, 50);
    ctx.font = "14px -apple-system, sans-serif";
    ctx.fillStyle = "#1D1D1F";
    ctx.fillText("• D > 0 ⇒ Two real and distinct roots", 30, 85);
    ctx.fillText("• D = 0 ⇒ Two real and equal roots", 30, 110);
    ctx.fillText("• D < 0 ⇒ No real roots (complex conjugate roots)", 30, 135);
    ctx.restore();
  };

  // Notes update handler
  const handleSaveNotes = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, notes: sessionNotesInput } : s))
    );
    setActiveNotesSessionId(null);
    setActionNotice("Session lecture notes updated locally.");
    setTimeout(() => setActionNotice(null), 3000);
  };

  // -------------------------------------------------------------
  // RENDER: LIVE CLASSROOM WORKSPACE (If activeLiveSessionId is set)
  // -------------------------------------------------------------
  if (activeSession) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Top Control & Notification Banner */}
        <div
          style={{
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <Badge variant="accent" size="sm">
              🔴 LIVE DEMO
            </Badge>
            <div>
              <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "#FFFFFF" }}>
                {activeSession.subject}: {activeSession.topic}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-neutral)" }}>
                {activeSession.batchName} • Faculty: {activeSession.teacherName}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⏱️</span>
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            <div
              style={{
                fontSize: "var(--text-xs)",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
              }}
            >
              👥 {currentParticipants.length} Online
            </div>

            {role === "teacher" && (
              <button
                type="button"
                onClick={() => handleEndDemoSession(activeSession.id)}
                style={{
                  backgroundColor: "#FF3B30",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                End Demo Session
              </button>
            )}

            <button
              type="button"
              onClick={handleLeaveClass}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Leave Session
            </button>
          </div>
        </div>

        {/* Live Interface Split Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 380px)",
            gap: "var(--space-4)",
          }}
          className="live-classroom-grid"
        >
          {/* Main Stage: Video Placeholder + Interactive Whiteboard */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Video Canvas Placeholder */}
            <div
              style={{
                backgroundColor: "#0A0A0C",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                minHeight: "360px",
              }}
            >
              {/* Speaker Video Center Stage */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "var(--space-8)",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {/* Presenter Avatar with Speaking Animation Indicator */}
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--color-primary-light)",
                    border: "3px solid #007AFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "var(--text-2xl)",
                    fontWeight: 700,
                    marginBottom: "var(--space-3)",
                    boxShadow: "0 0 20px rgba(0, 122, 255, 0.4)",
                  }}
                >
                  {activeSession.teacherName.charAt(0)}
                </div>

                <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "var(--text-base)" }}>
                  {activeSession.teacherName} (Faculty Host)
                </div>

                <div style={{ color: "var(--color-neutral)", fontSize: "var(--text-xs)", marginTop: "4px" }}>
                  Active Audio Feed • 1080p HD Video Channel
                </div>

                {/* Clear Technical Disclaimer Overlay */}
                <div
                  style={{
                    marginTop: "var(--space-4)",
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    border: "1px dashed rgba(255, 255, 255, 0.25)",
                    borderRadius: "var(--radius-md)",
                    padding: "8px 16px",
                    maxWidth: "520px",
                    fontSize: "11px",
                    color: "#D1D1D6",
                    lineHeight: "1.4",
                  }}
                >
                  <strong>Simulated Video Stream:</strong> High-definition video camera placeholder. Real-time video/audio broadcast and multi-peer synchronization will utilize production WebRTC / SFU infrastructure.
                </div>
              </div>

              {/* In-Call Media Controls Bar */}
              <div
                style={{
                  backgroundColor: "rgba(20, 20, 24, 0.95)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "10px 16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                }}
              >
                {/* Mic Control */}
                <button
                  type="button"
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  style={{
                    backgroundColor: isMicMuted ? "#FF3B30" : "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{isMicMuted ? "🔇" : "🎙️"}</span>
                  <span>{isMicMuted ? "Unmute Mic" : "Mute Mic"}</span>
                </button>

                {/* Video Control */}
                <button
                  type="button"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  style={{
                    backgroundColor: isVideoEnabled ? "#34C759" : "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{isVideoEnabled ? "📹" : "📷"}</span>
                  <span>{isVideoEnabled ? "Camera On (Demo)" : "Camera Off"}</span>
                </button>

                {/* Screen Share Control */}
                <button
                  type="button"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                  style={{
                    backgroundColor: isScreenSharing ? "#007AFF" : "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>🖥️</span>
                  <span>{isScreenSharing ? "Sharing Screen" : "Share Screen"}</span>
                </button>

                {/* Hand Raise Control */}
                <button
                  type="button"
                  onClick={handleToggleHandRaise}
                  style={{
                    backgroundColor: isHandRaised ? "#FF9500" : "rgba(255, 255, 255, 0.15)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✋</span>
                  <span>{isHandRaised ? "Lower Hand" : "Raise Hand"}</span>
                </button>
              </div>
            </div>

            {/* Interactive Whiteboard (Native HTML5 Canvas) */}
            <Card padding="md">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-3)",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
                      Interactive Classroom Whiteboard
                    </h3>
                    <Badge variant="neutral" size="sm">
                      Zero-Dependency Canvas
                    </Badge>
                  </div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                    Draw mathematical diagrams, step-by-step equations, or geometry annotations in real time.
                  </p>
                </div>

                {/* Whiteboard Controls Toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {/* Tool selector */}
                  <button
                    type="button"
                    onClick={() => setActiveBoardTool("pen")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      fontWeight: activeBoardTool === "pen" ? 600 : 400,
                      backgroundColor: activeBoardTool === "pen" ? "var(--color-primary)" : "var(--color-surface-muted)",
                      color: activeBoardTool === "pen" ? "#FFFFFF" : "var(--color-primary)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Pen
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBoardTool("eraser")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      fontWeight: activeBoardTool === "eraser" ? 600 : 400,
                      backgroundColor: activeBoardTool === "eraser" ? "var(--color-primary)" : "var(--color-surface-muted)",
                      color: activeBoardTool === "eraser" ? "#FFFFFF" : "var(--color-primary)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    🧹 Eraser
                  </button>

                  {/* Pen Colors */}
                  <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
                    {["#1D1D1F", "#007AFF", "#FF3B30", "#34C759"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setPenColor(color);
                          setActiveBoardTool("pen");
                        }}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "var(--radius-full)",
                          backgroundColor: color,
                          border: penColor === color && activeBoardTool === "pen" ? "2px solid #000000" : "1px solid rgba(0,0,0,0.15)",
                          cursor: "pointer",
                          transform: penColor === color ? "scale(1.15)" : "scale(1)",
                        }}
                        title={`Select color ${color}`}
                      />
                    ))}
                  </div>

                  {/* Stroke Size */}
                  <select
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    style={{
                      fontSize: "var(--text-xs)",
                      padding: "3px 6px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      marginLeft: "4px",
                    }}
                  >
                    <option value={2}>Thin (2px)</option>
                    <option value={4}>Medium (4px)</option>
                    <option value={8}>Thick (8px)</option>
                  </select>

                  {/* Preset Formula helper */}
                  <button
                    type="button"
                    onClick={handleAddSampleFormula}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-accent-subtle)",
                      color: "var(--color-accent)",
                      border: "1px solid rgba(0, 122, 255, 0.2)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Formula
                  </button>

                  {/* Clear button */}
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      backgroundColor: "var(--color-surface-muted)",
                      color: "var(--color-neutral-dark)",
                      border: "1px solid var(--color-border)",
                      cursor: "pointer",
                    }}
                  >
                    Clear Board
                  </button>
                </div>
              </div>

              {/* Canvas Surface */}
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  touchAction: "none",
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={240}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                  style={{
                    width: "100%",
                    height: "240px",
                    display: "block",
                    cursor: activeBoardTool === "eraser" ? "crosshair" : "default",
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Chat Stream, Participants Roster, and Session Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Card padding="none" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Tab Header */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-muted)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSidebarTab("chat")}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    fontSize: "var(--text-xs)",
                    fontWeight: sidebarTab === "chat" ? 700 : 500,
                    backgroundColor: sidebarTab === "chat" ? "var(--color-surface)" : "transparent",
                    color: sidebarTab === "chat" ? "var(--color-primary)" : "var(--color-neutral-dark)",
                    border: "none",
                    borderBottom: sidebarTab === "chat" ? "2px solid var(--color-accent)" : "none",
                    cursor: "pointer",
                  }}
                >
                  💬 Chat ({currentChat.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("participants")}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    fontSize: "var(--text-xs)",
                    fontWeight: sidebarTab === "participants" ? 700 : 500,
                    backgroundColor: sidebarTab === "participants" ? "var(--color-surface)" : "transparent",
                    color: sidebarTab === "participants" ? "var(--color-primary)" : "var(--color-neutral-dark)",
                    border: "none",
                    borderBottom: sidebarTab === "participants" ? "2px solid var(--color-accent)" : "none",
                    cursor: "pointer",
                  }}
                >
                  👥 Roster ({currentParticipants.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSidebarTab("notes")}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    fontSize: "var(--text-xs)",
                    fontWeight: sidebarTab === "notes" ? 700 : 500,
                    backgroundColor: sidebarTab === "notes" ? "var(--color-surface)" : "transparent",
                    color: sidebarTab === "notes" ? "var(--color-primary)" : "var(--color-neutral-dark)",
                    border: "none",
                    borderBottom: sidebarTab === "notes" ? "2px solid var(--color-accent)" : "none",
                    cursor: "pointer",
                  }}
                >
                  📋 Notes
                </button>
              </div>

              {/* Tab Content: CHAT */}
              {sidebarTab === "chat" && (
                <div style={{ display: "flex", flexDirection: "column", height: "480px" }}>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "var(--space-3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                    }}
                  >
                    {currentChat.map((msg) => {
                      if (msg.isSystem) {
                        return (
                          <div
                            key={msg.id}
                            style={{
                              textAlign: "center",
                              fontSize: "11px",
                              color: "var(--color-neutral-dark)",
                              backgroundColor: "var(--color-surface-muted)",
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            {msg.text}
                          </div>
                        );
                      }

                      const isMe =
                        (role === "teacher" && msg.senderRole === "teacher") ||
                        (role === "student" && msg.senderName.includes("Taha"));

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-primary)" }}>
                              {msg.senderName}
                            </span>
                            <Badge
                              variant={msg.senderRole === "teacher" ? "accent" : "neutral"}
                              size="sm"
                              style={{ fontSize: "9px", padding: "1px 5px" }}
                            >
                              {msg.senderRole}
                            </Badge>
                            <span style={{ fontSize: "10px", color: "var(--color-neutral)" }}>
                              {msg.timestamp}
                            </span>
                          </div>

                          <div
                            style={{
                              backgroundColor: isMe ? "var(--color-accent)" : "var(--color-surface-muted)",
                              color: isMe ? "#FFFFFF" : "var(--color-primary)",
                              padding: "6px 12px",
                              borderRadius: "var(--radius-md)",
                              maxWidth: "85%",
                              fontSize: "var(--text-xs)",
                              lineHeight: "1.4",
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input */}
                  <form
                    onSubmit={handleSendMessage}
                    style={{
                      padding: "var(--space-3)",
                      borderTop: "1px solid var(--color-border)",
                      display: "flex",
                      gap: "var(--space-2)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Type a doubt or question..."
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: "var(--text-xs)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        outline: "none",
                      }}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!chatInputText.trim()}
                    >
                      Send
                    </Button>
                  </form>
                  <div
                    style={{
                      padding: "4px 8px",
                      fontSize: "10px",
                      color: "var(--color-neutral)",
                      textAlign: "center",
                      backgroundColor: "var(--color-surface-muted)",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    Local simulation: Chat does not persist after session exit.
                  </div>
                </div>
              )}

              {/* Tab Content: PARTICIPANTS */}
              {sidebarTab === "participants" && (
                <div style={{ height: "480px", overflowY: "auto", padding: "var(--space-3)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {currentParticipants.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-surface-muted)",
                          border: p.isHandRaised ? "1px solid #FF9500" : "1px solid var(--color-border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "var(--radius-full)",
                              backgroundColor: p.role === "teacher" ? "#007AFF" : "var(--color-primary)",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                              {p.role === "teacher" ? "Lead Faculty" : "Enrolled Student"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {p.isHandRaised && (
                            <Badge variant="warning" size="sm">
                              ✋ Hand Raised
                            </Badge>
                          )}
                          <span style={{ fontSize: "12px" }}>
                            {p.isAudioMuted ? "🔇" : "🎙️"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
                    <Button
                      variant={isHandRaised ? "secondary" : "primary"}
                      size="sm"
                      onClick={handleToggleHandRaise}
                    >
                      {isHandRaised ? "✋ Lower My Hand" : "✋ Raise Hand"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab Content: SESSION NOTES */}
              {sidebarTab === "notes" && (
                <div style={{ height: "480px", overflowY: "auto", padding: "var(--space-3)" }}>
                  <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                    Lecture Objectives & Summary
                  </h4>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-primary)",
                      backgroundColor: "var(--color-surface-muted)",
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      lineHeight: "1.5",
                      marginBottom: "var(--space-3)",
                    }}
                  >
                    {activeSession.notes || "No notes entered for this session yet."}
                  </div>

                  <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                    Preparation Instructions
                  </h4>
                  <ul style={{ fontSize: "var(--text-xs)", paddingLeft: "16px", color: "var(--color-neutral-dark)", lineHeight: "1.5" }}>
                    {activeSession.instructions.map((inst, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        {inst}
                      </li>
                    ))}
                  </ul>

                  {role === "teacher" && (
                    <div style={{ marginTop: "var(--space-4)" }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActiveNotesSessionId(activeSession.id);
                          setSessionNotesInput(activeSession.notes || "");
                        }}
                      >
                        Edit Session Notes
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: STANDARD ONLINE CLASSROOM PORTAL (Session Schedule & Management)
  // -------------------------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div
          style={{
            backgroundColor: "#34C759",
            color: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* Header Card & Demo Mode Notice */}
      <Card padding="md">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "var(--text-lg)" }}>
                {role === "teacher"
                  ? "Faculty Live Classroom Workspace"
                  : role === "student"
                  ? "Online Classroom & Live Sessions"
                  : role === "parent"
                  ? "Ward's Scheduled Online Classes"
                  : "Academy Live Classrooms & Scheduled Sessions"}
              </h2>
              <Badge variant="accent" size="sm">
                Session 2026–27
              </Badge>
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
              {role === "teacher"
                ? `Manage live classes, initiate interactive sessions, and track enrolled student rosters for ${SAMPLE_TEACHERS.find((t) => t.id === currentTeacherId)?.name}.`
                : role === "student"
                ? "Join scheduled online lectures, practice with faculty on the interactive whiteboard, and access lecture archives."
                : role === "parent"
                ? "Inspect scheduled lectures, live session status, and syllabus coverage for Taha Rahman (Class X)."
                : "Institutional supervision of all faculty live schedules, attendance synchronization, and room allocations."}
            </p>
          </div>

          <Badge variant="warning" size="sm">
            Demo Mode Active
          </Badge>
        </div>

        {/* Clear Demo Label Alert */}
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "10px 14px",
            backgroundColor: "var(--color-surface-muted)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-xs)",
            color: "var(--color-neutral-dark)",
            lineHeight: "1.4",
          }}
        >
          <strong>Simulated Environment:</strong> Starting or ending sessions only modifies local client demo state. No camera hardware is accessed. Real-time audio/video streaming, chat persistence, and multi-user signaling require future WebRTC / SFU media infrastructure.
        </div>
      </Card>

      {/* Countdown Card to Next Scheduled Class */}
      {nextScheduledClass && (
        <Card padding="md" style={{ borderLeft: "4px solid var(--color-accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-accent)" }}>
                  {nextScheduledClass.isLiveNow ? "🔴 Live Classroom Now in Progress" : "⏰ Next Scheduled Session"}
                </span>
                <Badge variant={nextScheduledClass.isLiveNow ? "accent" : "neutral"} size="sm">
                  {nextScheduledClass.session.subject}
                </Badge>
              </div>

              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)" }}>
                {nextScheduledClass.session.topic}
              </div>

              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginTop: "2px" }}>
                {nextScheduledClass.session.batchName} • Faculty: {nextScheduledClass.session.teacherName} • {nextScheduledClass.session.startTime} - {nextScheduledClass.session.endTime}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              {!nextScheduledClass.isLiveNow && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)", fontWeight: 600 }}>
                    Starts In:
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-primary)" }}>
                    {formatTimer(countdownSeconds)}
                  </div>
                </div>
              )}

              {nextScheduledClass.isLiveNow ? (
                <Button
                  variant="primary"
                  onClick={() => handleJoinClass(nextScheduledClass.session.id)}
                >
                  Join Live Class Now →
                </Button>
              ) : role === "teacher" && nextScheduledClass.session.teacherId === currentTeacherId ? (
                <Button
                  variant="primary"
                  onClick={() => handleStartDemoSession(nextScheduledClass.session.id)}
                >
                  Start Demo Session →
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setDetailsModalSession(nextScheduledClass.session)}
                >
                  View Preparation Checklist
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Search & Filter Controls */}
      <Card padding="sm">
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search bar */}
          <div style={{ flex: "1 1 200px" }}>
            <input
              type="text"
              placeholder="Search by topic, faculty, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 12px",
                fontSize: "var(--text-xs)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                outline: "none",
              }}
            />
          </div>

          {/* Subject Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Subject:
            </span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{
                fontSize: "var(--text-xs)",
                padding: "5px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Accountancy">Accountancy</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
              Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                fontSize: "var(--text-xs)",
                padding: "5px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="live-demo">Live Demo</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Admin Faculty Filter */}
          {role === "academy-admin" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                Faculty:
              </span>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "5px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <option value="all">All Faculty</option>
                <option value="tch-azhar">Azhar Sir</option>
                <option value="tch-alvi">Dr. Tariq Alvi</option>
                <option value="tch-roy">Prof. N. Roy</option>
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {(filterSubject !== "all" || filterStatus !== "all" || searchQuery || filterTeacher !== "all") && (
            <button
              type="button"
              onClick={() => {
                setFilterSubject("all");
                setFilterStatus("all");
                setSearchQuery("");
                setFilterTeacher("all");
              }}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Sessions Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
        {visibleSessions.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "var(--space-8)",
              textAlign: "center",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-neutral-dark)",
              fontSize: "var(--text-sm)",
            }}
          >
            <p>No classroom sessions match the selected filter criteria.</p>
            <Button
              variant="secondary"
              size="sm"
              style={{ marginTop: "var(--space-3)" }}
              onClick={() => {
                setFilterSubject("all");
                setFilterStatus("all");
                setSearchQuery("");
                setFilterTeacher("all");
              }}
            >
              Show All Sessions
            </Button>
          </div>
        ) : (
          visibleSessions.map((session) => {
            const isLive = session.status === "live-demo";
            const isUpcoming = session.status === "upcoming";
            const isCompleted = session.status === "completed";

            return (
              <div
                key={session.id}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: isLive ? "2px solid #007AFF" : "1px solid var(--color-border)",
                  padding: "var(--space-4)",
                  boxShadow: isLive ? "0 4px 14px rgba(0, 122, 255, 0.15)" : "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <Badge variant={session.subject === "Mathematics" ? "accent" : "neutral"} size="sm">
                        {session.subject}
                      </Badge>
                      <span style={{ fontSize: "11px", color: "var(--color-neutral-dark)", fontWeight: 500 }}>
                        {session.classGrade}
                      </span>
                    </div>

                    <Badge
                      variant={isLive ? "accent" : isCompleted ? "neutral" : "warning"}
                      size="sm"
                    >
                      {isLive ? "🔴 Live Demo" : isCompleted ? "Completed" : "Upcoming"}
                    </Badge>
                  </div>

                  {/* Topic Title */}
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-primary)", marginBottom: "4px" }}>
                    {session.topic}
                  </div>

                  {/* Timetable & Faculty Information */}
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", lineHeight: "1.5" }}>
                    <div>📅 {session.date} • {session.startTime} - {session.endTime} ({session.durationMinutes} mins)</div>
                    <div>🏷️ {session.batchName}</div>
                    <div>👨‍🏫 Faculty: <strong>{session.teacherName}</strong></div>
                  </div>

                  {/* Short instructions snippet */}
                  {session.instructions.length > 0 && (
                    <div
                      style={{
                        marginTop: "var(--space-2)",
                        fontSize: "11px",
                        color: "var(--color-neutral-dark)",
                        backgroundColor: "var(--color-surface-muted)",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      💡 {session.instructions[0]}
                    </div>
                  )}

                  {/* Completed session note preview */}
                  {isCompleted && session.notes && (
                    <div
                      style={{
                        marginTop: "var(--space-2)",
                        fontSize: "11px",
                        color: "#34C759",
                        backgroundColor: "rgba(52, 199, 89, 0.08)",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      ✓ Notes & Homework recorded. Recording demo archived.
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "var(--space-3)",
                    gap: "var(--space-2)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setDetailsModalSession(session)}
                      style={{
                        fontSize: "11px",
                        color: "var(--color-accent)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: "4px",
                      }}
                    >
                      Instructions
                    </button>

                    {(role === "teacher" || role === "academy-admin") && (
                      <button
                        type="button"
                        onClick={() => setRosterModalSession(session)}
                        style={{
                          fontSize: "11px",
                          color: "var(--color-neutral-dark)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          padding: "4px",
                        }}
                      >
                        Roster
                      </button>
                    )}
                  </div>

                  {/* Contextual Action Button */}
                  {isLive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoinClass(session.id)}
                    >
                      Join Live Demo →
                    </Button>
                  ) : isUpcoming ? (
                    role === "teacher" && session.teacherId === currentTeacherId ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartDemoSession(session.id)}
                      >
                        Start Demo Session
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleJoinClass(session.id)}
                      >
                        Enter Room (Demo)
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveNotesSessionId(session.id);
                        setSessionNotesInput(session.notes || "");
                      }}
                    >
                      {role === "teacher" ? "Edit Notes" : "View Notes"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Batch Student Roster Modal */}
      {rosterModalSession && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRosterModalSession(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
                  Enrolled Students: {rosterModalSession.batchName}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                  {rosterModalSession.subject} • {rosterModalSession.classGrade} • Faculty: {rosterModalSession.teacherName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRosterModalSession(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "var(--text-lg)",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "var(--space-3)" }}>
              {SAMPLE_ENROLLMENTS
                .filter((e) => e.batchName === rosterModalSession.batchName && e.status === "active")
                .map((enr) => {
                  const student = SAMPLE_STUDENTS.find((s) => s.id === enr.studentId);
                  return (
                    <div
                      key={enr.id}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-surface-muted)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>
                          {enr.studentName}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--color-neutral-dark)" }}>
                          Guardian: {student?.guardianName || "Registered Parent"} ({student?.guardianPhone || "Verified"})
                        </div>
                      </div>
                      <Badge variant="accent" size="sm">
                        Enrolled
                      </Badge>
                    </div>
                  );
                })}
            </div>

            <div style={{ marginTop: "var(--space-4)", textAlign: "right" }}>
              <Button size="sm" variant="secondary" onClick={() => setRosterModalSession(null)}>
                Close Roster
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Session Instructions & Details Modal */}
      {detailsModalSession && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailsModalSession(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
              <div>
                <Badge variant="accent" size="sm" style={{ marginBottom: "4px" }}>
                  {detailsModalSession.subject}
                </Badge>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>
                  {detailsModalSession.topic}
                </h3>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)" }}>
                  {detailsModalSession.batchName} • Faculty: {detailsModalSession.teacherName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalSession(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "var(--text-lg)",
                  cursor: "pointer",
                  color: "var(--color-neutral-dark)",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: "var(--space-3)" }}>
              <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
                Student Preparation Checklist:
              </h4>
              <ul style={{ fontSize: "var(--text-xs)", paddingLeft: "16px", color: "var(--color-primary)", lineHeight: "1.6" }}>
                {detailsModalSession.instructions.map((inst, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>
                    {inst}
                  </li>
                ))}
              </ul>

              {detailsModalSession.notes && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, marginBottom: "4px" }}>
                    Faculty Session Notes:
                  </h4>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-neutral-dark)",
                      backgroundColor: "var(--color-surface-muted)",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {detailsModalSession.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button size="sm" variant="secondary" onClick={() => setDetailsModalSession(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setDetailsModalSession(null);
                  handleJoinClass(detailsModalSession.id);
                }}
              >
                Join Classroom (Demo)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Session Notes Editing Modal */}
      {activeNotesSessionId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveNotesSessionId(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--space-4)",
          }}
        >
          <Card padding="lg" style={{ maxWidth: "500px", width: "100%" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
              {role === "teacher" ? "Update Session Lecture Notes" : "Session Lecture Notes"}
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-dark)", marginBottom: "var(--space-3)" }}>
              Summary of key concepts covered, assigned homework, and formula references.
            </p>

            {role === "teacher" ? (
              <textarea
                rows={5}
                value={sessionNotesInput}
                onChange={(e) => setSessionNotesInput(e.target.value)}
                placeholder="Enter key questions solved, homework exercises assigned, and notes..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "var(--text-xs)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  backgroundColor: "var(--color-surface-muted)",
                  padding: "12px",
                  borderRadius: "var(--radius-sm)",
                  lineHeight: "1.5",
                }}
              >
                {sessionNotesInput || "No lecture notes recorded yet for this session."}
              </div>
            )}

            <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Button size="sm" variant="secondary" onClick={() => setActiveNotesSessionId(null)}>
                Cancel
              </Button>
              {role === "teacher" && (
                <Button size="sm" variant="primary" onClick={() => handleSaveNotes(activeNotesSessionId)}>
                  Save Notes
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
