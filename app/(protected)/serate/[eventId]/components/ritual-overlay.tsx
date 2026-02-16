'use client';

import { useState, useEffect } from 'react';

interface RitualOverlayProps {
  eventId: string;
  eventStatus: string;
}

interface RitualData {
  openingNarrative?: string | null;
  closingNarrative?: string | null;
  nextEventTeaser?: string | null;
  theme?: string | null;
}

export function RitualOverlay({ eventId, eventStatus }: RitualOverlayProps) {
  const [ritual, setRitual] = useState<RitualData | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState<'opening' | 'closing'>('opening');

  useEffect(() => {
    if (eventStatus !== 'LIVE' && eventStatus !== 'ENDED') return;

    fetch(`/api/serate/${eventId}/ritual`)
      .then((r) => r.json())
      .then((data) => {
        setRitual(data);
      })
      .catch(() => {});
  }, [eventId, eventStatus]);

  if (!ritual) return null;

  const hasOpening = ritual.openingNarrative && (eventStatus === 'LIVE' || eventStatus === 'ENDED');
  const hasClosing = ritual.closingNarrative && eventStatus === 'ENDED';

  if (!hasOpening && !hasClosing) return null;

  function openOverlay(type: 'opening' | 'closing') {
    setOverlayType(type);
    setShowOverlay(true);
  }

  const narrativeText = overlayType === 'opening'
    ? ritual.openingNarrative
    : ritual.closingNarrative;

  return (
    <>
      {/* Trigger buttons */}
      <div className="flex gap-2 flex-wrap">
        {hasOpening && (
          <button
            onClick={() => openOverlay('opening')}
            className="text-xs px-3 py-1.5 rounded-full bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/30 transition-colors"
          >
            📜 Rituale di Apertura
          </button>
        )}
        {hasClosing && (
          <button
            onClick={() => openOverlay('closing')}
            className="text-xs px-3 py-1.5 rounded-full bg-magic-gold/10 text-magic-gold hover:bg-magic-gold/20 transition-colors"
          >
            🌙 Rituale di Chiusura
          </button>
        )}
      </div>

      {/* Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-50">
          <div className="max-w-xl w-full text-center">
            <div className="text-6xl mb-6">
              {overlayType === 'opening' ? '🎩' : '🌙'}
            </div>
            <h2 className="font-cinzel text-2xl text-magic-gold mb-6">
              {overlayType === 'opening' ? 'Rituale di Apertura' : 'Rituale di Chiusura'}
            </h2>
            <p className="text-white/80 leading-relaxed text-lg mb-8 whitespace-pre-line">
              {narrativeText}
            </p>

            {overlayType === 'closing' && ritual.nextEventTeaser && (
              <div className="card-magic border-magic-mystic/30 mb-8">
                <p className="text-magic-mystic text-sm italic">
                  🔮 {ritual.nextEventTeaser}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowOverlay(false)}
              className="btn-magic"
            >
              Continua
            </button>
          </div>
        </div>
      )}
    </>
  );
}
