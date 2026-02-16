'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icon } from '@/components/ui/icon';

export default function SetupAliasPage() {
  const [alias, setAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, update } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate alias
    const trimmedAlias = alias.trim();
    if (trimmedAlias.length < 3) {
      setError('L\'alias deve avere almeno 3 caratteri.');
      setIsLoading(false);
      return;
    }

    if (trimmedAlias.length > 30) {
      setError('L\'alias non può superare i 30 caratteri.');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmedAlias)) {
      setError('L\'alias può contenere solo lettere, numeri, underscore, trattini e punti.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/alias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alias: trimmedAlias }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Si è verificato un errore.');
        setIsLoading(false);
        return;
      }

      // Update session with new alias
      await update({ alias: trimmedAlias });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
      setIsLoading(false);
    }
  };

  // Generate random alias suggestions
  const suggestions = [
    'MysticWizard',
    'ShadowMage',
    'StarDancer',
    'MoonWalker',
    'FirePhoenix',
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a]" />
      <div className="absolute inset-0 bg-stars opacity-40" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-magic-purple/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-magic-gold/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="card-magic">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 animate-float"><Icon name="Theater" size="2xl" className="text-magic-gold w-14 h-14" /></div>
            <h1 className="font-cinzel text-3xl font-bold glow-text mb-3">
              Scegli il tuo Alias
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Questo sarà il tuo nome pubblico nelle classifiche e durante gli eventi. 
              Sceglilo con cura, non potrai cambiarlo facilmente!
            </p>
          </div>

          {/* Welcome Message */}
          {session?.user?.email && (
            <div className="mb-6 p-4 rounded-xl bg-magic-purple/10 border border-magic-purple/20 text-center">
              <p className="text-magic-mystic text-sm">
                Benvenuto/a, <span className="text-white font-medium">{session.user.email}</span>!
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="alias" className="block text-sm font-medium text-white/70 mb-2">
                Il tuo Alias (Stage Name)
              </label>
              <input
                id="alias"
                name="alias"
                type="text"
                required
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="es. MysticWizard"
                className="input-magic text-lg"
                disabled={isLoading}
                autoComplete="off"
                autoFocus
                minLength={3}
                maxLength={30}
              />
              <p className="mt-2 text-white/40 text-xs">
                3-30 caratteri. Solo lettere, numeri, underscore (_), trattini (-) e punti (.)
              </p>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-white/50 text-xs mb-2">Suggerimenti:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setAlias(suggestion)}
                    className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/60 hover:border-magic-mystic/50 hover:text-magic-mystic transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || alias.trim().length < 3}
              className="btn-magic w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <Icon name="MagicWand" size="sm" />
                    <span>Conferma Alias</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Preview */}
          {alias.trim().length >= 3 && (
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/50 text-xs mb-2">Anteprima in classifica:</p>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-magic-purple/20 to-magic-mystic/20 border border-magic-purple/30">
                <Icon name="Trophy" size="md" className="text-magic-gold" />
                <span className="font-semibold text-lg text-white">{alias.trim()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Decorative */}
        <div className="flex justify-center gap-4 mt-8 text-white/20">
          <Icon name="Sparkle" size="xs" />
          <Icon name="Sparkle" size="xs" />
          <Icon name="Sparkle" size="xs" />
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
