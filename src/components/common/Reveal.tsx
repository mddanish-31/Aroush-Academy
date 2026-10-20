"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMotion } from "@/lib/motion/MotionProvider";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Reveal({ children, delay = 0, className = "", style = {} }: RevealProps) {
  const { motion } = useMotion();
  const isReduced = motion === "reduced";
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isReduced) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isReduced]);

  const shown = isReduced || isVisible;

  return (
    <div
      ref={ref}
      className={`reveal-item ${className}`.trim()}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(12px)",
        transitionProperty: isReduced ? "none" : "opacity, transform",
        transitionDuration: isReduced ? "0ms" : "350ms",
        transitionTimingFunction: "ease-out",
        transitionDelay: isReduced ? "0ms" : `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
