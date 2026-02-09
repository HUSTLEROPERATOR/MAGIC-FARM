import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';

async function getAllEvents() {
  const events = await prisma.eventNight.findMany({
    orderBy: { startsAt: 'desc' },
    include: {
      _count: {
        select: {
          rounds: true,
          tables: true,
        },
      },
    },
  });
  return events;
}

export default async function EventsPage() {
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

  const events = await getAllEvents();

  const liveEvents = events.filter((e) => e.status === 'LIVE');
  const upcomingEvents = events.filter((e) => e.status === 'DRAFT');
  const pastEvents = events.filter((e) => e.status === 'ENDED');

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
      <div className="fixed inset-0 bg-stars opacity-30 -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-magic-dark/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-magic-gold transition-colors group">
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              <span className="text-sm">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌙</span>
              <h1 className="font-cinzel text-xl font-bold glow-text">Serate Evento</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Live Events */}
        {liveEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="font-cinzel text-2xl font-bold text-white">Eventi Live</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">⏳</span>
              <h2 className="font-cinzel text-2xl font-bold text-white">In Programma</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">📜</span>
              <h2 className="font-cinzel text-2xl font-bold text-white/70">Eventi Passati</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6 opacity-50 animate-float">🌑</div>
            <h2 className="font-cinzel text-2xl font-bold text-white/70 mb-3">
              Nessun evento disponibile
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              Non ci sono serate evento in programma al momento. 
              Torna presto per nuove serate magiche!
            </p>
            <Link href="/dashboard" className="btn-magic inline-block mt-8">
              Torna alla Dashboard
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Event Card Component ──────────────────────────────────────────

interface EventCardProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    status: string;
    _count: {
      rounds: number;
      tables: number;
    };
  };
}

function EventCard({ event }: EventCardProps) {
  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    LIVE: { label: 'LIVE', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🔴' },
    DRAFT: { label: 'In arrivo', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
    ENDED: { label: 'Concluso', color: 'bg-white/10 text-white/50 border-white/10', icon: '✓' },
  };

  const status = statusConfig[event.status] || statusConfig.DRAFT;

  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="card-magic group hover:scale-[1.01] transition-all duration-300 block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-cinzel text-lg font-bold text-white group-hover:text-magic-gold transition-colors truncate">
            {event.name}
          </h3>
          <p className="text-white/50 text-sm mt-1">
            {formatEventDate(event.startsAt)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border shrink-0 ml-3 ${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {event.description && (
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{event.description}</p>
      )}

      <div className="flex items-center gap-6 text-sm text-white/40">
        <div className="flex items-center gap-2">
          <span>🎯</span>
          <span>{event._count.rounds} round{event._count.rounds !== 1 ? '' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>👥</span>
          <span>{event._count.tables} tavol{event._count.tables !== 1 ? 'i' : 'o'}</span>
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <span>{formatTimeRange(event.startsAt, event.endsAt)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
        <span className="text-magic-mystic text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
          {event.status === 'LIVE' ? 'Entra' : 'Dettagli'}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
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
