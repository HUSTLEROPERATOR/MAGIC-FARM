import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export default async function ProfiloPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      alias: true,
      createdAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">👤</span>
          <h1 className="font-cinzel text-3xl text-magic-gold">Il Tuo Profilo</h1>
        </div>

        <div className="card-magic space-y-6">
          <div className="text-center pb-6 border-b border-white/10">
            <div className="text-6xl mb-3">🎩</div>
            <h2 className="text-magic-gold font-cinzel text-2xl">
              {dbUser?.alias || dbUser?.firstName || 'Mago Misterioso'}
            </h2>
            {dbUser?.alias && dbUser?.firstName && (
              <p className="text-white/50 text-sm mt-1">
                {dbUser.firstName} {dbUser.lastName}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-white/50">Email</span>
              <span className="text-white">{dbUser?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/50">Nome</span>
              <span className="text-white">
                {dbUser?.firstName ? `${dbUser.firstName} ${dbUser.lastName || ''}` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/50">Alias</span>
              <span className="text-magic-mystic">{dbUser?.alias || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/50">Membro dal</span>
              <span className="text-white">
                {dbUser?.createdAt
                  ? new Date(dbUser.createdAt).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm">
            ← Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
