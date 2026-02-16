'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Theater, Hourglass } from '@/lib/ui/icons';

interface Hint {
  id: string;
  order: number;
  penaltyPoints: number;
}

interface Puzzle {
  id: string;
  title: string;
  prompt: string;
  order: number;
  hintCount: number;
  hints: Hint[];
  submission: {
    isCorrect: boolean;
    points: number;
    attempts: number;
    hintsUsed: number;
  } | null;
}

interface TableState {
  event: { id: string; name: string; currentRoundId: string | null; hostName: string | null };
  table: {
    id: string;
    name: string;
    score: number;
    members: { id: string; alias: string | null; firstName: string | null }[];
  };
  currentRound: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    puzzles: Puzzle[];
  } | null;
}

export default function GamePage() {
  const router = useRouter();
  const [tableState, setTableState] = useState<TableState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);

  const fetchTableState = useCallback(async () => {
    try {
      const res = await fetch('/api/table/me');
      const data = await res.json();
      if (data.table) {
        setTableState(data);
      } else {
        // Not joined any table — redirect to dashboard to join
        setError(data.message || 'Non sei in nessun tavolo.');
      }
    } catch {
      setError('Errore di caricamento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTableState();
  }, [fetchTableState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-magic-dark flex items-center justify-center">
        <p className="text-magic-mystic animate-pulse text-lg">Caricamento...</p>
      </div>
    );
  }

  if (error || !tableState) {
    return (
      <div className="min-h-screen bg-magic-dark flex items-center justify-center p-6">
        <div className="card-magic text-center max-w-md">
          <Theater className="w-12 h-12 text-magic-mystic mx-auto mb-4" />
          <p className="text-white/60 mb-4">{error || 'Nessuna serata attiva.'}</p>
          <Link href="/dashboard" className="btn-magic inline-block">
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { event, table, currentRound } = tableState;

  return (
    <div className="min-h-screen bg-magic-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-cinzel text-2xl md:text-3xl text-magic-gold">{event.name}</h1>
            <p className="text-magic-mystic text-sm">{table.name}</p>
            {event.hostName && (
              <p className="text-white/40 text-xs mt-0.5">Host: {event.hostName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-magic-gold text-2xl font-bold">{table.score}</p>
            <p className="text-white/40 text-xs">Punti Tavolo</p>
          </div>
        </div>

        {/* Team members */}
        <div className="card-magic mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-sm mr-2">Squadra:</span>
            {table.members.map((m) => (
              <span
                key={m.id}
                className="px-2 py-1 bg-magic-purple/20 rounded text-xs text-magic-mystic"
              >
                {m.alias || m.firstName || 'Anonimo'}
              </span>
            ))}
          </div>
        </div>

        {/* Current Round */}
        {currentRound ? (
          <>
            <div className="mb-6">
              <h2 className="text-white font-semibold text-lg mb-1">{currentRound.title}</h2>
              {currentRound.description && (
                <p className="text-white/40 text-sm">{currentRound.description}</p>
              )}
            </div>

            {/* Puzzle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {currentRound.puzzles.map((puzzle) => (
                <PuzzleCard
                  key={puzzle.id}
                  puzzle={puzzle}
                  onSelect={() => setSelectedPuzzle(puzzle)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="card-magic text-center py-10">
            <Hourglass className="w-12 h-12 text-magic-mystic mx-auto mb-4" />
            <p className="text-white/60">Nessun round attivo al momento.</p>
            <p className="text-white/40 text-sm mt-1">Attendi che l&apos;organizzatore attivi un round.</p>
          </div>
        )}

        {/* Leaderboard link */}
        <div className="flex gap-4">
          <Link
            href={`/leaderboard?eventId=${event.id}`}
            className="text-magic-mystic hover:text-magic-gold transition-colors text-sm"
          >
            Classifica Serata →
          </Link>
          <Link
            href="/dashboard"
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Puzzle Detail Modal */}
      {selectedPuzzle && (
        <PuzzleModal
          puzzle={selectedPuzzle}
          onClose={() => setSelectedPuzzle(null)}
          onSubmitted={() => {
            setSelectedPuzzle(null);
            fetchTableState();
          }}
        />
      )}
    </div>
  );
}

function PuzzleCard({ puzzle, onSelect }: { puzzle: Puzzle; onSelect: () => void }) {
  const solved = puzzle.submission?.isCorrect;

  return (
    <button
      onClick={onSelect}
      className={`card-magic text-left w-full transition-all ${
        solved
          ? 'border-green-500/30 opacity-80'
          : 'hover:border-magic-gold/40 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-magic-gold font-semibold">{puzzle.title}</h3>
          <p className="text-white/50 text-sm mt-1 line-clamp-2">{puzzle.prompt}</p>
        </div>
        {solved ? (
          <span className="text-green-400 text-sm ml-2 whitespace-nowrap">
            +{puzzle.submission!.points} pts
          </span>
        ) : (
          <span className="text-white/30 text-xs ml-2">
            {puzzle.hintCount} suggerimenti
          </span>
        )}
      </div>
      {solved && (
        <p className="text-green-400/60 text-xs mt-2">Risolto</p>
      )}
    </button>
  );
}

function PuzzleModal({
  puzzle,
  onClose,
  onSubmitted,
}: {
  puzzle: Puzzle;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [revealedHints, setRevealedHints] = useState<{ id: string; text: string; penalty: number }[]>([]);
  const [hintLoading, setHintLoading] = useState(false);
  const solved = puzzle.submission?.isCorrect;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || solved) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, answer }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ isCorrect: false, message: data.error || 'Errore.' });
        return;
      }

      setFeedback({
        isCorrect: data.isCorrect,
        message: data.message || (data.isCorrect ? 'Corretto!' : 'Errato.'),
      });

      if (data.isCorrect) {
        setTimeout(() => onSubmitted(), 1500);
      }
    } catch {
      setFeedback({ isCorrect: false, message: 'Errore di rete.' });
    } finally {
      setLoading(false);
    }
  }

  async function requestHint(hintId: string) {
    setHintLoading(true);
    try {
      const res = await fetch('/api/hints/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, hintId }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setRevealedHints((prev) => [...prev, {
          id: data.hint.id,
          text: data.hint.text,
          penalty: data.hint.penaltyPoints,
        }]);
      }
    } catch {
      // silently fail
    } finally {
      setHintLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="card-magic max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-magic-gold font-cinzel text-xl">{puzzle.title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">
            &times;
          </button>
        </div>

        <p className="text-white/80 mb-6">{puzzle.prompt}</p>

        {/* Hints */}
        {puzzle.hints.length > 0 && !solved && (
          <div className="mb-6">
            <p className="text-white/40 text-sm mb-2">Suggerimenti:</p>
            <div className="space-y-2">
              {puzzle.hints.map((hint) => {
                const revealed = revealedHints.find((h) => h.id === hint.id);
                return (
                  <div key={hint.id}>
                    {revealed ? (
                      <div className="bg-magic-purple/10 p-3 rounded text-sm">
                        <p className="text-magic-mystic">{revealed.text}</p>
                        <p className="text-red-400/60 text-xs mt-1">-{revealed.penalty} punti</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => requestHint(hint.id)}
                        disabled={hintLoading}
                        className="text-sm text-magic-mystic hover:text-magic-gold transition-colors disabled:opacity-50"
                      >
                        Rivela suggerimento #{hint.order + 1} (-{hint.penaltyPoints} pts)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Already solved */}
        {solved ? (
          <div className="text-center py-4">
            <p className="text-green-400 text-lg font-semibold">Enigma Risolto!</p>
            <p className="text-white/40 text-sm mt-1">+{puzzle.submission!.points} punti</p>
          </div>
        ) : (
          /* Answer form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="La tua risposta..."
              className="input-magic w-full"
              autoFocus
            />

            {feedback && (
              <p className={`text-sm text-center ${feedback.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {feedback.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !answer.trim()}
              className="btn-magic w-full disabled:opacity-40"
            >
              {loading ? 'Invio...' : 'Invia Risposta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
