'use client';

import Image from 'next/image';

interface CardBackProps {
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Consistent card back visual with Magic Farm purple/gold branding.
 * Uses Next/Image with fill for optimal loading and rendering.
 *
 * Usage: pass as `backContent` in CardData for a professional card back.
 *
 * @example
 * const card: CardData = {
 *   id: '1',
 *   backContent: <CardBack />,
 *   faceContent: <span>A♠</span>,
 * };
 */
export function CardBack({ className = '' }: CardBackProps) {
  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{ aspectRatio: '2 / 3' }}
    >
      <Image
        src="/cards/back.svg"
        alt="Retro della carta"
        fill
        sizes="(max-width: 768px) 56px, 112px"
        priority
        className="rounded-xl object-cover"
        draggable={false}
      />
    </div>
  );
}
