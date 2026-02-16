'use client';

import { useState, useEffect, useCallback } from 'react';

interface PlayerEntry {
  rank: number;
  userId: string;
  name: string;
  tableName: string | null;
  totalPoints: number;
  puzzlesSolved: number;
}

interface TableEntry {
  rank: number;
  tableId: string;
  tableName: string;
  totalPoints: number;
  puzzlesSolved: number;
}

interface LiveLeaderboardProps {
  eventId: string;
}

export function LiveLeaderboard({ eventId }: LiveLeaderboardProps) {
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [view, setView] = useState<'tables' | 'players'>('tables');
  const [collapsed, setCollapsed] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/serate/${eventId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        setTables(data.tables || []);
      }
    } catch {
      // silently fail
    }
  }, [eventId]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const entries = view === 'tables' ? tables : players;

  return (
    <div className="card-magic">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h3 className="text-magic-gold font-semibold text-sm">Classifica Live</h3>
        </div>
        <span className="text-white/30 text-xs">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <>
          {/* View toggle */}
          <div className="flex gap-1 mb-3 bg-white/5 rounded p-0.5">
            <button
              onClick={() => setView('tables')}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                view === 'tables'
                  ? 'bg-magic-gold text-magic-dark'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Tavoli
            </button>
            <button
              onClick={() => setView('players')}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                view === 'players'
                  ? 'bg-magic-gold text-magic-dark'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Giocatori
            </button>
          </div>

          {/* Leaderboard entries */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">
                Nessun punteggio ancora.
              </p>
            ) : (
              entries.map((entry, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                const name = view === 'tables'
                  ? (entry as TableEntry).tableName
                  : (entry as PlayerEntry).name;
                const key = view === 'tables'
                  ? (entry as TableEntry).tableId
                  : (entry as PlayerEntry).userId;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between py-1.5 px-2 rounded ${
                      i < 3 ? 'bg-magic-gold/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm w-6 text-center ${i >= 3 ? 'text-white/30 text-xs' : ''}`}>
                        {medal}
                      </span>
                      <div>
                        <p className="text-white text-xs font-medium">{name}</p>
                        <p className="text-white/30 text-[10px]">
                          {entry.puzzlesSolved} enigmi
                        </p>
                      </div>
                    </div>
                    <span className="text-magic-gold text-xs font-bold">{entry.totalPoints}</span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
