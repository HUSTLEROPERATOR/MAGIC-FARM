'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  tableId: string;
  tableName: string;
  totalPoints: number;
  puzzlesSolved: number;
  members: { id: string; alias: string | null; firstName: string | null }[];
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) {
      // Try to get active event
      fetch('/api/events/active')
        .then((r) => r.json())
        .then((data) => {
          if (data.event) {
            fetchLeaderboard(data.event.id);
          } else {
            setError('Nessuna serata attiva.');
            setLoading(false);
          }
        });
    } else {
      fetchLeaderboard(eventId);
    }
  }, [eventId]);

  async function fetchLeaderboard(eid: string) {
    try {
      const res = await fetch(`/api/leaderboard?eventId=${eid}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.leaderboard);
      } else {
        setError(data.error || 'Errore.');
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-magic-dark flex items-center justify-center">
        <p className="text-magic-mystic animate-pulse">Caricamento classifica...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">🏆</span>
          <div>
            <h1 className="font-cinzel text-3xl text-magic-gold">Classifica Serata</h1>
            <p className="text-white/40 text-sm">Punteggio per tavolo</p>
          </div>
        </div>

        {error ? (
          <div className="card-magic text-center py-10">
            <p className="text-white/60">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="card-magic text-center py-10">
            <p className="text-5xl mb-4">🏅</p>
            <p className="text-white/60">Nessun punteggio ancora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
              return (
                <div
                  key={entry.tableId}
                  className={`card-magic ${entry.rank <= 3 ? 'border-magic-gold/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl w-10 text-center ${entry.rank > 3 ? 'text-white/40 text-sm' : ''}`}>
                        {medal}
                      </span>
                      <div>
                        <p className="text-white font-semibold">{entry.tableName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.members.map((m) => (
                            <span key={m.id} className="text-[10px] px-1.5 py-0.5 bg-magic-purple/10 text-magic-mystic/60 rounded">
                              {m.alias || m.firstName || '?'}
                            </span>
                          ))}
                        </div>
                        <p className="text-white/30 text-xs mt-1">{entry.puzzlesSolved} enigmi risolti</p>
                      </div>
                    </div>
                    <span className="text-magic-gold font-bold text-xl">{entry.totalPoints}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link href="/game" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm">
            ← Torna al Gioco
          </Link>
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
