import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { eventId: string };
}

async function getEventDetail(eventId: string, userId: string) {
  const event = await prisma.eventNight.findUnique({
    where: { id: eventId },
    include: {
      rounds: {
        orderBy: { createdAt: 'asc' },
        include: {
          puzzles: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              prompt: true,
              order: true,
              scoringJson: true,
              _count: {
                select: {
                  submissions: true,
                  hints: true,
                },
              },
            },
          },
        },
      },
      tables: {
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: { memberships: true },
          },
        },
      },
      _count: {
        select: {
          rounds: true,
          tables: true,
        },
      },
    },
  });

  if (!event) return null;

  // Get user's submissions for this event
  const userSubmissions = await prisma.submission.findMany({
    where: {
      userId,
      puzzle: {
        round: { eventNightId: eventId },
      },
    },
    select: {
      puzzleId: true,
      isCorrect: true,
      pointsAwarded: true,
      attemptsCount: true,
    },
  });

  const solvedPuzzles = new Map<string, { points: number; attempts: number }>();
  for (const sub of userSubmissions) {
    if (sub.isCorrect) {
      solvedPuzzles.set(sub.puzzleId, {
        points: sub.pointsAwarded,
        attempts: sub.attemptsCount,
      });
    }
  }

  // Get user's table membership
  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      table: {
        eventNightId: eventId,
        isActive: true,
      },
      leftAt: null,
    },
    include: {
      table: {
        select: { id: true, name: true },
      },
    },
  });

  return { event, solvedPuzzles, userTable: membership?.table ?? null };
}

