'use client';

import { motion } from 'framer-motion';
import type { CardData } from '@/types/card';
import { CardFrame } from './CardFrame';

type CardSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 56, height: 80 },
  md: { width: 80, height: 112 },
  lg: { width: 112, height: 160 },
};

interface CardStackProps {
  cards: CardData[];
  /** Which card indices are face-up (showing faceContent) */
  flipped?: boolean[];
  size?: CardSize;
}

/**
 * Renders a deck-like stack of cards with slight offsets.
 * Individual cards can be flipped face-up via the `flipped` prop.
 * Flipped cards show a gold CardFrame overlay for reveal emphasis.
 * Designed for revealing predictions one by one.
 */
export function CardStack({
  cards,
  flipped = [],
  size = 'md',
}: CardStackProps) {
  const { width, height } = SIZE_MAP[size];

  return (
    <div
      className="relative flex justify-center"
      style={{ height: height + 16, minWidth: width + 32 }}
    >
      {cards.map((card, i) => {
        const isFlipped = flipped[i] ?? false;
        // Spread cards slightly so the stack is visible
        const offsetX = (i - (cards.length - 1) / 2) * 6;
        const offsetY = -i * 3;

        return (
          <motion.div
            key={card.id}
            style={{ position: 'absolute', zIndex: i }}
            animate={{ x: offsetX, y: offsetY }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div
              style={{
                perspective: 1000,
                width,
                height,
                aspectRatio: '2 / 3',
                position: 'relative',
              }}
            >
              {/* Gold frame overlay on revealed cards */}
              <CardFrame variant={isFlipped ? 'gold' : 'none'} />

              <motion.div
                style={{
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                }}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  scale: isFlipped ? 1.05 : 1,
                }}
                transition={{ type: 'tween', duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Back face */}
                <div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-magic-purple/40 to-indigo-900/50 border border-white/10 flex items-center justify-center overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {card.backContent}
                </div>

                {/* Front face */}
                <div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-magic-gold/10 to-white/5 border border-magic-gold/30 flex items-center justify-center overflow-hidden p-1"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {card.faceContent}
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
