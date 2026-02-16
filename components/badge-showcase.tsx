'use client';

import { useState, useEffect } from 'react';
import { Trophy, Theater, Star, Handshake, Flame, Sparkles, HelpCircle } from '@/lib/ui/icons';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  awardedAt: string | null;
  reason: string | null;
  eventNight: { id: string; name: string } | null;
}

interface BadgeShowcaseProps {
  compact?: boolean; // Compact view for profile sidebar
}

export function BadgeShowcase({ compact = false }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [newBadges, setNewBadges] = useState<Array<{ name: string; icon: string; reason: string }>>([]);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Load badges
    fetch('/api/badges')
      .then((r) => r.json())
      .then((data) => {
        setBadges(data.badges || []);
        setEarnedCount(data.earnedCount || 0);
        setTotalCount(data.totalCount || 0);
      })
      .catch(() => {});

    // Check for new badges
    fetch('/api/badges/check', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.newlyAwarded?.length > 0) {
          setNewBadges(data.newlyAwarded);
          setShowNewBadge(true);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [...new Set(badges.map((b) => b.category))];
  const filteredBadges = selectedCategory
    ? badges.filter((b) => b.category === selectedCategory)
    : badges;

  const categoryIcons: Record<string, { icon: typeof Trophy; label: string }> = {
    ACHIEVEMENT: { icon: Trophy, label: 'Traguardi' },
    EVENT_TITLE: { icon: Theater, label: 'Titoli di Serata' },
    SPECIAL: { icon: Star, label: 'Speciali' },
    COLLABORATION: { icon: Handshake, label: 'Collaborazione' },
    STREAK: { icon: Flame, label: 'Serie' },
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-magic-gold">Badge</h3>
          <span className="text-xs text-white/40">{earnedCount}/{totalCount}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {badges
            .filter((b) => b.earned)
            .slice(0, 8)
            .map((badge) => (
              <span
                key={badge.id}
                title={`${badge.name}: ${badge.description}`}
                className="text-lg cursor-default hover:scale-125 transition-transform"
              >
                {badge.icon}
              </span>
            ))}
          {earnedCount > 8 && (
            <span className="text-xs text-white/40 self-center">+{earnedCount - 8}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* New badge celebration overlay */}
      {showNewBadge && newBadges.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowNewBadge(false)} />
          <div className="relative card-magic border-magic-gold/50 p-8 text-center max-w-sm animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">{newBadges[0].icon}</div>
            <h3 className="font-cinzel text-xl text-magic-gold glow-text mb-2">
              Nuovo Badge Ottenuto!
            </h3>
            <p className="text-white font-semibold">{newBadges[0].name}</p>
            <p className="text-white/60 text-sm mt-2">{newBadges[0].reason}</p>
            <button
              onClick={() => {
                setNewBadges((prev) => prev.slice(1));
                if (newBadges.length <= 1) setShowNewBadge(false);
              }}
              className="btn-magic text-sm mt-6"
            >
              {newBadges.length > 1 ? <><Sparkles className="w-4 h-4 inline" /> Avanti ({newBadges.length - 1} altri)</> : <><Sparkles className="w-4 h-4 inline" /> Fantastico!</>}
            </button>
          </div>
        </div>
      )}

      {/* Badge grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-magic-gold font-semibold text-lg">I Tuoi Badge</h2>
            <p className="text-white/40 text-xs mt-1">
              {earnedCount} di {totalCount} ottenuti
            </p>
          </div>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-magic-purple to-magic-gold rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              !selectedCategory ? 'bg-magic-purple/30 text-magic-mystic' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Tutti
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                selectedCategory === cat ? 'bg-magic-purple/30 text-magic-mystic' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {(() => {
                const entry = categoryIcons[cat];
                if (!entry) return cat;
                const CatIcon = entry.icon;
                return <><CatIcon className="w-3.5 h-3.5 inline" /> {entry.label}</>;
              })()}
            </button>
          ))}
        </div>

        {/* Badge cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`card-magic text-center p-4 transition-all ${
                badge.earned
                  ? 'border-magic-gold/30 hover:border-magic-gold/50'
                  : 'opacity-40 grayscale'
              }`}
            >
              <div className={`text-4xl mb-2 ${badge.earned ? '' : 'filter blur-[2px]'}`}>
                {badge.earned ? badge.icon : <HelpCircle className="w-10 h-10 text-white/30 mx-auto" />}
              </div>
              <h4 className={`text-sm font-semibold ${badge.earned ? 'text-white' : 'text-white/50'}`}>
                {badge.name}
              </h4>
              <p className="text-white/40 text-xs mt-1 line-clamp-2">{badge.description}</p>
              {badge.earned && badge.awardedAt && (
                <p className="text-magic-gold/60 text-[10px] mt-2">
                  {new Date(badge.awardedAt).toLocaleDateString('it-IT')}
                </p>
              )}
              {badge.eventNight && (
                <p className="text-magic-mystic/60 text-[10px] mt-1 flex items-center justify-center gap-0.5"><Theater className="w-3 h-3" /> {badge.eventNight.name}</p>
              )}
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-8">
            <p className="text-white/30 text-sm">Nessun badge in questa categoria.</p>
          </div>
        )}
      </div>
    </>
  );
}