export default async function EventDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.onboardingComplete) {
    redirect('/onboarding');
  }

  if (!session.user.alias) {
    redirect('/setup-alias');
  }

  const data = await getEventDetail(params.eventId, session.user.id);

  if (!data) {
    notFound();
  }

  const { event, solvedPuzzles, userTable } = data;

  const totalPuzzles = event.rounds.reduce((sum, r) => sum + r.puzzles.length, 0);
  const totalSolved = solvedPuzzles.size;
  const totalPoints = Array.from(solvedPuzzles.values()).reduce((sum, s) => sum + s.points, 0);

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    LIVE: { label: 'LIVE', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🔴' },
    DRAFT: { label: 'In arrivo', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
    ENDED: { label: 'Concluso', color: 'bg-white/10 text-white/50 border-white/10', icon: '✓' },
  };

  const roundStatusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'In attesa', color: 'text-yellow-400' },
    ACTIVE: { label: 'Attivo', color: 'text-green-400' },
    COMPLETED: { label: 'Completato', color: 'text-white/50' },
    CANCELLED: { label: 'Annullato', color: 'text-red-400' },
  };

  const roundTypeLabels: Record<string, string> = {
    SINGLE_TABLE: '🎯 Tavolo singolo',
    MULTI_TABLE: '🤝 Multi-tavolo',
    INDIVIDUAL: '👤 Individuale',
  };

  const status = statusConfig[event.status] || statusConfig.DRAFT;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
      <div className="fixed inset-0 bg-stars opacity-30 -z-10" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-magic-purple/10 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-magic-dark/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/events" className="flex items-center gap-2 text-white/50 hover:text-magic-gold transition-colors group">
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span className="text-sm">Tutti gli Eventi</span>
            </Link>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
            {status.icon} {status.label}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Event Header */}
        <section className="mb-10">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold glow-text mb-3">{event.name}</h1>
          {event.description && (
            <p className="text-white/60 text-lg max-w-3xl">{event.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{formatEventDate(event.startsAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕐</span>
              <span>{formatTimeRange(event.startsAt, event.endsAt)}</span>
            </div>
            {userTable && (
              <div className="flex items-center gap-2 text-magic-gold">
                <span>🪑</span>
                <span>Il tuo tavolo: <strong>{userTable.name}</strong></span>
              </div>
            )}
          </div>
        </section>

        {/* Stats Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="card-magic text-center py-4">
            <div className="text-3xl font-bold text-magic-gold">{totalSolved}</div>
            <div className="text-white/50 text-sm">Risolti</div>
          </div>
          <div className="card-magic text-center py-4">
            <div className="text-3xl font-bold text-white">{totalPuzzles}</div>
            <div className="text-white/50 text-sm">Enigmi totali</div>
          </div>
          <div className="card-magic text-center py-4">
            <div className="text-3xl font-bold text-magic-mystic">{totalPoints}</div>
            <div className="text-white/50 text-sm">Punti guadagnati</div>
          </div>
          <div className="card-magic text-center py-4">
            <div className="text-3xl font-bold text-white">{event._count.rounds}</div>
            <div className="text-white/50 text-sm">Round</div>
          </div>
        </section>

        {/* Rounds & Puzzles */}
        <section>
          <h2 className="font-cinzel text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span>🎯</span>
            <span>Round & Enigmi</span>
          </h2>

          {event.rounds.length === 0 ? (
            <div className="card-magic text-center py-12">
              <div className="text-5xl mb-4 opacity-50">🎭</div>
              <p className="text-white/50">I round per questo evento non sono ancora stati pubblicati.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {event.rounds.map((round, roundIndex) => {
                const rStatus = roundStatusConfig[round.status] || roundStatusConfig.PENDING;
                const rType = roundTypeLabels[round.type] || round.type;

                return (
                  <div key={round.id} className="card-magic">
                    {/* Round Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white/30 text-sm font-mono">R{roundIndex + 1}</span>
                          <h3 className="font-cinzel text-lg font-bold text-white">{round.title}</h3>
                        </div>
                        {round.description && (
                          <p className="text-white/50 text-sm mt-1">{round.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium ${rStatus.color}`}>{rStatus.label}</span>
                        <span className="text-white/30 text-xs">{rType}</span>
                      </div>
                    </div>

                    {/* Puzzles */}
                    {round.puzzles.length === 0 ? (
                      <p className="text-white/30 text-sm italic">Nessun enigma pubblicato per questo round.</p>
                    ) : (
                      <div className="space-y-2">
                        {round.puzzles.map((puzzle) => {
                          const solved = solvedPuzzles.get(puzzle.id);
                          const isActive = round.status === 'ACTIVE' && event.status === 'LIVE';

                          return (
                            <div
                              key={puzzle.id}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                solved
                                  ? 'bg-green-500/5 border-green-500/20'
                                  : isActive
                                    ? 'bg-white/5 border-white/10 hover:border-magic-purple/30'
                                    : 'bg-white/[0.02] border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                  solved
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white/5 text-white/30'
                                }`}>
                                  {solved ? '✓' : puzzle.order + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-medium truncate ${solved ? 'text-green-300' : 'text-white'}`}>
                                    {puzzle.title}
                                  </p>
                                  <p className="text-white/30 text-xs">
                                    {puzzle._count.hints > 0 && `${puzzle._count.hints} suggeriment${puzzle._count.hints !== 1 ? 'i' : 'o'} · `}
                                    {puzzle._count.submissions} invio{puzzle._count.submissions !== 1 ? 'i' : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                {solved && (
                                  <span className="text-green-400 text-sm font-bold">
                                    +{solved.points} pt
                                  </span>
                                )}
                                {isActive && !solved ? (
                                  <Link
                                    href={`/dashboard/puzzles/${puzzle.id}`}
                                    className="px-4 py-1.5 rounded-lg bg-magic-purple/20 text-magic-mystic text-sm font-medium hover:bg-magic-purple/30 transition-colors"
                                  >
                                    Risolvi →
                                  </Link>
                                ) : solved ? (
                                  <Link
                                    href={`/dashboard/puzzles/${puzzle.id}`}
                                    className="px-4 py-1.5 rounded-lg bg-white/5 text-white/40 text-sm hover:text-white/60 transition-colors"
                                  >
                                    Rivedi
                                  </Link>
                                ) : (
                                  <span className="text-white/20 text-sm">🔒 Bloccato</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tables Section */}
        {event.tables.length > 0 && (
          <section className="mt-10">
            <h2 className="font-cinzel text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span>👥</span>
              <span>Tavoli</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.tables.map((table) => (
                <div
                  key={table.id}
                  className={`card-magic text-center py-4 ${
                    userTable?.id === table.id ? 'border-magic-gold/30' : ''
                  }`}
                >
                  <div className="text-2xl mb-2">{userTable?.id === table.id ? '⭐' : '🪑'}</div>
                  <h3 className="font-semibold text-white">{table.name}</h3>
                  <p className="text-white/40 text-sm mt-1">
                    {table._count.memberships} membr{table._count.memberships !== 1 ? 'i' : 'o'}
                  </p>
                  {userTable?.id === table.id && (
                    <span className="text-magic-gold text-xs mt-2 inline-block">Il tuo tavolo</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/30 text-sm">
            © 2026 Magic Farm. Where Magic Meets Competition ✨
          </p>
        </div>
      </footer>
    </main>
  );
}

// ── Utility Functions ──────────────────────────────────────────────

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
