import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

export default async function SeratePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const events = await prisma.eventNight.findMany({
    where: {
      status: { in: ['DRAFT', 'LIVE'] },
    },
    orderBy: { startsAt: 'asc' },
    take: 20,
    select: {
      id: true,
      name: true,
      description: true,
      startsAt: true,
      endsAt: true,
      status: true,
      joinCode: true,
      venueName: true,
      hostName: true,
      tables: {
        select: {
          id: true,
          memberships: {
            where: { userId, leftAt: null },
            select: { id: true },
          },
        },
      },
      rounds: {
        select: { id: true, status: true },
      },
    },
  });

  const pastEvents = await prisma.eventNight.findMany({
    where: { status: 'ENDED' },
    orderBy: { startsAt: 'desc' },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="Theater" size="2xl" className="text-magic-gold" />
          <div>
            <h1 className="font-cinzel text-3xl text-magic-gold">Serate Evento</h1>
            <p className="text-white/40 text-sm">Partecipa alle serate e risolvi gli enigmi</p>
          </div>
        </div>

        {/* Serate LIVE */}
        {events.filter(e => e.status === 'LIVE').length > 0 && (
          <div className="mb-8">
            <h2 className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              In corso ora
            </h2>
            <div className="space-y-4">
              {events.filter(e => e.status === 'LIVE').map((event) => {
                const isJoined = event.tables.some(t => t.memberships.length > 0);
                const activeRounds = event.rounds.filter(r => r.status === 'ACTIVE').length;
                return (
                  <Link
                    key={event.id}
                    href={`/serate/${event.id}`}
                    className="card-magic block border-green-500/30 hover:border-green-400/50 animate-pulse-glow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-magic-gold font-semibold text-lg">{event.name}</h3>
                        {(event.venueName || event.hostName) && (
                          <p className="text-white/50 text-sm mt-0.5">
                            {[event.venueName, event.hostName ? `Host: ${event.hostName}` : null].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-white/60 text-sm mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                          <span className="inline-flex items-center gap-1"><Icon name="Clock" size="xs" /> Iniziata {new Date(event.startsAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                          {activeRounds > 0 && <span className="text-green-400 inline-flex items-center gap-1"><Icon name="Zap" size="xs" /> {activeRounds} round attivi</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-500/20 text-green-400 inline-flex items-center gap-1">
                          <Icon name="Circle" size="xs" className="text-red-500 fill-red-500" /> LIVE
                        </span>
                        {isJoined ? (
                          <span className="text-xs text-magic-mystic inline-flex items-center gap-1"><Icon name="Check" size="xs" /> Al tavolo</span>
                        ) : (
                          <span className="text-xs text-magic-gold animate-pulse inline-flex items-center gap-1">Entra <Icon name="ArrowRight" size="xs" /></span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Serate in programma */}
        <div className="mb-8">
          <h2 className="text-magic-mystic font-semibold text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-1.5">
            <Icon name="ClipboardList" size="sm" /> In programma
          </h2>
          {events.filter(e => e.status === 'DRAFT').length === 0 ? (
            <div className="card-magic text-center py-10">
              <div className="mb-4"><Icon name="CrystalBall" size="2xl" className="text-magic-mystic w-12 h-12" /></div>
              <p className="text-white/60">Nessuna serata in programma.</p>
              <p className="text-white/40 text-sm mt-1">Torna presto!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.filter(e => e.status === 'DRAFT').map((event) => (
                <div key={event.id} className="card-magic opacity-80">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{event.name}</h3>
                      {(event.venueName || event.hostName) && (
                        <p className="text-white/40 text-sm mt-0.5">
                          {[event.venueName, event.hostName ? `Host: ${event.hostName}` : null].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-white/50 text-sm mt-1">{event.description}</p>
                      )}
                      <p className="text-white/40 text-xs mt-3 inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5"><Icon name="Calendar" size="xs" /> {new Date(event.startsAt).toLocaleDateString('it-IT', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        })}</span>
                        {' · '}
                        <span className="inline-flex items-center gap-0.5"><Icon name="Clock" size="xs" /> {new Date(event.startsAt).toLocaleTimeString('it-IT', {
                          hour: '2-digit', minute: '2-digit',
                        })}</span>
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-magic-purple/20 text-magic-mystic">
                      Prossimamente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Serate passate */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-white/40 font-semibold text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-1.5">
              <Icon name="ScrollText" size="sm" /> Archivio
            </h2>
            <div className="space-y-2">
              {pastEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/serate/${event.id}`}
                  className="card-magic block opacity-50 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white/70 font-medium">{event.name}</h3>
                      <p className="text-white/30 text-xs mt-1">
                        {new Date(event.startsAt).toLocaleDateString('it-IT', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="text-xs text-white/30 inline-flex items-center gap-1">Conclusa <Icon name="ArrowRight" size="xs" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <Icon name="ArrowLeft" size="sm" /> Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
