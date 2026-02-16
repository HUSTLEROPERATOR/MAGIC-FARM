'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles } from '@/lib/ui/icons';
import { Icon } from '@/components/ui/icon';

export default function OnboardingPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst || !trimmedLast) {
      setError('Nome e cognome sono obbligatori.');
      setIsLoading(false);
      return;
    }

    if (!privacyAccepted) {
      setError('Devi accettare la Privacy Policy per continuare.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          privacyAccepted,
          marketingOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Si è verificato un errore.');
        setIsLoading(false);
        return;
      }

      // Update session to reflect onboarding completion
      await update({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        onboardingComplete: true,
      });

      // Redirect to alias setup or dashboard
      router.push('/setup-alias');
    } catch {
      setError('Si è verificato un errore. Riprova.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a]" />
      <div className="absolute inset-0 bg-stars opacity-40" />

      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-magic-purple/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-magic-gold/10 rounded-full blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="card-magic">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 animate-float"><Icon name="Sparkles" size="2xl" className="text-magic-gold w-14 h-14" /></div>
            <h1 className="font-cinzel text-3xl font-bold glow-text mb-3">
              Completa il Profilo
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Prima di iniziare, abbiamo bisogno di alcune informazioni.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white/70 mb-2">
                Nome *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Il tuo nome"
                className="input-magic"
                disabled={isLoading}
                autoComplete="given-name"
                autoFocus
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white/70 mb-2">
                Cognome *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Il tuo cognome"
                className="input-magic"
                disabled={isLoading}
                autoComplete="family-name"
                maxLength={100}
              />
            </div>

            {/* Privacy Policy */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  id="privacyAccepted"
                  name="privacyAccepted"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-magic-purple focus:ring-magic-purple/50"
                  disabled={isLoading}
                />
                <label htmlFor="privacyAccepted" className="text-sm text-white/70">
                  Accetto la{' '}
                  <Link href="/privacy" target="_blank" className="text-magic-mystic hover:text-magic-gold underline">
                    Privacy Policy
                  </Link>{' '}
                  * (obbligatorio)
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="marketingOptIn"
                  name="marketingOptIn"
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-magic-purple focus:ring-magic-purple/50"
                  disabled={isLoading}
                />
                <label htmlFor="marketingOptIn" className="text-sm text-white/70">
                  Desidero ricevere comunicazioni su eventi e novità (opzionale)
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !firstName.trim() || !lastName.trim() || !privacyAccepted}
              className="btn-magic w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <span>Continua</span>
                )}
              </span>
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              I tuoi dati personali sono trattati secondo la nostra Privacy Policy.
              Puoi consultare anche i{' '}
              <Link href="/terms" target="_blank" className="text-magic-mystic/70 hover:text-magic-gold underline">
                Regolamenti
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
