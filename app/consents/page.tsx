'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ConsentsPage() {
  const { update } = useSession();
  const router = useRouter();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyAccepted, termsAccepted, marketingOptIn }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante il salvataggio.');
        return;
      }

      // Update session to reflect consent status
      await update({ consentsComplete: true });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-magic-dark flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">📜</p>
          <h1 className="font-cinzel text-3xl text-magic-gold">Consensi Necessari</h1>
          <p className="text-white/50 mt-2 text-sm">
            Prima di giocare, devi accettare i seguenti consensi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-magic space-y-6">
          {/* Privacy Policy */}
          <label className="flex items-start gap-3 cursor-pointer">
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
                (v1.0).
              </p>
            </div>
          </label>

          {/* Terms of Service */}
          <label className="flex items-start gap-3 cursor-pointer">
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
                (v1.0).
              </p>
            </div>
          </label>

          {/* Marketing (optional) */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-magic-gold focus:ring-magic-purple"
            />
            <div>
              <span className="text-white font-medium">Comunicazioni Marketing</span>
              <span className="text-white/30 ml-1 text-xs">(opzionale)</span>
              <p className="text-white/40 text-sm mt-1">
                Desidero ricevere aggiornamenti su eventi e novità.
              </p>
            </div>
          </label>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!privacyAccepted || !termsAccepted || loading}
            className="btn-magic w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvataggio...' : 'Accetta e Continua'}
          </button>
        </form>
      </div>
    </div>
  );
}
