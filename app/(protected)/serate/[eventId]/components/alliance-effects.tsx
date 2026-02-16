'use client';

import { useState, useEffect, useCallback } from 'react';

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

const effectLabels: Record<string, { icon: string; label: string }> = {
  NONE: { icon: '🤝', label: 'Alleanza base' },
  HINT_SHARING: { icon: '💡', label: 'Condivisione suggerimenti' },
  POINT_BONUS: { icon: '⭐', label: 'Bonus punti' },
  POINT_PENALTY: { icon: '⚠️', label: 'Penalità condivisa' },
  COMMON_GOAL: { icon: '🎯', label: 'Obiettivo comune' },
};

export function AllianceEffects({ eventId }: AllianceEffectsProps) {
  const [alliances, setAlliances] = useState<AllianceInfo[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const fetchAlliances = useCallback(async () => {
    try {
      const res = await fetch(`/api/serate/${eventId}/alliance-effect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlliances(data.alliances || []);
      }
    } catch {
      // silently fail
    }
  }, [eventId]);

  useEffect(() => {
    fetchAlliances();
  }, [fetchAlliances]);

  if (alliances.length === 0) return null;

  return (
    <div className="card-magic">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤝</span>
          <h3 className="text-magic-gold font-semibold text-sm">Alleanze</h3>
          <span className="text-white/30 text-xs">{alliances.length}</span>
        </div>
        <span className="text-white/30 text-xs">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-3">
          {alliances.map((alliance) => {
            const effect = effectLabels[alliance.effectType] || effectLabels.NONE;
            return (
              <div key={alliance.id} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-medium">{alliance.ally}</p>
                  <span className="text-xs text-magic-mystic">
                    {effect.icon} {effect.label}
                  </span>
                </div>
                {alliance.sharedHints && (
                  <p className="text-white/40 text-xs">💡 Suggerimenti condivisi attivi</p>
                )}
                {alliance.bonusPoints > 0 && (
                  <p className="text-magic-gold text-xs">⭐ +{alliance.bonusPoints} punti bonus</p>
                )}
                {alliance.commonGoal && (
                  <div className="mt-2">
                    <p className="text-white/50 text-xs">
                      🎯 {alliance.commonGoal}
                    </p>
                    <span className={`text-xs mt-1 inline-block ${
                      alliance.commonGoalMet ? 'text-green-400' : 'text-white/30'
                    }`}>
                      {alliance.commonGoalMet ? '&#10003; Completato' : 'In corso...'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
