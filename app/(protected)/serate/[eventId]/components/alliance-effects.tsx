'use client';

import { useState, useEffect } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

interface AllianceInfo {
  id: string;
  ally: string;
  effectType: string;
  sharedHints: boolean;
  bonusPoints: number;
  commonGoal: string | null;
  commonGoalMet: boolean;
}

interface AllianceEffectsProps {
  eventId: string;
}

export function AllianceEffects({ eventId }: AllianceEffectsProps) {
  const [alliances, setAlliances] = useState<AllianceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetch(`/api/serate/${eventId}/alliance-effect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAlliances(data.alliances || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  async function shareHint(puzzleId?: string) {
    setActionMsg('');
    try {
      const res = await fetch(`/api/serate/${eventId}/alliance-effect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share_hint', puzzleId }),
      });
      const data = await res.json();
      setActionMsg(data.message || data.error || 'Fatto');
    } catch {
      setActionMsg('Errore di connessione');
    }
  }

  if (loading) return null;
  if (alliances.length === 0) return null;

  const effectIcons: Record<string, IconName> = {
    NONE: 'Handshake',
    HINT_SHARING: 'Lightbulb',
    POINT_BONUS: 'ArrowUp',
    POINT_PENALTY: 'AlertTriangle',
    COMMON_GOAL: 'Target',
  };

  const effectLabels: Record<string, string> = {
    NONE: 'Alleanza base',
    HINT_SHARING: 'Condivisione suggerimenti',
    POINT_BONUS: 'Bonus punti',
    POINT_PENALTY: 'Penalità condivisa',
    COMMON_GOAL: 'Obiettivo comune',
  };

  return (
    <div className="card-magic">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Swords" size="md" className="text-magic-gold" />
        <h3 className="text-magic-gold font-semibold text-sm">Alleanze Attive</h3>
      </div>

      <div className="space-y-3">
        {alliances.map((alliance) => (
          <div
            key={alliance.id}
            className="bg-white/5 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={effectIcons[alliance.effectType] || 'Handshake'} size="sm" />
                <div>
                  <p className="text-white text-sm font-medium">{alliance.ally}</p>
                  <p className="text-white/40 text-[10px]">
                    {effectLabels[alliance.effectType] || 'Alleanza'}
                  </p>
                </div>
              </div>
              {alliance.bonusPoints > 0 && (
                <span className="text-magic-gold text-xs font-bold">+{alliance.bonusPoints} pts</span>
              )}
            </div>

            {/* Hint sharing button */}
            {alliance.sharedHints && (
              <button
                onClick={() => shareHint()}
                className="w-full text-xs py-1.5 rounded-lg bg-magic-mystic/10 text-magic-mystic hover:bg-magic-mystic/20 transition-colors"
              >
                <Icon name="Lightbulb" size="xs" className="inline" /> Condividi i tuoi suggerimenti
              </button>
            )}

            {/* Common goal */}
            {alliance.commonGoal && (
              <div className={`rounded-lg p-2 text-xs ${
                alliance.commonGoalMet
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-magic-purple/10 text-magic-mystic'
              }`}>
                <p className="font-medium">
                  <Icon name="Target" size="xs" className="inline" /> {alliance.commonGoalMet ? <><Icon name="CheckCircle" size="xs" className="inline" /> Obiettivo raggiunto!</> : 'Obiettivo condiviso:'}
                </p>
                <p className="mt-0.5 text-white/60">{alliance.commonGoal}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {actionMsg && (
        <p className="text-xs text-magic-mystic mt-2 text-center">{actionMsg}</p>
      )}
    </div>
  );
}
