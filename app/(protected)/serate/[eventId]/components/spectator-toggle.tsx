'use client';

import { useState } from 'react';

interface SpectatorToggleProps {
  eventId: string;
  spectatorAvailable: boolean;
}

export function SpectatorToggle({ eventId, spectatorAvailable }: SpectatorToggleProps) {
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!spectatorAvailable) return null;

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !spectatorMode }),
      });
      const data = await res.json();
      if (res.ok) {
        setSpectatorMode(data.spectatorMode);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">👁️</span>
          <div>
            <h3 className="text-white text-sm font-medium">Modalità Spettatore</h3>
            <p className="text-white/30 text-[10px]">
              Le risposte non contano per la classifica
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            spectatorMode ? 'bg-magic-mystic' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              spectatorMode ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
