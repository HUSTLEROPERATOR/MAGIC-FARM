'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

export default function ConsentsPage() {
  const { update } = useSession();
  const router = useRouter();

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentPlatform, setConsentPlatform] = useState(false);
  const [consentControllerMarketing, setConsentControllerMarketing] = useState(false);
  const [consentShareWithHost, setConsentShareWithHost] = useState(false);
  const [consentHostMarketing, setConsentHostMarketing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing consent values
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/consents');
        const data = await res.json();
        if (data.consent) {
          setPrivacyAccepted(data.consent.privacyAccepted);
          setTermsAccepted(data.consent.termsAccepted);
          setConsentPlatform(data.consent.consentPlatform ?? false);
          setConsentControllerMarketing(data.consent.consentControllerMarketing ?? false);
          setConsentShareWithHost(data.consent.consentShareWithHost ?? false);
          setConsentHostMarketing(data.consent.consentHostMarketing ?? false);
        }
      } catch {
        // ignore load errors
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  // When share-with-host is disabled, also disable host marketing
  useEffect(() => {
    if (!consentShareWithHost) {
      setConsentHostMarketing(false);
    }
  }, [consentShareWithHost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacyAccepted,
          termsAccepted,
          consentPlatform,
          consentControllerMarketing,
          consentShareWithHost,
          consentHostMarketing: consentShareWithHost ? consentHostMarketing : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio.');
        return;
      }

      await update({ consentsComplete: true });
      setSuccess('Consensi aggiornati.');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-magic-dark flex items-center justify-center">
        <p className="text-white/50">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-magic-dark flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="mb-4"><Icon name="ScrollText" size="2xl" className="text-magic-gold w-12 h-12" /></div>
          <h1 className="font-cinzel text-3xl text-magic-gold">Consensi e Privacy</h1>
          <p className="text-white/50 mt-2 text-sm">
            Gestisci i tuoi consensi. Puoi revocarli in qualsiasi momento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-magic space-y-6">
          {/* ── Obbligatori ─────────────────────────── */}
          <div>
            <h3 className="text-magic-gold font-semibold text-sm uppercase tracking-wider mb-3">
              Obbligatori
            </h3>

            {/* Privacy Policy */}
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
              />
              <div>
                <span className="text-white font-medium">Privacy Policy</span>
                <span className="text-red-400 ml-1">*</span>
                <p className="text-white/40 text-sm mt-1">
                  Accetto la{' '}
                  <a href="/privacy" target="_blank" className="text-magic-mystic underline">
                    Privacy Policy
                  </a>{' '}
                  (v2.0).
                </p>
              </div>
            </label>

            {/* Terms of Service */}
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
              />
              <div>
                <span className="text-white font-medium">Termini di Servizio</span>
                <span className="text-red-400 ml-1">*</span>
                <p className="text-white/40 text-sm mt-1">
                  Accetto i{' '}
                  <a href="/terms" target="_blank" className="text-magic-mystic underline">
                    Termini di Servizio
                  </a>{' '}
                  (v2.0).
                </p>
              </div>
            </label>

            {/* Platform consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPlatform}
                onChange={(e) => setConsentPlatform(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
              />
              <div>
                <span className="text-white font-medium">Utilizzo piattaforma</span>
                <span className="text-red-400 ml-1">*</span>
                <p className="text-white/40 text-sm mt-1">
                  Acconsento al trattamento dei dati per account, gameplay, punteggi e classifica.
                  Titolare: Nicola Contu.
                </p>
              </div>
            </label>
          </div>

          <hr className="border-white/10" />

          {/* ── Opzionali ──────────────────────────── */}
          <div>
            <h3 className="text-magic-gold font-semibold text-sm uppercase tracking-wider mb-3">
              Opzionali
            </h3>

            {/* Controller marketing */}
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={consentControllerMarketing}
                onChange={(e) => setConsentControllerMarketing(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
              />
              <div>
                <span className="text-white font-medium">Marketing piattaforma</span>
                <span className="text-white/30 ml-1 text-xs">(opzionale)</span>
                <p className="text-white/40 text-sm mt-1">
                  Desidero ricevere aggiornamenti su eventi e novità da parte di Nicola Contu (titolare).
                </p>
              </div>
            </label>

            {/* Share with host */}
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={consentShareWithHost}
                onChange={(e) => setConsentShareWithHost(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
              />
              <div>
                <span className="text-white font-medium">Condivisione dati con l&apos;Host</span>
                <span className="text-white/30 ml-1 text-xs">(opzionale)</span>
                <p className="text-white/40 text-sm mt-1">
                  Consento la condivisione dei miei dati di contatto con l&apos;host/mago della serata.
                  L&apos;host è un soggetto separato che potrà contattarti solo se hai dato il consenso.
                </p>
              </div>
            </label>

            {/* Host marketing — only if share-with-host is enabled */}
            <label className={`flex items-start gap-3 ${consentShareWithHost ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={consentHostMarketing}
                onChange={(e) => setConsentHostMarketing(e.target.checked)}
                disabled={!consentShareWithHost}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple disabled:opacity-40"
              />
              <div>
                <span className="text-white font-medium">Marketing dall&apos;Host</span>
                <span className="text-white/30 ml-1 text-xs">(opzionale)</span>
                <p className="text-white/40 text-sm mt-1">
                  Desidero ricevere inviti a eventi privati e comunicazioni dall&apos;host.
                  {!consentShareWithHost && (
                    <span className="block text-white/30 mt-1 text-xs italic">
                      Richiede il consenso alla condivisione dati con l&apos;host.
                    </span>
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Note */}
          <div className="bg-white/5 rounded-lg p-3 text-white/40 text-xs leading-relaxed">
            <p>
              L&apos;host della serata è un soggetto terzo rispetto alla piattaforma.
              Potrà vedere i tuoi dati di contatto solo se hai dato il consenso esplicito.
              Puoi revocare qualsiasi consenso opzionale in qualsiasi momento da questa pagina.
            </p>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={!privacyAccepted || !termsAccepted || !consentPlatform || loading}
            className="btn-magic w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvataggio...' : 'Salva Consensi'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <Icon name="ArrowLeft" size="sm" /> Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
