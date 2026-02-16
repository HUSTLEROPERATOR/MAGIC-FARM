'use client';

import { useState, useEffect } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

interface PuzzleMetric {
  puzzleId: string;
  title: string;
  puzzleType: string;
  totalSubmissions: number;
  correctCount: number;
  successRate: number;
}

interface MetricsData {
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

export function EventMetricsPanel({ eventId, eventStatus }: EventMetricsPanelProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (eventStatus !== 'ENDED') {
      setLoading(false);
      return;
    }

    fetch(`/api/serate/${eventId}/metrics`)
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data.metrics || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, eventStatus]);

  if (eventStatus !== 'ENDED') return null;
  if (loading) return null;
  if (!metrics) return null;

  function formatTime(ms: number): string {
    if (ms === 0) return '—';
    const secs = Math.round(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs}s`;
  }

  const puzzleTypeIcons: Record<string, IconName> = {
    DIGITAL: 'Monitor',
    PHYSICAL: 'Layers',
    OBSERVATION: 'Eye',
    LISTENING: 'Music',
    HYBRID: 'RefreshCw',
  };

  return (
    <div className="card-magic">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon name="Stats" size="md" className="text-magic-gold" />
          <h3 className="text-magic-gold font-semibold text-sm">Statistiche della Serata</h3>
        </div>
        <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-magic-gold">{metrics.totalParticipants}</p>
              <p className="text-white/40 text-xs">Partecipanti</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{metrics.successRate}%</p>
              <p className="text-white/40 text-xs">Tasso successo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-magic-mystic">{formatTime(metrics.avgSolveTimeMs)}</p>
              <p className="text-white/40 text-xs">Tempo medio</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{metrics.totalAlliances}</p>
              <p className="text-white/40 text-xs">Alleanze</p>
            </div>
          </div>

          {/* Detailed stats */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50">Risposte totali</span>
              <span className="text-white">{metrics.totalSubmissions}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50">Risposte corrette</span>
              <span className="text-green-400">{metrics.totalCorrect}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50">Suggerimenti usati</span>
              <span className="text-white">{metrics.totalHintsUsed}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50">Tempo mediano</span>
              <span className="text-white">{formatTime(metrics.medianSolveTimeMs)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-white/50">Messaggi in board</span>
              <span className="text-white">{metrics.totalMessages}</span>
            </div>
            {metrics.totalSpectators > 0 && (
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Spettatori</span>
                <span className="text-magic-mystic">{metrics.totalSpectators}</span>
              </div>
            )}
          </div>

          {/* Per-puzzle breakdown */}
          {metrics.puzzleMetrics && metrics.puzzleMetrics.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                Dettaglio Enigmi
              </h4>
              {metrics.puzzleMetrics.map((p) => (
                <div key={p.puzzleId} className="bg-white/5 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name={puzzleTypeIcons[p.puzzleType] || 'Puzzle'} size="sm" />
                    <div>
                      <p className="text-white text-xs font-medium">{p.title}</p>
                      <p className="text-white/30 text-[10px]">
                        {p.totalSubmissions} tentativi · {p.correctCount} corrette
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${
                    p.successRate >= 70 ? 'text-green-400' :
                    p.successRate >= 40 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {p.successRate}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
