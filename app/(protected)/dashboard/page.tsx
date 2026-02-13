import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { SignOutButton } from '@/components/sign-out-button';
import { JoinEventForm } from './join-event-form';

async function getUserStats(userId: string) {
  const submissions = await prisma.submission.findMany({
    where: { userId, isCorrect: true },
    select: {
      pointsAwarded: true,
      puzzle: {
        select: {
          round: {
            select: { eventNightId: true },
          },
        },
      },
    },
  });

  const totalPoints = submissions.reduce((sum, s) => sum + s.pointsAwarded, 0);
  const eventIds = new Set(submissions.map((s) => s.puzzle.round.eventNightId));

  return {
    eventsParticipated: eventIds.size,
    totalPoints,
    puzzlesSolved: submissions.length,
  };
}

async function getActiveEvent(userId: string) {
  const event = await prisma.eventNight.findFirst({
    where: { status: 'LIVE' },
    select: { id: true, name: true, joinCode: true },
  });
  if (!event) return null;

  const membership = await prisma.tableMembership.findFirst({
    where: {
      userId,
      leftAt: null,
      table: { eventNightId: event.id },
    },
    include: { table: { select: { name: true } } },
  });

  return {
    id: event.id,
    name: event.name,
    joinCode: event.joinCode,
    isJoined: !!membership,
    tableName: membership?.table.name || null,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const stats = await getUserStats(user.id);
  const activeEvent = await getActiveEvent(user.id);

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-cinzel text-3xl md:text-4xl text-magic-gold">
              Benvenuto, {user.firstName || user.alias || 'Mago'}
            </h1>
            <p className="text-white/50 mt-1">La tua area personale</p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === 'ADMIN' && (
              <Link href="/admin" className="px-3 py-1.5 bg-red-500/20 text-red-300 text-xs rounded hover:bg-red-500/30 transition-colors">
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        {/* Active Event Banner */}
        {activeEvent && (
          <div className="card-magic border-green-500/30 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Serata in corso</span>
            </div>
            <h2 className="text-magic-gold font-cinzel text-xl mb-3">{activeEvent.name}</h2>
            {activeEvent.isJoined ? (
              <div className="flex items-center justify-between">
                <p className="text-white/60 text-sm">
                  Sei al tavolo: <span className="text-magic-mystic">{activeEvent.tableName}</span>
                </p>
                <Link href="/game" className="btn-magic text-sm">
                  Vai al Gioco →
                </Link>
              </div>
            ) : (
              <JoinEventForm joinCode={activeEvent.joinCode || ''} />
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card-magic text-center">
            <p className="text-3xl font-bold text-magic-gold">{stats.totalPoints}</p>
            <p className="text-white/60 text-sm mt-1">Punti Totali</p>
          </div>
          <div className="card-magic text-center">
            <p className="text-3xl font-bold text-magic-mystic">{stats.eventsParticipated}</p>
            <p className="text-white/60 text-sm mt-1">Serate Partecipate</p>
          </div>
          <div className="card-magic text-center">
            <p className="text-3xl font-bold text-white">{stats.puzzlesSolved}</p>
            <p className="text-white/60 text-sm mt-1">Enigmi Risolti</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/serate" className="card-magic group block">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎭</span>
              <div>
                <h3 className="text-magic-gold font-semibold text-lg group-hover:text-magic-mystic transition-colors">
                  Serate Evento
                </h3>
                <p className="text-white/50 text-sm">Scopri le prossime serate e partecipa</p>
              </div>
            </div>
          </Link>

          <Link href="/libreria" className="card-magic group block">
            <div className="flex items-center gap-4">
              <span className="text-4xl">📚</span>
              <div>
                <h3 className="text-magic-gold font-semibold text-lg group-hover:text-magic-mystic transition-colors">
                  Libreria
                </h3>
                <p className="text-white/50 text-sm">Contenuti esclusivi e tutorial</p>
              </div>
            </div>
          </Link>

          <Link href="/classifica" className="card-magic group block">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏆</span>
              <div>
                <h3 className="text-magic-gold font-semibold text-lg group-hover:text-magic-mystic transition-colors">
                  Classifica
                </h3>
                <p className="text-white/50 text-sm">Scopri chi è il mago più potente</p>
              </div>
            </div>
          </Link>

          <Link href="/profilo" className="card-magic group block">
            <div className="flex items-center gap-4">
              <span className="text-4xl">👤</span>
              <div>
                <h3 className="text-magic-gold font-semibold text-lg group-hover:text-magic-mystic transition-colors">
                  Profilo
                </h3>
                <p className="text-white/50 text-sm">Gestisci il tuo account e le preferenze</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
