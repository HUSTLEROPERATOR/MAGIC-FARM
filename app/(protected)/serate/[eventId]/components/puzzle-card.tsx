'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Layers, Eye, Music, RefreshCw, Lightbulb, Check, Hourglass, Send } from '@/lib/ui/icons';
import type { LucideIcon } from '@/lib/ui/icons';

interface PuzzleData {
  id: string;
  title: string;
  prompt: string;
  order: number;
  hintsCount: number;
  hintPenalties: number[];
  puzzleType?: string;
  physicalHint?: string | null;
  environmentNote?: string | null;
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

export function PuzzleCard({ puzzle, submission, eventId, roundActive, isSolved }: PuzzleCardProps) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; message: string; pointsAwarded: number } | null>(null);
  const [revealedHints, setRevealedHints] = useState<Array<{ order: number; text: string; penaltyPoints: number }>>([]);
  const [expanded, setExpanded] = useState(!isSolved);
  const [currentHintsUsed, setCurrentHintsUsed] = useState(submission?.hintsUsed || 0);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || loading || isSolved) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/serate/${eventId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, answer: answer.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ isCorrect: false, message: data.error || 'Errore', pointsAwarded: 0 });
        return;
      }

      setResult(data);
      if (data.isCorrect) {
        setAnswer('');
        router.refresh();
      }
    } catch {
      setResult({ isCorrect: false, message: 'Errore di connessione', pointsAwarded: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function handleHint() {
    const nextHintOrder = currentHintsUsed + 1;
    if (nextHintOrder > puzzle.hintsCount || hintLoading) return;

    setHintLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: puzzle.id, hintOrder: nextHintOrder }),
      });

      const data = await res.json();
      if (res.ok && data.hint) {
        setRevealedHints(prev => [...prev, data.hint]);
        setCurrentHintsUsed(nextHintOrder);
      }
    } catch {
      // Ignore
    } finally {
      setHintLoading(false);
    }
  }

  const puzzleTypeIcons: Record<string, { icon: LucideIcon; label: string; color: string }> = {
    DIGITAL: { icon: Monitor, label: 'Digitale', color: 'text-blue-400' },
    PHYSICAL: { icon: Layers, label: 'Oggetto Fisico', color: 'text-amber-400' },
    OBSERVATION: { icon: Eye, label: 'Osservazione', color: 'text-emerald-400' },
    LISTENING: { icon: Music, label: 'Ascolto', color: 'text-purple-400' },
    HYBRID: { icon: RefreshCw, label: 'Ibrido', color: 'text-pink-400' },
  };

  const pType = puzzle.puzzleType ? puzzleTypeIcons[puzzle.puzzleType] : null;

  return (
    <div className={`card-magic ${isSolved ? 'border-green-500/30 bg-green-500/5' : ''}`}>
      {/* Puzzle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isSolved ? 'bg-green-500/20 text-green-400' : 'bg-magic-purple/20 text-magic-mystic'
          }`}>
            {isSolved ? '✓' : puzzle.order + 1}
          </span>
          <h3 className={`font-semibold ${isSolved ? 'text-green-400' : 'text-white'}`}>
            {puzzle.title}
          </h3>
          {pType && (() => {
            const PTypeIcon = pType.icon;
            return (
              <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/5 ${pType.color} inline-flex items-center gap-1`}>
                <PTypeIcon className="w-3 h-3" /> {pType.label}
              </span>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          {isSolved && submission && (
            <span className="text-magic-gold text-sm font-bold">+{submission.pointsAwarded} pts</span>
          )}
          <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Prompt */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{puzzle.prompt}</p>
          </div>

          {/* Physical object hint (Estensione 2) */}
          {puzzle.physicalHint && (
            <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 flex items-start gap-2">
              <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-400 font-semibold mb-0.5">Oggetto Fisico Richiesto</p>
                <p className="text-white/70 text-sm">{puzzle.physicalHint}</p>
              </div>
            </div>
          )}

          {/* Observation note (Estensione 3) */}
          {puzzle.environmentNote && (
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-start gap-2">
              <Eye className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-emerald-400 font-semibold mb-0.5">Nota di Osservazione</p>
                <p className="text-white/70 text-sm">{puzzle.environmentNote}</p>
              </div>
            </div>
          )}

          {/* Revealed hints */}
          {revealedHints.length > 0 && (
            <div className="space-y-2">
              {revealedHints.map((hint) => (
                <div key={hint.order} className="bg-magic-mystic/10 rounded-lg p-3 border border-magic-mystic/20">
                  <p className="text-xs text-magic-mystic mb-1"><Lightbulb className="w-3.5 h-3.5 inline" /> Suggerimento {hint.order} (-{hint.penaltyPoints} pts)</p>
                  <p className="text-white/70 text-sm">{hint.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Answer form or solved state */}
          {isSolved ? (
            <div className="bg-green-500/10 rounded-xl p-4 text-center">
              <p className="text-green-400 font-semibold"><Check className="w-4 h-4 inline" /> Enigma risolto!</p>
              <p className="text-white/50 text-sm mt-1">
                {submission!.attemptsCount} tentativi · {submission!.hintsUsed} suggerimenti · +{submission!.pointsAwarded} punti
              </p>
            </div>
          ) : roundActive ? (
            <div className="space-y-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Scrivi la tua risposta..."
                  className="input-magic flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !answer.trim()}
                  className="btn-magic text-sm disabled:opacity-50"
                >
                  <span>{loading ? <Hourglass className="w-4 h-4" /> : <Send className="w-4 h-4" />}</span>
                </button>
              </form>

              {/* Hint button */}
              {currentHintsUsed < puzzle.hintsCount && (
                <button
                  onClick={handleHint}
                  disabled={hintLoading}
                  className="text-xs text-magic-mystic/60 hover:text-magic-mystic transition-colors flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> {hintLoading ? 'Caricamento...' : `Chiedi suggerimento ${currentHintsUsed + 1}/${puzzle.hintsCount}`}
                  <span className="text-white/30">(-{puzzle.hintPenalties[currentHintsUsed] || 10} pts)</span>
                </button>
              )}

              {/* Result feedback */}
              {result && (
                <div className={`rounded-lg p-3 text-sm text-center ${
                  result.isCorrect
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {result.message}
                </div>
              )}

              {/* Attempts info */}
              {submission && !submission.isCorrect && (
                <p className="text-white/30 text-xs">
                  Tentativi: {submission.attemptsCount} · Suggerimenti: {submission.hintsUsed}
                </p>
              )}
            </div>
          ) : (
            <p className="text-white/30 text-sm italic text-center">
              Round non attivo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
