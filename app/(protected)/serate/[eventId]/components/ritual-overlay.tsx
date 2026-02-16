'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/icon';

interface RitualOverlayProps {
  eventId: string;
  eventStatus: string;
}

export function RitualOverlay({ eventId, eventStatus }: RitualOverlayProps) {
  const [narrative, setNarrative] = useState<{
    theme?: string;
    openingNarrative?: string;
    closingNarrative?: string;
    nextEventTeaser?: string;
  } | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'opening' | 'closing'>('opening');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`/api/serate/${eventId}/ritual`)
      .then((r) => r.json())
      .then((data) => {
        setNarrative(data);
        // Auto-show opening narrative if LIVE and has content
        if (data.openingNarrative && eventStatus === 'LIVE' && !dismissed) {
          setOverlayType('opening');
          setShowOverlay(true);
        }
      })
      .catch(() => {});
  }, [eventId, eventStatus, dismissed]);

  if (!narrative) return null;

  const hasOpening = !!narrative.openingNarrative;
  const hasClosing = !!narrative.closingNarrative && eventStatus === 'ENDED';

  if (!hasOpening && !hasClosing) return null;

  return (
    <>
      {/* Trigger buttons */}
      <div className="flex gap-2 flex-wrap">
        {hasOpening && (
          <button
            onClick={() => { setOverlayType('opening'); setShowOverlay(true); }}
            className="text-xs px-3 py-1.5 rounded-full bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/30 transition-colors"
          >
            <Icon name="ScrollText" size="sm" className="inline" /> Rituale d&apos;Apertura
          </button>
        )}
        {hasClosing && (
          <button
            onClick={() => { setOverlayType('closing'); setShowOverlay(true); }}
            className="text-xs px-3 py-1.5 rounded-full bg-magic-gold/20 text-magic-gold hover:bg-magic-gold/30 transition-colors"
          >
            <Icon name="Moon" size="sm" className="inline" /> Rituale di Chiusura
          </button>
        )}
      </div>

      {/* Full-screen overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => { setShowOverlay(false); setDismissed(true); }}
          />
          <div className="relative max-w-2xl w-full mx-4 animate-fade-in">
            {/* Stars background effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-magic-gold rounded-full animate-twinkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative card-magic border-magic-gold/40 p-8 md:p-12 text-center space-y-6">
              {/* Theme badge */}
              {narrative.theme && (
                <div className="text-xs uppercase tracking-[0.3em] text-magic-mystic/60">
                  {narrative.theme}
                </div>
              )}

              {/* Icon */}
              <div className="text-6xl flex justify-center">
                {overlayType === 'opening' ? <Icon name="CrystalBall" size="3xl" className="text-magic-mystic" /> : <Icon name="Moon" size="3xl" className="text-magic-gold" />}
              </div>

              {/* Title */}
              <h2 className="font-cinzel text-2xl md:text-3xl text-magic-gold glow-text">
                {overlayType === 'opening' ? 'Il Rituale ha Inizio' : 'Il Cerchio si Chiude'}
              </h2>

              {/* Narrative text */}
              <div className="text-white/80 leading-relaxed text-sm md:text-base whitespace-pre-wrap max-h-[40vh] overflow-y-auto px-4">
                {overlayType === 'opening'
                  ? narrative.openingNarrative
                  : narrative.closingNarrative}
              </div>

              {/* Teaser for next event */}
              {overlayType === 'closing' && narrative.nextEventTeaser && (
                <div className="mt-6 pt-6 border-t border-magic-gold/20">
                  <p className="text-xs text-magic-mystic/60 uppercase tracking-wider mb-2">
                    Prossimamente...
                  </p>
                  <p className="text-magic-gold/80 text-sm italic">
                    {narrative.nextEventTeaser}
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => { setShowOverlay(false); setDismissed(true); }}
                className="btn-magic text-sm mx-auto"
              >
                {overlayType === 'opening' ? <><Icon name="Sparkles" size="sm" className="inline" /> Che la magia abbia inizio</> : <><Icon name="Star" size="sm" className="inline" /> Chiudi</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
