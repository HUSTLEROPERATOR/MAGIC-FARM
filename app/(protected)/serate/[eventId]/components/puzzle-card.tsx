'use client';

import { useState } from 'react';

interface PuzzleData {
  id: string;
  title: string;
  prompt: string;
  order: number;
  hintsCount: number;
  hintPenalties: number[];
  puzzleType: string;
  physicalHint: string | null;
  environmentNote: string | null;
}

interface SubmissionData {
  isCorrect: boolean;
  attemptsCount: number;
  hintsUsed: number;
  pointsAwarded: number;
}

interface PuzzleCardProps {
  puzzle: PuzzleData;
  submission: SubmissionData | null;
  eventId: string;
  roundActive: boolean;
  isSolved: boolean;
}

const puzzleTypeLabels: Record<string, { icon: string; label: string }> = {
  DIGITAL: { icon: '💻', label: 'Digitale' },
  PHYSICAL: { icon: '🎯', label: 'Fisico' },
  OBSERVATION: { icon: '👁️', label: 'Osservazione' },
  LISTENING: { icon: '👂', label: 'Ascolto' },
  HYBRID: { icon: '🔀', label: 'Ibrido' },
};

export function PuzzleCard({ puzzle, submission, eventId, roundActive, isSolved }: PuzzleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [revealedHints, setRevealedHints] = useState<{ order: number; text: string; penalty: number }[]>([]);
  const [hintLoading, setHintLoading] = useState(false);

  const typeInfo = puzzleTypeLabels[puzzle.puzzleType] || puzzleTypeLabels.DIGITAL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || isSolved || !roundActive) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/serate/${eventId}/submit`, {
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
        message: data.message,
      });

      if (data.isCorrect) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setFeedback({ isCorrect: false, message: 'Errore di rete.' });
    } finally {
      setLoading(false);
    }
  }

  async function requestHint(hintOrder: number) {
    setHintLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, hintOrder }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setRevealedHints((prev) => [...prev, {
          order: data.hint.order,
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
    <div
      className={`card-magic transition-all ${
        isSolved
          ? 'border-green-500/30 opacity-80'
          : roundActive
            ? 'hover:border-magic-gold/40'
            : 'opacity-60'
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{typeInfo.icon}</span>
              <h3 className="text-magic-gold font-semibold">{puzzle.title}</h3>
              {isSolved && <span className="text-green-400 text-xs">&#10003; Risolto</span>}
            </div>
            <p className="text-white/50 text-sm line-clamp-2">{puzzle.prompt}</p>
          </div>
          <div className="ml-3 text-right">
            {isSolved && submission ? (
              <span className="text-green-400 text-sm font-semibold">+{submission.pointsAwarded}</span>
            ) : (
              <span className="text-white/30 text-xs">{puzzle.hintsCount} suggerimenti</span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          {/* Puzzle type info */}
          {puzzle.puzzleType !== 'DIGITAL' && (
            <div className="mb-4 bg-magic-purple/10 rounded-lg p-3">
              <span className="text-xs text-magic-mystic">
                {typeInfo.icon} {typeInfo.label}
              </span>
              {puzzle.physicalHint && (
                <p className="text-white/60 text-sm mt-1">🎯 {puzzle.physicalHint}</p>
              )}
              {puzzle.environmentNote && (
                <p className="text-white/60 text-sm mt-1">👁️ {puzzle.environmentNote}</p>
              )}
            </div>
          )}

          {/* Full prompt */}
          <p className="text-white/70 text-sm mb-4">{puzzle.prompt}</p>

          {/* Hints */}
          {puzzle.hintsCount > 0 && !isSolved && roundActive && (
            <div className="mb-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Suggerimenti</p>
              <div className="space-y-2">
                {Array.from({ length: puzzle.hintsCount }, (_, i) => {
                  const hintOrder = i + 1;
                  const revealed = revealedHints.find((h) => h.order === hintOrder);
                  const penalty = puzzle.hintPenalties[i] || 0;
                  return (
                    <div key={hintOrder}>
                      {revealed ? (
                        <div className="bg-magic-purple/10 p-3 rounded text-sm">
                          <p className="text-magic-mystic">{revealed.text}</p>
                          <p className="text-red-400/60 text-xs mt-1">-{revealed.penalty} punti</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => requestHint(hintOrder)}
                          disabled={hintLoading || (hintOrder > 1 && !revealedHints.find((h) => h.order === hintOrder - 1))}
                          className="text-sm text-magic-mystic hover:text-magic-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Rivela suggerimento #{hintOrder} (-{penalty} pts)
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answer form */}
          {isSolved ? (
            <div className="text-center py-2">
              <p className="text-green-400 font-semibold">Enigma Risolto!</p>
              {submission && (
                <p className="text-white/40 text-xs mt-1">
                  +{submission.pointsAwarded} punti &middot; {submission.attemptsCount} tentativi &middot; {submission.hintsUsed} suggerimenti usati
                </p>
              )}
            </div>
          ) : roundActive ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="La tua risposta..."
                className="input-magic w-full"
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
          ) : (
            <p className="text-white/30 text-sm text-center italic">
              Il round non è attivo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
