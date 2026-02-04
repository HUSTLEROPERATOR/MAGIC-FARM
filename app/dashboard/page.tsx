import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { SignOutButton } from '@/components/sign-out-button';

async function getActiveEvents() {
  const events = await prisma.eventNight.findMany({
    where: {
      status: {
        in: ['DRAFT', 'LIVE'],
      },
      startsAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: {
      startsAt: 'asc',
    },
    take: 5,
  });

  return events;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has alias, redirect to setup if not
  if (!session.user.alias) {
    redirect('/setup-alias');
  }

  const events = await getActiveEvents();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />
      <div className="fixed inset-0 bg-stars opacity-30 -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-magic-dark/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="text-3xl group-hover:animate-pulse">🎩</span>
            <span className="font-cinzel text-xl font-bold glow-text hidden sm:block">
              Magic Farm
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white/50 text-xs">Benvenuto/a</p>
              <p className="text-magic-gold font-semibold">{session.user.alias}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">✨</span>
            <h1 className="font-cinzel text-3xl md:text-4xl font-bold">
              Ciao, <span className="glow-text">{session.user.alias}</span>!
            </h1>
          </div>
          <p className="text-white/60 text-lg ml-14">
            Benvenuto nella tua area personale Magic Farm.
          </p>
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Active Events Card */}
          <div className="card-magic col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🌙</span>
              <h2 className="font-cinzel text-xl font-bold text-white">Serate Evento</h2>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-magic-purple/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        event.status === 'LIVE' 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-yellow-500'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-white">{event.name}</h3>
                        <p className="text-white/50 text-sm">
                          {formatEventDate(event.startsAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.status === 'LIVE'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {event.status === 'LIVE' ? '🔴 LIVE' : '⏳ In arrivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4 opacity-50">🌑</div>
                <p className="text-white/50">Nessun evento in programma al momento.</p>
                <p className="text-white/30 text-sm mt-1">Torna presto per nuove serate magiche!</p>
              </div>
            )}
          </div>

          {/* Library Card */}
          <Link href="/library" className="card-magic group hover:scale-[1.02] transition-transform">
            <div className="text-center py-4">
              <div className="text-5xl mb-4 group-hover:animate-float">📚</div>
              <h2 className="font-cinzel text-xl font-bold text-white mb-2">Libreria</h2>
              <p className="text-white/50 text-sm">
                Accedi ai contenuti educativi e tutorial esclusivi.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-magic-mystic text-sm">
                <span>Esplora</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Profile Card */}
          <Link href="/profile" className="card-magic group hover:scale-[1.02] transition-transform">
            <div className="text-center py-4">
              <div className="text-5xl mb-4 group-hover:animate-float">🎭</div>
              <h2 className="font-cinzel text-xl font-bold text-white mb-2">Profilo</h2>
              <p className="text-white/50 text-sm">
                Gestisci le tue informazioni e preferenze.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-magic-mystic text-sm">
                <span>Modifica</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Leaderboard Card */}
          <Link href="/leaderboard" className="card-magic group hover:scale-[1.02] transition-transform">
            <div className="text-center py-4">
              <div className="text-5xl mb-4 group-hover:animate-float">🏆</div>
              <h2 className="font-cinzel text-xl font-bold text-white mb-2">Classifica</h2>
              <p className="text-white/50 text-sm">
                Scopri i maghi più abili della community.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-magic-mystic text-sm">
                <span>Visualizza</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* Stats Card */}
          <div className="card-magic">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <h2 className="font-cinzel text-lg font-bold text-white">Le tue Statistiche</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Eventi partecipati</span>
                <span className="text-magic-gold font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Punti totali</span>
                <span className="text-magic-gold font-bold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Posizione globale</span>
                <span className="text-magic-gold font-bold">-</span>
              </div>
            </div>
          </div>

        </div>
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

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
