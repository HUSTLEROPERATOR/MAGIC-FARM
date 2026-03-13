'use client';

import { motion } from 'framer-motion';
import { InteractiveCard, type InteractiveCardProps } from './InteractiveCard';
import { fanPosition, zIndexCalculation } from '@/lib/cards/cardMath';
import type { CardData } from '@/types/card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TRANSITION_FAN_SPRING } from '@/lib/ui/tokens';

type CardSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 56, height: 80 },
  md: { width: 80, height: 112 },
  lg: { width: 112, height: 160 },
};

interface CardFanHandProps {
  cards: CardData[];
  /** Which card indices are face-up */
  flipped?: boolean[];
  /** Which card indices are selected */
  selected?: number[];
  /** Which card indices are eliminated (dimmed) */
  eliminated?: number[];
  onCardClick?: (index: number) => void;
  disabled?: boolean;
  size?: InteractiveCardProps['size'];
}

/**
 * Renders a set of cards arranged in a smooth curved fan.
 * Supports hover lift, selection highlight, and elimination dimming.
 */
export function CardFanHand({
  cards,
  flipped = [],
  selected = [],
  eliminated = [],
  onCardClick,
  disabled = false,
  size = 'sm',
}: CardFanHandProps) {
  const total = cards.length;
  // Use SIZE_MAP as the single source of truth for card dimensions.
  const cardHeight = SIZE_MAP[size as CardSize].height;
  const containerHeight = cardHeight + 40;
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex justify-center"
      style={{ height: containerHeight }}
    >
      {cards.map((card, i) => {
        const pos = fanPosition(i, total);
        const zIdx = zIndexCalculation(i, selected.includes(i));
        return (
          <motion.div
            key={card.id}
            style={{ position: 'absolute', zIndex: zIdx, top: 8 }}
            animate={
              reducedMotion
                ? { x: pos.x, y: 0, rotate: 0 }
                : { x: pos.x, y: pos.y, rotate: pos.rotate }
            }
            transition={TRANSITION_FAN_SPRING}
          >
            <InteractiveCard
              card={card}
              isFlipped={flipped[i] ?? false}
              isSelected={selected.includes(i)}
              isEliminated={eliminated.includes(i)}
              onClick={onCardClick ? () => onCardClick(i) : undefined}
              disabled={disabled}
              size={size}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
