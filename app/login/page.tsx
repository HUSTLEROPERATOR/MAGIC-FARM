'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const authError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('email', {
        email,
        redirect: true,
        callbackUrl,
      });

      if (result?.error) {
        setError('Si è verificato un errore. Riprova.');
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a]" />
      <div className="absolute inset-0 bg-stars opacity-40" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-magic-purple/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-magic-mystic/15 rounded-full blur-[100px]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/50 hover:text-magic-gold transition-colors mb-8 group"
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          <span>Torna alla home</span>
        </Link>

        <div className="card-magic">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-float">🔮</div>
            <h1 className="font-cinzel text-3xl font-bold glow-text mb-2">
              Accedi
            </h1>
            <p className="text-white/60 text-sm">
              Inserisci la tua email per ricevere un Magic Link
            </p>
          </div>

          {/* Error Messages */}
          {(error || authError) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center">
              {error || getErrorMessage(authError)}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="il-tuo-nome@email.com"
                className="input-magic"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-magic w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Invio in corso...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Invia Magic Link</span>
                    <span>✨</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/40 text-xs text-center leading-relaxed">
              Ti invieremo un link magico alla tua email. 
              Clicca sul link per accedere automaticamente. 
              Nessuna password da ricordare! ✨
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-4 mt-8 text-white/20">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
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

function getErrorMessage(error: string | null): string {
  switch (error) {
    case 'Configuration':
      return 'Errore di configurazione del server.';
    case 'AccessDenied':
      return 'Accesso negato.';
    case 'Verification':
      return 'Il link è scaduto o non valido. Richiedi un nuovo link.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
    case 'EmailCreateAccount':
    case 'Callback':
      return 'Si è verificato un errore durante l\'accesso.';
    case 'OAuthAccountNotLinked':
      return 'Questa email è già associata a un altro account.';
    case 'EmailSignin':
      return 'Impossibile inviare l\'email. Riprova.';
    case 'CredentialsSignin':
      return 'Credenziali non valide.';
    case 'SessionRequired':
      return 'Devi effettuare l\'accesso per visualizzare questa pagina.';
    default:
      return 'Si è verificato un errore. Riprova.';
  }
}
