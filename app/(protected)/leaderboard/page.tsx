'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Medal, Handshake, ArrowLeft } from '@/lib/ui/icons';

// ─── Types ───────────────────────────────────────────────────────

/** Legacy per-event table ranking entry */
interface TableLeaderboardEntry {
  rank: number;
  tableId: string;
  tableName: string;
  totalPoints: number;
  puzzlesSolved: number;
  members: { id: string; alias: string | null; firstName: string | null }[];
}

/** Individual scoped ranking entry (local / global) */
interface UserLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  totalSolved: number;
  hostSharingEnabled?: boolean;
}

type Scope = 'event' | 'local' | 'global';

// ─── Page ────────────────────────────────────────────────────────

/**
 * Leaderboard page with three views:
 * 1) "Serata"  — legacy per-event table ranking (default when eventId present)
 * 2) "Locale"  — per-organization individual ranking
 * 3) "Globale" — cross-organization individual ranking
 *
 * Future: add a "Stagionale" tab here for seasonal leaderboards.
 */
export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  // Active event & organization auto-detection
  const [activeEventId, setActiveEventId] = useState<string | null>(eventId);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Tab state — default to event view if eventId is present, otherwise global
  const [scope, setScope] = useState<Scope>(eventId ? 'event' : 'global');

  // Data
  const [tableEntries, setTableEntries] = useState<TableLeaderboardEntry[]>([]);
  const [userEntries, setUserEntries] = useState<UserLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch active event (once) to get organizationId ────────────
  useEffect(() => {
    fetch('/api/events/active')
      .then((r) => r.json())
      .then((data) => {
        if (data.event) {
          if (!activeEventId) setActiveEventId(data.event.id);
          if (data.event.organizationId) setOrganizationId(data.event.organizationId);
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch leaderboard data when scope changes ──────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setTableEntries([]);
    setUserEntries([]);

    try {
      let url: string;
      if (scope === 'event') {
        if (!activeEventId) {
          setError('Nessuna serata attiva.');
          setLoading(false);
          return;
        }
        url = `/api/leaderboard?eventId=${activeEventId}`;
      } else if (scope === 'local') {
        if (!organizationId) {
          setError('Nessuna organizzazione collegata alla serata attiva.');
          setLoading(false);
          return;
        }
        url = `/api/leaderboard?scope=local&organizationId=${organizationId}`;
      } else {
        url = `/api/leaderboard?scope=global`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore.');
        return;
      }

      if (scope === 'event') {
        setTableEntries(data.leaderboard);
      } else {
        setUserEntries(data.leaderboard);
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  }, [scope, activeEventId, organizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-10 h-10 text-magic-gold" />
          <div>
            <h1 className="font-cinzel text-3xl text-magic-gold">Classifica</h1>
            <p className="text-white/40 text-sm">
              {scope === 'event'
                ? 'Punteggio per tavolo'
                : scope === 'local'
                  ? 'Classifica locale (organizzazione)'
                  : 'Classifica globale'}
            </p>
          </div>
        </div>

        {/* Scope tabs */}
        <div className="flex gap-1 mb-6 bg-magic-purple/10 rounded-lg p-1">
          {([
            ['event', 'Serata'],
            ['local', 'Locale'],
            ['global', 'Globale'],
          ] as [Scope, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                scope === s
                  ? 'bg-magic-gold text-magic-dark'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-magic-mystic animate-pulse">Caricamento classifica...</p>
          </div>
        ) : error ? (
          <div className="card-magic text-center py-10">
            <p className="text-white/60">{error}</p>
          </div>
        ) : scope === 'event' ? (
          <EventLeaderboard entries={tableEntries} />
        ) : (
          <UserLeaderboard entries={userEntries} />
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/game" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna al Gioco
          </Link>
          <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function EventLeaderboard({ entries }: { entries: TableLeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-magic text-center py-10">
        <Medal className="w-12 h-12 text-magic-gold mx-auto mb-4" />
        <p className="text-white/60">Nessun punteggio ancora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const medal =
          entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
        return (
          <div key={entry.tableId} className={`card-magic ${entry.rank <= 3 ? 'border-magic-gold/30' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-2xl w-10 text-center ${entry.rank > 3 ? 'text-white/40 text-sm' : ''}`}>
                  {medal}
                </span>
                <div>
                  <p className="text-white font-semibold">{entry.tableName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.members.map((m) => (
                      <span
                        key={m.id}
                        className="text-[10px] px-1.5 py-0.5 bg-magic-purple/10 text-magic-mystic/60 rounded"
                      >
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
  );
}

function UserLeaderboard({ entries }: { entries: UserLeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-magic text-center py-10">
        <Medal className="w-12 h-12 text-magic-gold mx-auto mb-4" />
        <p className="text-white/60">Nessun punteggio ancora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const medal =
          entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
        return (
          <div key={entry.userId} className={`card-magic ${entry.rank <= 3 ? 'border-magic-gold/30' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-2xl w-10 text-center ${entry.rank > 3 ? 'text-white/40 text-sm' : ''}`}>
                  {medal}
                </span>
                <div>
                  <p className="text-white font-semibold">
                    {entry.username}
                    {entry.hostSharingEnabled && (
                      <span title="Disponibile per inviti dall'host"><Handshake className="w-3.5 h-3.5 inline-block ml-1.5" /></span>
                    )}
                  </p>
                  <p className="text-white/30 text-xs mt-1">{entry.totalSolved} enigmi risolti</p>
                </div>
              </div>
              <span className="text-magic-gold font-bold text-xl">{entry.totalPoints}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
