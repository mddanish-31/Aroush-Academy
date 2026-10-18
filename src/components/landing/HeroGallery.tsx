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
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const updateScrollState = useCallback(() => {
    if (!viewportRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && !isReduced) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    const currentVideos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    currentVideos.forEach((v) => observer.observe(v));

    return () => {
      currentVideos.forEach((v) => observer.unobserve(v));
    };
  }, [isReduced]);

  const handleScroll = (direction: "left" | "right") => {
    if (!viewportRef.current) return;
    const distance = 340;
    viewportRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: isReduced ? "auto" : "smooth",
    });
  };

  const shouldPauseDrift = isPaused || isInteracting;

  return (
    <div className="hero-enter-gallery" style={{ marginTop: "clamp(32px, 5vw, 56px)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          maxWidth: "1280px",
          margin: "0 auto 12px",
          padding: "0 24px",
          gap: "8px",
        }}
      >
        {isReduced ? (
          <div style={{ display: "inline-flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll gallery left"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid rgba(170, 170, 170, 0.4)",
                backgroundColor: "#FFFFFF",
                color: "#1D1D1F",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canScrollLeft ? "pointer" : "not-allowed",
                opacity: canScrollLeft ? 1 : 0.4,
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll gallery right"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid rgba(170, 170, 170, 0.4)",
                backgroundColor: "#FFFFFF",
                color: "#1D1D1F",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canScrollRight ? "pointer" : "not-allowed",
                opacity: canScrollRight ? 1 : 0.4,
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "Resume gallery animation" : "Pause gallery animation"}
            aria-pressed={isPaused}
            style={{
              height: "32px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid rgba(170, 170, 170, 0.4)",
              backgroundColor: "#FFFFFF",
              color: "#1D1D1F",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? "Play" : "Pause"}</span>
          </button>
        )}
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-label="Photo gallery"
        className={`hero-gallery-viewport ${isReduced ? "is-reduced-motion" : ""}`}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
        onWheel={() => {
          setIsInteracting(true);
          setTimeout(() => setIsInteracting(false), 800);
        }}
      >
        <div
          className={`hero-gallery-track ${shouldPauseDrift ? "is-paused" : ""}`}
          style={{
            animationPlayState: shouldPauseDrift ? "paused" : "running",
          }}
        >
          {items.map((item, index) => {
            const cfg = TILE_CONFIGS[index % TILE_CONFIGS.length];
            return (
              <div
                key={item.id}
                className="hero-gallery-item"
                style={{
                  width: `${cfg.width}px`,
                  paddingTop: `${cfg.topOffset}px`,
                }}
              >
                <div
                  style={{
                    width: `${cfg.width}px`,
                    height: `${cfg.height}px`,
                    borderRadius: "20px",
                    overflow: "hidden",
                    backgroundColor: "#E5E5EA",
                    position: "relative",
                  }}
                >
                  {item.kind === "video" && item.video ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={item.video.src}
                      poster={item.posterUrl}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.alt}
                      width={cfg.width}
                      height={cfg.height}
                      preload={index < 3}
                      loading={index < 3 ? "eager" : "lazy"}
                      sizes="(max-width: 768px) 300px, 420px"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
                {item.caption && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "rgba(29, 29, 31, 0.72)",
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
          })}

          {!isReduced &&
            items.map((item, index) => {
              const cfg = TILE_CONFIGS[index % TILE_CONFIGS.length];
              return (
                <div
                  key={`dup-${item.id}`}
                  className="hero-gallery-item"
                  aria-hidden="true"
                  inert
                  style={{
                    width: `${cfg.width}px`,
                    paddingTop: `${cfg.topOffset}px`,
                  }}
                >
                  <div
                    style={{
                      width: `${cfg.width}px`,
                      height: `${cfg.height}px`,
                      borderRadius: "20px",
                      overflow: "hidden",
                      backgroundColor: "#E5E5EA",
                      position: "relative",
                    }}
                  >
                    {item.kind === "video" && item.video ? (
                      <video
                        src={item.video.src}
                        poster={item.posterUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt=""
                        width={cfg.width}
                        height={cfg.height}
                        loading="lazy"
                        sizes="(max-width: 768px) 300px, 420px"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    )}
                  </div>
                  {item.caption && (
                    <div
                      style={{
                        fontSize: "14px",
                        color: "rgba(29, 29, 31, 0.72)",
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
            })}
        </div>
      </div>
    </div>
  );
}
