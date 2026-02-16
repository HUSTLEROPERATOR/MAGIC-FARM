import Link from 'next/link';
import { Mail, Sparkles, CrystalBall, Timer, Lock, Sparkle, ArrowLeft } from '@/lib/ui/icons';

export default function VerifyRequestPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a]" />
      <div className="absolute inset-0 bg-stars opacity-40" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-magic-gold/10 rounded-full blur-[150px]" />

      {/* Content Card */}
      <div className="relative z-10 w-full max-w-md text-center">
        <div className="card-magic py-12">
          {/* Animated Envelope */}
          <div className="relative mb-8 flex justify-center">
            <Mail className="w-16 h-16 text-magic-gold animate-float" />
            <Sparkles className="w-8 h-8 text-magic-gold absolute -top-2 -right-2 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-3xl font-bold glow-text mb-4">
            Controlla la tua Email
          </h1>

          {/* Message */}
          <p className="text-white/70 text-base leading-relaxed mb-2">
            Ti abbiamo inviato un <span className="text-magic-mystic font-semibold">Magic Link</span>!
          </p>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Clicca sul link nell&apos;email per accedere a Magic Farm. 
            Il link scadrà tra 24 ore.
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 my-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-magic-gold/30" />
            <CrystalBall className="w-5 h-5 text-magic-gold" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-magic-gold/30" />
          </div>

          {/* Tips */}
          <div className="text-left space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
            <p className="text-white/60 text-sm flex items-start gap-3">
              <Mail className="w-4 h-4 text-magic-gold shrink-0 mt-0.5" />
              <span>Controlla anche la cartella <strong className="text-white/80">spam</strong> o <strong className="text-white/80">promozioni</strong>.</span>
            </p>
            <p className="text-white/60 text-sm flex items-start gap-3">
              <Timer className="w-4 h-4 text-magic-gold shrink-0 mt-0.5" />
              <span>L&apos;email potrebbe impiegare qualche minuto ad arrivare.</span>
            </p>
            <p className="text-white/60 text-sm flex items-start gap-3">
              <Lock className="w-4 h-4 text-magic-gold shrink-0 mt-0.5" />
              <span>Il link è valido per un solo utilizzo.</span>
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link 
              href="/login"
              className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Usa un&apos;altra email</span>
            </Link>
          </div>
        </div>

        {/* Decorative */}
        <div className="flex justify-center gap-4 mt-8 text-white/20">
          <Sparkle className="w-3 h-3" />
          <Sparkle className="w-3 h-3" />
          <Sparkle className="w-3 h-3" />
        </div>
      </div>
    </main>
  );
}
