'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { CardData } from '@/types/card';
import { CardBack } from './CardBack';
import { CardFrame } from './CardFrame';
import {
  CARD_SIZES,
  CARD_ASPECT_RATIO,
  CARD_PERSPECTIVE,
  CARD_HOVER_LIFT_PX,
  CARD_REVEAL_SCALE,
  CARD_ELIMINATED_OPACITY,
  type CardSize,
} from '@/lib/ui/tokens';
import { SPRING_HOVER, FLIP_NORMAL, TIMING_FAST, INSTANT } from '@/lib/motion/presets';

export interface InteractiveCardProps {
  card: CardData;
  /** Whether to show the face (true) or back (false, default) */
  isFlipped?: boolean;
  /** Renders gold glow ring */
  isSelected?: boolean;
  /** Dims the card and disables interaction */
  isEliminated?: boolean;
  onClick?: () => void;
  className?: string;
  size?: CardSize;
  disabled?: boolean;
}

/**
 * A single interactive playing card with:
 * - Framer Motion spring hover lift
 * - Framer Motion tween rotateY flip animation
 * - Gold glow ring when selected
 * - CardFrame overlay: gold frame on final reveal (flipped + selected), selected frame otherwise
 */
export function InteractiveCard({
  card,
  isFlipped = false,
  isSelected = false,
  isEliminated = false,
  onClick,
  className = '',
  size = 'md',
  disabled = false,
}: InteractiveCardProps) {
  const reduced = useReducedMotion();
  const { width, height } = CARD_SIZES[size];
  const isClickable = !disabled && !isEliminated && !!onClick;
  // Gold final reveal when the card is face-up and selected
  const isGoldReveal = isFlipped && isSelected;
  const frameVariant = isGoldReveal ? 'gold' : isSelected ? 'selected' : 'none';

  return (
    <motion.div
      className={className}
      style={{
        perspective: CARD_PERSPECTIVE,
        width,
        height,
        aspectRatio: CARD_ASPECT_RATIO,
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
        willChange: isClickable ? 'transform' : 'auto',
      }}
      animate={{
        opacity: isEliminated ? CARD_ELIMINATED_OPACITY : 1,
        scale: isGoldReveal ? CARD_REVEAL_SCALE : 1,
      }}
      whileHover={isClickable ? { y: CARD_HOVER_LIFT_PX } : undefined}
      transition={reduced ? INSTANT : SPRING_HOVER}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Gold selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-magic-gold/80 shadow-lg shadow-magic-gold/40 pointer-events-none"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? INSTANT : TIMING_FAST}
        />
      )}

      {/* Frame overlay (selected or gold reveal) */}
      <CardFrame variant={frameVariant} />

      {/* Card flip container */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          position: 'relative',
          willChange: 'transform',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={reduced ? INSTANT : FLIP_NORMAL}
      >
        {/* Back face */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden
            bg-gradient-to-br from-magic-purple/40 to-indigo-900/50
            ${isSelected ? 'border border-magic-gold/50' : 'border border-white/10'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {card.backContent ?? <CardBack />}
        </div>

        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden p-1
            bg-gradient-to-br from-white/10 to-white/5
            ${isSelected ? 'border border-magic-gold/50' : 'border border-white/10'}`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {card.faceContent ?? (
            <div className="relative w-full h-full">
              <Image
                src="/cards/face-placeholder.svg"
                alt="Contenuto carta"
                fill
                sizes="(max-width: 768px) 56px, 112px"
                loading="lazy"
                className="rounded-xl object-cover"
                draggable={false}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
