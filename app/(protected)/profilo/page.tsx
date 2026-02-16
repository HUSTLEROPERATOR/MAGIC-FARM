import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { SignOutButton } from '@/components/sign-out-button';
import { RevokeConsentButton } from '@/components/revoke-consent-button';
import { UserIcon, MagicWand, Shield, Handshake, ArrowLeft } from '@/lib/ui/icons';

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
          <UserIcon className="w-10 h-10 text-magic-gold" />
          <h1 className="font-cinzel text-3xl text-magic-gold">Il Tuo Profilo</h1>
        </div>

        <div className="card-magic space-y-6">
          <div className="text-center pb-6 border-b border-white/10">
            <MagicWand className="w-14 h-14 text-magic-gold mx-auto mb-3" />
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

        {/* Privacy Summary */}
        <div className="card-magic mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-magic-gold" />
            <h3 className="text-magic-gold font-semibold">Il tuo stato privacy</h3>
          </div>

          {/* Plain-language summary */}
          <div className="rounded-lg bg-white/5 p-4 mb-5 space-y-2 text-sm leading-relaxed">
            {consent?.consentPlatform ? (
              <p className="text-green-400">✓ Puoi partecipare alle serate e accumulare punti.</p>
            ) : (
              <p className="text-red-400">✗ Devi accettare il consenso piattaforma per giocare.</p>
            )}

            {consent?.consentShareWithHost ? (
              <p className="text-green-400">
                ✓ Il tuo alias appare nella classifica host.{' '}
                {consent?.consentHostMarketing
                  ? "L'host può invitarti a eventi futuri (la tua email non viene mai mostrata)."
                  : "L'host vede solo il tuo alias — nessun invito diretto."}
              </p>
            ) : (
              <p className="text-white/60">— Il tuo alias non è visibile all&apos;host della serata.</p>
            )}

            {consent?.consentControllerMarketing ? (
              <p className="text-green-400">✓ Puoi ricevere comunicazioni dalla piattaforma Magic Farm.</p>
            ) : (
              <p className="text-white/60">— Nessuna comunicazione marketing dalla piattaforma.</p>
            )}
          </div>

          {/* Detailed toggle status */}
          <h4 className="text-white/70 text-xs uppercase tracking-wider mb-3">Dettaglio consensi</h4>
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
              <span className="text-white/50 text-sm">Piattaforma (gameplay)</span>
              <span className={`text-sm ${consent?.consentPlatform ? 'text-green-400' : 'text-red-400'}`}>
                {consent?.consentPlatform ? 'Attivo' : 'Non attivo'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Marketing piattaforma</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${consent?.consentControllerMarketing ? 'text-blue-400' : 'text-white/40'}`}>
                  {consent?.consentControllerMarketing ? 'Attivo' : 'Non attivo'}
                </span>
                {consent?.consentControllerMarketing && (
                  <RevokeConsentButton
                    field="consentControllerMarketing"
                    label="Revoca"
                    warning="Non riceverai più comunicazioni dalla piattaforma."
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Condivisione con Host</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${consent?.consentShareWithHost ? 'text-blue-400' : 'text-white/40'}`}>
                  {consent?.consentShareWithHost ? <span className="inline-flex items-center gap-1">Attivo <Handshake className="w-3.5 h-3.5" /></span> : 'Non attivo'}
                </span>
                {consent?.consentShareWithHost && (
                  <RevokeConsentButton
                    field="consentShareWithHost"
                    label="Revoca"
                    warning="Non apparirai più nella classifica host e non riceverai inviti. Effetto immediato."
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-sm">Marketing Host</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${consent?.consentHostMarketing ? 'text-blue-400' : 'text-white/40'}`}>
                  {consent?.consentHostMarketing ? 'Attivo' : 'Non attivo'}
                </span>
                {consent?.consentHostMarketing && (
                  <RevokeConsentButton
                    field="consentHostMarketing"
                    label="Revoca"
                    warning="Non riceverai più inviti dall'host."
                  />
                )}
              </div>
            </div>
          </div>

          <p className="text-white/30 text-xs mt-4">
            La tua email non viene mai condivisa con l&apos;host. Eventuali inviti vengono inviati dalla piattaforma per tuo conto.
          </p>

          <Link href="/consents" className="inline-block mt-4 text-magic-mystic text-sm hover:text-magic-gold transition-colors">
            Aggiorna consensi →
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
          </a>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
