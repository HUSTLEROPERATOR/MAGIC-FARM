'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
}

interface MagicSparklesProps {
  /** When true, fires the sparkle burst. Resets automatically. */
  active: boolean;
  /** Called when the animation finishes. */
  onDone?: () => void;
  /** Number of particles (default 10). */
  density?: number;
  /** Total animation duration in ms (default 750). */
  durationMs?: number;
}

/**
 * On-demand sparkle burst effect.
 * No permanent loops — mobile-safe.
 */
export function MagicSparkles({
  active,
  onDone,
  density = 10,
  durationMs = 750,
}: MagicSparklesProps) {
  const [visible, setVisible] = useState(false);

  const particles: Particle[] = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50, // -50 to 50 px spread
      y: Math.random() * -80 - 20, // upward
      size: Math.random() * 8 + 4, // 4-12 px
      rotation: Math.random() * 360,
      delay: Math.random() * 0.15,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, density]);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [active, durationMs, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <span className="pointer-events-none absolute inset-0 overflow-visible">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: 0,
                scale: 1,
                x: p.x,
                y: p.y,
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: durationMs / 1000,
                delay: p.delay,
                ease: 'easeOut',
              }}
              className="absolute left-1/2 top-1/2 text-magic-gold"
              style={{ fontSize: p.size }}
            >
              ✦
            </motion.span>
          ))}
        </span>
      )}
    </AnimatePresence>
  );
}
