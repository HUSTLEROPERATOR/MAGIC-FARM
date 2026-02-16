import { prisma } from '@/lib/db/prisma';
import { Trophy, Medal, ArrowLeft } from '@/lib/ui/icons';

export default async function ClassificaPage() {
  const leaderboard = await prisma.leaderboardEntry.findMany({
    orderBy: { points: 'desc' },
    take: 50,
    include: {
      user: {
        select: { alias: true, firstName: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-10 h-10 text-magic-gold" />
          <h1 className="font-cinzel text-3xl text-magic-gold">Classifica</h1>
        </div>

        {leaderboard.length === 0 ? (
          <div className="card-magic text-center py-12">
            <Medal className="w-12 h-12 text-magic-gold mx-auto mb-4" />
            <p className="text-white/60 text-lg">La classifica è ancora vuota.</p>
            <p className="text-white/40 text-sm mt-2">Partecipa alle serate per scalare la classifica!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
              return (
                <div
                  key={entry.id}
                  className={`card-magic flex items-center justify-between ${
                    index < 3 ? 'border-magic-gold/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl w-10 text-center ${index >= 3 ? 'text-white/40 text-sm' : ''}`}>
                      {medal}
                    </span>
                    <div>
                      <p className="text-white font-semibold">
                        {entry.user.alias || entry.user.firstName || 'Mago Anonimo'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {entry.events} serate · {entry.riddles} enigmi
                      </p>
                    </div>
                  </div>
                  <span className="text-magic-gold font-bold text-lg">{entry.points} pts</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
