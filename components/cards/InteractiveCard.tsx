'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { CardData } from '@/types/card';
import { CardBack } from './CardBack';
import { CardFrame } from './CardFrame';

type CardSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 56, height: 80 },
  md: { width: 80, height: 112 },
  lg: { width: 112, height: 160 },
};

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
  const { width, height } = SIZE_MAP[size];
  const isClickable = !disabled && !isEliminated && !!onClick;
  // Gold final reveal when the card is face-up and selected
  const isGoldReveal = isFlipped && isSelected;
  const frameVariant = isGoldReveal ? 'gold' : isSelected ? 'selected' : 'none';

  return (
    <motion.div
      className={className}
      style={{
        perspective: 1000,
        width,
        height,
        aspectRatio: '2 / 3',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
      }}
      animate={{
        opacity: isEliminated ? 0.35 : 1,
        scale: isGoldReveal ? 1.05 : 1,
      }}
      whileHover={isClickable ? { y: -8 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Gold selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-magic-gold/80 shadow-lg shadow-magic-gold/40 pointer-events-none"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
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
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'tween', duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
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
