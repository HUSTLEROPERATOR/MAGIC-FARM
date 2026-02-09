'use client';

import { useState } from 'react';

interface SpectatorToggleProps {
  eventId: string;
  spectatorAvailable: boolean;
}

export function SpectatorToggle({ eventId, spectatorAvailable }: SpectatorToggleProps) {
  const [isSpectator, setIsSpectator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!spectatorAvailable) return null;

  async function toggle() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/serate/${eventId}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isSpectator }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsSpectator(data.spectatorMode);
        setMessage(data.message);
      }
    } catch {
      setMessage('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic border-magic-mystic/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isSpectator ? '👁️' : '🎮'}</span>
          <div>
            <p className="text-sm text-white font-medium">
              {isSpectator ? 'Modalità Spettatore' : 'Modalità Giocatore'}
            </p>
            <p className="text-[10px] text-white/40">
              {isSpectator
                ? 'Le risposte non contano per la classifica'
                : 'Le risposte contano per la classifica'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isSpectator ? 'bg-magic-mystic/30' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
              isSpectator
                ? 'left-6 bg-magic-mystic'
                : 'left-0.5 bg-white/40'
            }`}
          />
        </button>
      </div>
      {message && (
        <p className="text-xs text-magic-mystic/60 mt-2">{message}</p>
      )}
    </div>
  );
}
