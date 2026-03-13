'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { InteractiveCard, type InteractiveCardProps } from './InteractiveCard';
import { fanPosition, zIndexCalculation } from '@/lib/cards/cardMath';
import type { CardData } from '@/types/card';
import { CARD_SIZES, type CardSize } from '@/lib/ui/tokens';
import { SPRING_FAN, INSTANT } from '@/lib/motion/presets';

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
  const reduced = useReducedMotion();
  const total = cards.length;
  const { height: cardHeight } = CARD_SIZES[size as CardSize];
  // Extra vertical room for the arc drop + hover lift
  const containerHeight = cardHeight + 40;

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
            style={{
              position: 'absolute',
              zIndex: zIdx,
              top: 8,
              willChange: 'transform',
            }}
            animate={{ x: pos.x, y: pos.y, rotate: pos.rotate }}
            transition={reduced ? INSTANT : SPRING_FAN}
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
