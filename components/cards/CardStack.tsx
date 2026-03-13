'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { CardData } from '@/types/card';
import { CardBack } from './CardBack';
import { CardFrame } from './CardFrame';
import {
  CARD_SIZES,
  CARD_ASPECT_RATIO,
  CARD_PERSPECTIVE,
  CARD_REVEAL_SCALE,
  type CardSize,
} from '@/lib/ui/tokens';
import { SPRING_STACK, TIMING_DRAMATIC, INSTANT } from '@/lib/motion/presets';

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
  const reduced = useReducedMotion();
  const { width, height } = CARD_SIZES[size];

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
            style={{
              position: 'absolute',
              zIndex: i,
              willChange: 'transform',
            }}
            animate={{ x: offsetX, y: offsetY }}
            transition={reduced ? INSTANT : SPRING_STACK}
          >
            <div
              style={{
                perspective: CARD_PERSPECTIVE,
                width,
                height,
                aspectRatio: CARD_ASPECT_RATIO,
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
                  willChange: 'transform',
                }}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  scale: isFlipped ? CARD_REVEAL_SCALE : 1,
                }}
                transition={reduced ? INSTANT : TIMING_DRAMATIC}
              >
                {/* Back face */}
                <div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-magic-purple/40 to-indigo-900/50 border border-white/10 flex items-center justify-center overflow-hidden"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {card.backContent ?? <CardBack />}
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
