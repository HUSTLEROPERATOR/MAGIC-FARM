'use client';

import { motion } from 'framer-motion';
import type { CardData } from '@/types/card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hapticDragStart } from '@/lib/feedback/haptics';
import { trackUxEvent } from '@/lib/telemetry/ux-events';
import {
  CARD_PERSPECTIVE,
  CARD_HOVER_LIFT_PX,
  Z_CARD_GLOW_OVERLAY,
  TRANSITION_FLIP,
  TRANSITION_FLIP_INSTANT,
  TRANSITION_HOVER_SPRING,
  DURATION_SELECTION_IN_S,
} from '@/lib/ui/tokens';

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
  const reducedMotion = useReducedMotion();

  function handleClick() {
    if (!isClickable || !onClick) return;
    hapticDragStart();
    trackUxEvent('card_drag_started', { cardId: card.id });
    onClick();
  }

  return (
    <motion.div
      className={className}
      style={{
        perspective: CARD_PERSPECTIVE,
        width,
        height,
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
      }}
      animate={{ opacity: isEliminated ? 0.35 : 1 }}
      whileHover={
        isClickable && !reducedMotion ? { y: CARD_HOVER_LIFT_PX } : undefined
      }
      transition={TRANSITION_HOVER_SPRING}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Gold selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl ring-2 ring-magic-gold/80 shadow-lg shadow-magic-gold/40 pointer-events-none"
          style={{ zIndex: Z_CARD_GLOW_OVERLAY }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION_SELECTION_IN_S }}
        />
      )}

      {/* Card flip container */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={reducedMotion ? TRANSITION_FLIP_INSTANT : TRANSITION_FLIP}
      >
        {/* Back face */}
        <div
          className={`absolute inset-0 rounded-xl flex items-center justify-center overflow-hidden
            bg-gradient-to-br from-magic-purple/40 to-indigo-900/50
            ${isSelected ? 'border border-magic-gold/50' : 'border border-white/10'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {card.backContent}
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
          {card.faceContent}
        </div>
      </motion.div>
    </motion.div>
  );
}
