import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { JoinTableForm } from './components/join-table-form';
import { PuzzleCard } from './components/puzzle-card';
import { ClueBoard } from './components/clue-board';
import { LiveLeaderboard } from './components/live-leaderboard';
import { RitualOverlay } from './components/ritual-overlay';
import { SpectatorToggle } from './components/spectator-toggle';
import { AllianceEffects } from './components/alliance-effects';
import { EventMetricsPanel } from './components/event-metrics';

interface PageProps {
  params: { eventId: string };
}

export default async function SerataDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const event = await prisma.eventNight.findUnique({
    where: { id: params.eventId },
    include: {
      rounds: {
        orderBy: { createdAt: 'asc' },
        include: {
          puzzles: {
            orderBy: { order: 'asc' },
            include: {
              hints: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  order: true,
                  penaltyPoints: true,
                },
              },
              submissions: {
                where: { userId },
                orderBy: { submittedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
      tables: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          memberships: {
            where: { leftAt: null },
            select: {
              userId: true,
              user: { select: { alias: true, firstName: true } },
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Destructure extension fields
  const { theme, spectatorEnabled } = event;

  // Find user's table
  const userMembership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      table: { eventNightId: params.eventId },
      leftAt: null,
    },
    include: {
      table: { select: { id: true, name: true } },
    },
  });

  const userTable = userMembership?.table || null;
  const isLive = event.status === 'LIVE';
  const isEnded = event.status === 'ENDED';

  return (
    <div className="min-h-screen bg-magic-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/serate" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm mb-4 inline-block">
            ← Torna alle Serate
          </a>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-cinzel text-3xl md:text-4xl text-magic-gold">{event.name}</h1>
              {theme && (
                <p className="text-magic-mystic/80 text-sm mt-1 italic">🎭 {theme}</p>
              )}
              {event.description && <p className="text-white/50 mt-2">{event.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
                <span>📅 {new Date(event.startsAt).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <span>🕐 {new Date(event.startsAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endsAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {/* Ritual overlay triggers */}
              <div className="mt-3">
                <RitualOverlay eventId={params.eventId} eventStatus={event.status} />
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              isLive ? 'bg-green-500/20 text-green-400 animate-pulse' :
              isEnded ? 'bg-white/10 text-white/50' :
              'bg-magic-purple/20 text-magic-mystic'
            }`}>
              {isLive ? '🔴 LIVE' : isEnded ? '✅ Conclusa' : '📋 In arrivo'}
            </span>
          </div>
        </div>

        {/* Join table section — only if LIVE and not at a table */}
        {isLive && !userTable && (
          <div className="mb-8">
            <JoinTableForm eventId={params.eventId} />
          </div>
        )}

        {/* User's table info */}
        {userTable && (
          <div className="card-magic mb-8 border-magic-gold/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🪑</span>
              <div>
                <p className="text-magic-gold font-semibold">Il tuo tavolo: {userTable.name}</p>
                <p className="text-white/40 text-xs mt-1">
                  Compagni: {event.tables
                    .find(t => t.id === userTable.id)
                    ?.memberships
                    .filter(m => m.userId !== userId)
                    .map(m => m.user.alias || m.user.firstName || 'Mago')
                    .join(', ') || 'Solo tu per ora'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Rounds & Puzzles (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {event.rounds.length === 0 ? (
              <div className="card-magic text-center py-12">
                <p className="text-5xl mb-4">⏳</p>
                <p className="text-white/60">I round non sono ancora iniziati.</p>
                <p className="text-white/40 text-sm mt-1">Attendi che il Game Master avvii la serata!</p>
              </div>
            ) : (
              event.rounds.map((round, roundIndex) => (
                <div key={round.id} className="space-y-4">
                  {/* Round header */}
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      round.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                      round.status === 'COMPLETED' ? 'bg-magic-gold/20 text-magic-gold' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {roundIndex + 1}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-white font-semibold">{round.title}</h2>
                      {round.description && <p className="text-white/40 text-xs">{round.description}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      round.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                      round.status === 'COMPLETED' ? 'bg-magic-gold/10 text-magic-gold' :
                      round.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                      'bg-white/5 text-white/30'
                    }`}>
                      {round.status === 'ACTIVE' ? '⚡ Attivo' :
                       round.status === 'COMPLETED' ? '✅ Completato' :
                       round.status === 'CANCELLED' ? '❌ Annullato' : '⏳ In attesa'}
                    </span>
                    {round.type !== 'SINGLE_TABLE' && (
                      <span className="text-xs px-2 py-1 rounded bg-magic-mystic/10 text-magic-mystic">
                        {round.type === 'MULTI_TABLE' ? '🤝 Multi-Tavolo' : '👤 Individuale'}
                      </span>
                    )}
                  </div>

                  {/* Puzzles */}
                  {round.status === 'ACTIVE' || round.status === 'COMPLETED' ? (
                    <div className="space-y-3 ml-4 border-l border-white/10 pl-6">
                      {round.puzzles.map((puzzle) => {
                        const lastSubmission = puzzle.submissions[0];
                        const isSolved = lastSubmission?.isCorrect === true;
                        return (
                          <PuzzleCard
                            key={puzzle.id}
                            puzzle={{
                              id: puzzle.id,
                              title: puzzle.title,
                              prompt: puzzle.prompt,
                              order: puzzle.order,
                              hintsCount: puzzle.hints.length,
                              hintPenalties: puzzle.hints.map(h => h.penaltyPoints),
                              puzzleType: puzzle.puzzleType,
                              physicalHint: puzzle.physicalHint,
                              environmentNote: puzzle.environmentNote,
                            }}
                            submission={lastSubmission ? {
                              isCorrect: lastSubmission.isCorrect,
                              attemptsCount: lastSubmission.attemptsCount,
                              hintsUsed: lastSubmission.hintsUsed,
                              pointsAwarded: lastSubmission.pointsAwarded,
                            } : null}
                            eventId={params.eventId}
                            roundActive={round.status === 'ACTIVE'}
                            isSolved={isSolved}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ml-4 border-l border-white/10 pl-6">
                      <p className="text-white/30 text-sm italic">
                        {round.puzzles.length} enigmi — disponibili quando il round sarà attivo
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Spectator toggle */}
            {isLive && (
              <SpectatorToggle eventId={params.eventId} spectatorAvailable={spectatorEnabled} />
            )}

            {/* Live Leaderboard */}
            <LiveLeaderboard eventId={params.eventId} />

            {/* Alliance Effects */}
            {userTable && isLive && (
              <AllianceEffects eventId={params.eventId} />
            )}

            {/* Clue Board (chat) — only if at a table */}
            {userTable && (
              <ClueBoard eventId={params.eventId} tableName={userTable.name} />
            )}

            {/* Event Metrics — only if ended */}
            <EventMetricsPanel eventId={params.eventId} eventStatus={event.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
