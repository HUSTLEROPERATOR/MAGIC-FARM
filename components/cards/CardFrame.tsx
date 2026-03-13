'use client';

import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import type { CSSProperties } from 'react';

type FrameVariant = 'selected' | 'gold' | 'none';

interface CardFrameProps {
  /** Which frame style to render */
  variant: FrameVariant;
  /** Optional className for the wrapper */
  className?: string;
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

/** Corner positions for gold-reveal sparkle particles */
const SPARKLE_POSITIONS: CSSProperties[] = [
  { top: 3, left: 5 },
  { top: 3, right: 5 },
  { bottom: 3, left: 5 },
  { bottom: 3, right: 5 },
];

/**
 * Reusable card frame overlay component.
 *
 * - `selected`: subtle gold highlight for selected state
 * - `gold`: full gold border + glow + animated corner sparkles for final reveal
 * - `none`: renders nothing
 *
 * Positioned absolute within a card container to overlay the card face.
 */
export function CardFrame({ variant, className = '' }: CardFrameProps) {
  if (variant === 'none') return null;

  const src = variant === 'gold' ? '/cards/frame-gold.svg' : '/cards/frame-selected.svg';

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      transition={{ duration: variant === 'gold' ? 0.4 : 0.2 }}
    >
      <Image
        src={src}
        alt=""
        role="presentation"
        fill
        sizes="(max-width: 768px) 56px, 112px"
        className="rounded-xl object-cover"
        draggable={false}
      />
      {variant === 'gold' &&
        SPARKLE_POSITIONS.map((pos, i) => (
          <motion.span
            key={i}
            className="absolute text-magic-gold select-none"
            style={{ ...pos, fontSize: 8, lineHeight: 1 }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.4, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }}
            aria-hidden="true"
          >
            ✦
          </motion.span>
        ))}
    </motion.div>
  );
}
