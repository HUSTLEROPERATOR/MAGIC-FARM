'use client';

import { useState, useEffect, useCallback } from 'react';

interface PuzzleMetric {
  puzzleId: string;
  title: string;
  puzzleType: string;
  totalSubmissions: number;
  correctCount: number;
  successRate: number;
}

interface Metrics {
  totalParticipants: number;
  totalSpectators: number;
  totalSubmissions: number;
  totalCorrect: number;
  successRate: number;
  avgSolveTimeMs: number;
  medianSolveTimeMs: number;
  totalHintsUsed: number;
  avgHintsPerPuzzle: number;
  totalAlliances: number;
  totalMessages: number;
  puzzleMetrics: PuzzleMetric[];
}

interface EventMetricsPanelProps {
  eventId: string;
  eventStatus: string;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '-';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function EventMetricsPanel({ eventId, eventStatus }: EventMetricsPanelProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/metrics`);
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (eventStatus !== 'ENDED') return null;
  if (loading && !metrics) {
    return (
      <div className="card-magic">
        <p className="text-white/40 text-sm text-center animate-pulse">Caricamento metriche...</p>
      </div>
    );
  }
  if (!metrics) return null;

  return (
    <div className="card-magic">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-magic-gold font-semibold text-sm">Statistiche Serata</h3>
        </div>
        <span className="text-white/30 text-xs">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-4">
          {/* Overview stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-magic-gold font-bold text-lg">{metrics.totalParticipants}</p>
              <p className="text-white/40 text-[10px]">Partecipanti</p>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-magic-mystic font-bold text-lg">{metrics.totalCorrect}</p>
              <p className="text-white/40 text-[10px]">Risposte corrette</p>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-white font-bold text-lg">{metrics.successRate}%</p>
              <p className="text-white/40 text-[10px]">Tasso successo</p>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <p className="text-white font-bold text-lg">{formatTime(metrics.medianSolveTimeMs)}</p>
              <p className="text-white/40 text-[10px]">Tempo mediano</p>
            </div>
          </div>

          {/* Detail stats */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-white/50">
              <span>Totale invii</span>
              <span className="text-white">{metrics.totalSubmissions}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Suggerimenti usati</span>
              <span className="text-white">{metrics.totalHintsUsed}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Alleanze formate</span>
              <span className="text-white">{metrics.totalAlliances}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Messaggi scambiati</span>
              <span className="text-white">{metrics.totalMessages}</span>
            </div>
            {metrics.totalSpectators > 0 && (
              <div className="flex justify-between text-white/50">
                <span>Spettatori</span>
                <span className="text-white">{metrics.totalSpectators}</span>
              </div>
            )}
          </div>

          {/* Per-puzzle breakdown */}
          {metrics.puzzleMetrics && metrics.puzzleMetrics.length > 0 && (
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Per enigma</p>
              <div className="space-y-1.5">
                {metrics.puzzleMetrics.map((pm) => (
                  <div key={pm.puzzleId} className="flex items-center justify-between text-xs">
                    <span className="text-white/60 truncate flex-1 mr-2">{pm.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30">{pm.correctCount}/{pm.totalSubmissions}</span>
                      <span className={`font-medium ${
                        pm.successRate >= 70 ? 'text-green-400' :
                        pm.successRate >= 40 ? 'text-magic-gold' :
                        'text-red-400'
                      }`}>
                        {pm.successRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
