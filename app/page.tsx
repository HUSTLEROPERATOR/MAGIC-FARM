import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { MagicWand, Sparkles, Target, Handshake, BookOpen, Sparkle as SparkleIcon } from '@/lib/ui/icons';
import { Icon } from '@/components/ui/icon';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is logged in, redirect through the onboarding flow
  if (session?.user) {
    if (!session.user.onboardingComplete) {
      redirect('/onboarding');
    }
    if (!session.user.alias) {
      redirect('/setup-alias');
    }
    redirect('/dashboard');
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a]" />
      <div className="absolute inset-0 bg-stars opacity-50" />
      
      {/* Animated Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-magic-purple/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-magic-mystic/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-magic-gold/5 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 animate-float">
          <Icon name="MagicWand" size="3xl" className="text-magic-gold drop-shadow-[0_0_30px_rgba(212,175,55,0.5)] w-20 h-20 md:w-28 md:h-28" />
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-wider">
          <span className="glow-text">MAGIC</span>
          <span className="text-white/90"> FARM</span>
        </h1>

        {/* Subtitle */}
        <p className="text-magic-mystic/80 text-lg md:text-xl mb-2 tracking-[0.3em] uppercase">
          Where Magic Meets Competition
        </p>

        {/* Decorative Line */}
        <div className="flex items-center justify-center gap-4 my-8">
          <div className="h-px w-20 md:w-32 bg-gradient-to-r from-transparent via-magic-gold/50 to-transparent" />
          <Icon name="Sparkle" size="sm" className="text-magic-gold" />
          <div className="h-px w-20 md:w-32 bg-gradient-to-r from-transparent via-magic-gold/50 to-transparent" />
        </div>

        {/* Description */}
        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          Entra nel mondo misterioso di Magic Farm. Competi, collabora e scopri i segreti che si celano dietro ogni serata evento.
        </p>

        {/* CTA Button */}
        <Link href="/login" className="btn-magic group">
          <span className="flex items-center gap-3">
            <Icon name="Sparkles" size="md" className="transition-transform group-hover:rotate-12" />
            <span className="tracking-wide">Entra nel Magic</span>
            <Icon name="Sparkles" size="md" className="transition-transform group-hover:-rotate-12" />
          </span>
        </Link>

        {/* Features Teaser */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center p-4">
            <div className="mb-3"><Icon name="Target" size="xl" className="text-magic-gold" /></div>
            <h3 className="text-magic-gold font-semibold mb-1">Compete</h3>
            <p className="text-white/50 text-sm">Sfida altri maghi in competizioni avvincenti</p>
          </div>
          <div className="text-center p-4">
            <div className="mb-3"><Icon name="Handshake" size="xl" className="text-magic-gold" /></div>
            <h3 className="text-magic-gold font-semibold mb-1">Collabora</h3>
            <p className="text-white/50 text-sm">Forma alleanze strategiche con altri tavoli</p>
          </div>
          <div className="text-center p-4">
            <div className="mb-3"><Icon name="BookOpen" size="xl" className="text-magic-gold" /></div>
            <h3 className="text-magic-gold font-semibold mb-1">Impara</h3>
            <p className="text-white/50 text-sm">Accedi alla libreria di contenuti esclusivi</p>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-magic-dark to-transparent" />
    </main>
  );
}
