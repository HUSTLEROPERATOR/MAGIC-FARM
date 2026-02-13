import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { SignOutButton } from '@/components/sign-out-button';

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
      role: true,
      createdAt: true,
    },
  });

  const consent = await prisma.consent.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
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
            {dbUser?.role === 'ADMIN' && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                ADMIN
              </span>
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

        {/* Consent Status */}
        <div className="card-magic mt-6">
          <h3 className="text-magic-gold font-semibold mb-4">Consensi</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Privacy Policy</span>
              <span className={`text-sm ${consent?.privacyAcceptedAt ? 'text-green-400' : 'text-red-400'}`}>
                {consent?.privacyAcceptedAt ? `Accettata (v${consent.privacyVersion})` : 'Non accettata'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Termini di Servizio</span>
              <span className={`text-sm ${consent?.termsAcceptedAt ? 'text-green-400' : 'text-red-400'}`}>
                {consent?.termsAcceptedAt ? `Accettati (v${consent.termsVersion})` : 'Non accettati'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Marketing</span>
              <span className="text-sm text-white/60">
                {consent?.marketingOptInAt ? 'Attivo' : 'Non attivo'}
              </span>
            </div>
          </div>
          <Link href="/consents" className="inline-block mt-4 text-magic-mystic text-sm hover:text-magic-gold transition-colors">
            Aggiorna consensi →
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm">
            ← Torna alla Dashboard
          </a>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
