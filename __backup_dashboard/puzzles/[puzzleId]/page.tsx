'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PuzzleData {
  id: string;
  title: string;
  prompt: string | null;
  order: number;
  hintCount: number;
  roundTitle: string;
  roundStatus: string;
  eventName: string;
  eventId: string;
  eventStatus: string;
  userStatus: {
    solved: boolean;
    points: number;
    attempts: number;
  } | null;
}

interface SubmissionResult {
  success: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  attemptsCount: number;
  message: string;
}

export default function PuzzlePage({ params }: { params: { puzzleId: string } }) {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPuzzle = useCallback(async () => {
    try {
      const res = await fetch(`/api/puzzles/${params.puzzleId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Enigma non trovato.');
        } else {
          const data = await res.json();
          setError(data.error || 'Errore nel caricamento.');
        }
        return;
      }
      const data = await res.json();
      setPuzzle(data.puzzle);
    } catch {
      setError('Impossibile caricare i dati.');
    } finally {
      setLoading(false);
    }
  }, [params.puzzleId]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: params.puzzleId,
          answer: answer.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setError('Troppi tentativi. Attendi qualche secondo.');
        return;
      }

      if (!res.ok && !data.isCorrect) {
        setError(data.error || 'Si è verificato un errore.');
        return;
      }

      setResult(data);

      if (data.isCorrect) {
        // Refresh puzzle data to update status
        await fetchPuzzle();
        setAnswer('');
      }
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
        <div className="text-center">
          <div className="text-6xl mb-4 animate-float">🔮</div>
          <p className="text-white/50">Caricamento enigma...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error && !puzzle) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-white/70 mb-6">{error}</p>
          <Link href="/dashboard/events" className="btn-magic">
            Torna agli Eventi
          </Link>
        </div>
      </main>
    );
  }

  if (!puzzle) return null;

  const isSolved = puzzle.userStatus?.solved || result?.isCorrect;
  const isPlayable = puzzle.roundStatus === 'ACTIVE' && puzzle.eventStatus === 'LIVE' && !isSolved;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
      <div className="fixed inset-0 bg-stars opacity-30 -z-10" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-magic-purple/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-magic-gold/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-magic-dark/80 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/dashboard/events/${puzzle.eventId}`}
            className="flex items-center gap-2 text-white/50 hover:text-magic-gold transition-colors group"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span className="text-sm">{puzzle.eventName}</span>
          </Link>
          {isSolved && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
              ✓ Risolto
            </span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Puzzle Header */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white/30 text-sm">{puzzle.roundTitle} · Enigma {puzzle.order + 1}</span>
          </div>
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold glow-text mb-2">
            {puzzle.title}
          </h1>
        </section>

        {/* Puzzle Prompt */}
        {puzzle.prompt ? (
          <section className="card-magic mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">📜</span>
              <h2 className="font-cinzel text-lg font-bold text-white">L&apos;Enigma</h2>
            </div>
            <div className="text-white/80 leading-relaxed whitespace-pre-wrap text-lg">
              {puzzle.prompt}
            </div>
          </section>
        ) : (
          <div className="card-magic mb-8 text-center py-8">
            <div className="text-5xl mb-4 opacity-50">🔒</div>
            <p className="text-white/50">
              Il testo dell&apos;enigma non è ancora disponibile. 
              Il round potrebbe non essere ancora attivo.
            </p>
          </div>
        )}

        {/* Solved Result */}
        {isSolved && (
          <div className="card-magic mb-8 border-green-500/20 bg-green-500/5">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-cinzel text-xl font-bold text-green-300 mb-2">
                Enigma Risolto!
              </h3>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div>
                  <span className="text-white/50">Punti: </span>
                  <span className="text-magic-gold font-bold text-lg">
                    {result?.pointsAwarded ?? puzzle.userStatus?.points ?? 0}
                  </span>
                </div>
                <div>
                  <span className="text-white/50">Tentativi: </span>
                  <span className="text-white font-bold">
                    {result?.attemptsCount ?? puzzle.userStatus?.attempts ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wrong Answer Feedback */}
        {result && !result.isCorrect && (
          <div className="card-magic mb-6 border-red-500/20 bg-red-500/5">
            <div className="flex items-center gap-3 p-2">
              <span className="text-2xl">❌</span>
              <div>
                <p className="text-red-300 font-medium">{result.message}</p>
                <p className="text-white/40 text-sm mt-1">
                  Tentativi usati: {result.attemptsCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Answer Form */}
        {isPlayable && puzzle.prompt && (
          <section className="card-magic">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">✍️</span>
              <h2 className="font-cinzel text-lg font-bold text-white">La tua Risposta</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Scrivi la tua risposta..."
                  className="input-magic"
                  disabled={isSubmitting}
                  autoFocus
                  maxLength={500}
                />
                <p className="text-white/30 text-xs mt-2">
                  La risposta non è case-sensitive. Assicurati di scriverla correttamente!
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !answer.trim()}
                className="btn-magic w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Invia Risposta</span>
                    </>
                  )}
                </span>
              </button>
            </form>
          </section>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push(`/dashboard/events/${puzzle.eventId}`)}
            className="text-white/40 text-sm hover:text-magic-gold transition-colors"
          >
            ← Torna ai round dell&apos;evento
          </button>
        </div>
      </div>
    </main>
  );
}
