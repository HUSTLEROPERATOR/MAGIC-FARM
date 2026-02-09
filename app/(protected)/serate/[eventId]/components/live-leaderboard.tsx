'use client';

import { useState, useEffect } from 'react';

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
  const [tab, setTab] = useState<'players' | 'tables'>('players');
  const [expanded, setExpanded] = useState(true);

  async function loadLeaderboard() {
    try {
      const res = await fetch(`/api/serate/${eventId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
        setTables(data.tables || []);
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [eventId]);

  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div className="card-magic">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h3 className="text-magic-gold font-semibold text-sm">Classifica Live</h3>
        </div>
        <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTab('players')}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                tab === 'players' ? 'bg-magic-purple/30 text-magic-mystic' : 'text-white/40 hover:text-white/60'
              }`}
            >
              👤 Giocatori
            </button>
            <button
              onClick={() => setTab('tables')}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                tab === 'tables' ? 'bg-magic-purple/30 text-magic-mystic' : 'text-white/40 hover:text-white/60'
              }`}
            >
              🪑 Tavoli
            </button>
          </div>

          {/* Content */}
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {tab === 'players' ? (
              players.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">Nessun punteggio ancora</p>
              ) : (
                players.slice(0, 10).map((p) => (
                  <div key={p.userId} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm w-6 text-center ${p.rank <= 3 ? '' : 'text-white/30 text-xs'}`}>
                        {medal(p.rank)}
                      </span>
                      <div>
                        <p className="text-white text-sm">{p.name}</p>
                        {p.tableName && <p className="text-white/30 text-[10px]">{p.tableName}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-magic-gold text-sm font-bold">{p.totalPoints}</p>
                      <p className="text-white/30 text-[10px]">{p.puzzlesSolved} risolti</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              tables.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4">Nessun punteggio ancora</p>
              ) : (
                tables.slice(0, 10).map((t) => (
                  <div key={t.tableId} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm w-6 text-center ${t.rank <= 3 ? '' : 'text-white/30 text-xs'}`}>
                        {medal(t.rank)}
                      </span>
                      <p className="text-white text-sm">{t.tableName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-magic-gold text-sm font-bold">{t.totalPoints}</p>
                      <p className="text-white/30 text-[10px]">{t.puzzlesSolved} risolti</p>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
