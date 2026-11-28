"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useMotion } from "@/lib/motion/MotionProvider";
import type { MediaItem } from "@/content/types";

interface HeroGalleryProps {
  items: MediaItem[];
}

const TILE_CONFIGS = [
  { width: 420, height: 280, topOffset: 24 },
  { width: 300, height: 375, topOffset: 0 },
  { width: 320, height: 320, topOffset: 36 },
  { width: 420, height: 280, topOffset: 12 },
  { width: 300, height: 375, topOffset: 30 },
  { width: 320, height: 320, topOffset: 6 },
  { width: 420, height: 280, topOffset: 20 },
];

export function HeroGallery({ items }: HeroGalleryProps) {
  const { motion } = useMotion();
  const isReduced = motion === "reduced";

  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPointerOverRef = useRef(false);

  const pauseAndScheduleResume = useCallback(() => {
    setIsUserPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      if (!isPointerOverRef.current && !pointerDownRef.current) {
        setIsUserPaused(false);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isReduced) return;
    const el = viewportRef.current;
    if (!el) return;

    let lastTime = performance.now();
    let accumulatedFraction = 0;
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      const canDrift =
        !isManualPaused &&
        !isUserPaused &&
        !isDragging &&
        isInView &&
        !isTabHidden;

      if (canDrift) {
        accumulatedFraction += 30 * deltaSec;
        const step = Math.floor(accumulatedFraction);
        if (step > 0) {
          el.scrollLeft += step;
          accumulatedFraction -= step;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isReduced, isManualPaused, isUserPaused, isDragging, isInView, isTabHidden]);

  useEffect(() => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el || !track) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const checkRecenter = () => {
      if (pointerDownRef.current) return;
      if (track.children.length < items.length * 2) return;
      const secondSet = track.children[items.length] as HTMLElement;
      if (!secondSet) return;
      const setWidth = secondSet.offsetLeft;
      if (setWidth <= 0) return;

      if (el.scrollLeft >= setWidth * 2 - 50) {
        el.scrollLeft -= setWidth;
      } else if (el.scrollLeft < 50) {
        el.scrollLeft += setWidth;
      }
    };

    el.addEventListener("scrollend", checkRecenter);

    const onScroll = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(checkRecenter, 180);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const initTimer = setTimeout(() => {
      if (track.children.length >= items.length * 2) {
        const secondSet = track.children[items.length] as HTMLElement;
        if (secondSet && secondSet.offsetLeft > 0 && el.scrollLeft < 100) {
          el.scrollLeft = secondSet.offsetLeft;
        }
      }
    }, 50);

    return () => {
      el.removeEventListener("scrollend", checkRecenter);
      el.removeEventListener("scroll", onScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
      clearTimeout(initTimer);
    };
  }, [items.length]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = viewportRef.current;
    if (!el) return;

    pointerDownRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;
    hasDraggedRef.current = false;
    setIsDragging(true);
    setIsUserPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current) return;
    const el = viewportRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 3) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = startScrollLeftRef.current - dx;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerDownRef.current) {
      pointerDownRef.current = false;
      setIsDragging(false);
      const el = viewportRef.current;
      if (el) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
        }
      }
      pauseAndScheduleResume();
    }
  };

  const handleWheel = () => {
    pauseAndScheduleResume();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      el.scrollBy({ left: 240, behavior: isReduced ? "auto" : "smooth" });
      pauseAndScheduleResume();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      el.scrollBy({ left: -240, behavior: isReduced ? "auto" : "smooth" });
      pauseAndScheduleResume();
    }
  };

  const handleScrollButton = (direction: "left" | "right") => {
    const el = viewportRef.current;
    if (!el) return;
    const distance = 340;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: isReduced ? "auto" : "smooth",
    });
    pauseAndScheduleResume();
  };

  const renderTiles = (isClone: boolean, keyPrefix: string) => {
    return items.map((item, index) => {
      const cfg = TILE_CONFIGS[index % TILE_CONFIGS.length];
      return (
        <div
          key={`${keyPrefix}-${item.id}`}
          className="hero-gallery-item"
          aria-hidden={isClone ? "true" : undefined}
          inert={isClone ? true : undefined}
          style={{
            width: `${cfg.width}px`,
            paddingTop: `${cfg.topOffset}px`,
          }}
        >
          <div
            style={{
              width: `${cfg.width}px`,
              height: `${cfg.height}px`,
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "var(--brand-sky)",
              border: "1px solid var(--color-border)",
              position: "relative",
            }}
          >
            <Image
              src={item.url}
              alt={isClone ? "" : item.alt}
              width={cfg.width}
              height={cfg.height}
              preload={!isClone && index < 2}
              loading={!isClone && index < 2 ? "eager" : "lazy"}
              draggable={false}
              sizes="(max-width: 768px) 300px, 420px"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
          {item.caption && (
            <div
              style={{
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                marginTop: "10px",
                padding: "0 4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: `${cfg.width}px`,
              }}
            >
              {item.caption}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="hero-enter-gallery" style={{ marginTop: "clamp(20px, 3.5vw, 32px)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          maxWidth: "1280px",
          margin: "0 auto 10px",
          padding: "0 24px",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => setIsManualPaused(!isManualPaused)}
          aria-label={isManualPaused ? "Resume gallery animation" : "Pause gallery animation"}
          aria-pressed={isManualPaused}
          style={{
            height: "32px",
            padding: "0 12px",
            borderRadius: "8px",
            border: "1px solid var(--color-input-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--brand-navy)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {isManualPaused ? <Play size={14} /> : <Pause size={14} />}
          <span>{isManualPaused ? "Play" : "Pause"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleScrollButton("left")}
          aria-label="Scroll gallery left"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid var(--color-input-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--brand-navy)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => handleScrollButton("right")}
          aria-label="Scroll gallery right"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid var(--color-input-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--brand-navy)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-label="Photo gallery"
        tabIndex={0}
        className={`hero-gallery-viewport ${isDragging ? "is-dragging" : ""}`}
        style={{
          touchAction: "pan-x pan-y pinch-zoom",
          overscrollBehaviorX: "contain",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={() => {
          isPointerOverRef.current = true;
          setIsUserPaused(true);
        }}
        onPointerLeave={() => {
          isPointerOverRef.current = false;
          pauseAndScheduleResume();
        }}
        onFocus={() => setIsUserPaused(true)}
        onBlur={() => pauseAndScheduleResume()}
        onWheel={handleWheel}
        onTouchStart={() => setIsUserPaused(true)}
        onTouchEnd={() => pauseAndScheduleResume()}
        onKeyDown={handleKeyDown}
        onClickCapture={(e) => {
          if (hasDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div ref={trackRef} className="hero-gallery-track">
          {renderTiles(false, "orig")}
          {renderTiles(true, "copy1")}
          {renderTiles(true, "copy2")}
        </div>
      </div>
    </div>
  );
}
