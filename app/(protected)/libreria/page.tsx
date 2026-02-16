import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { BookOpen, FileText, Puzzle, ScrollText, Sparkles, MagicWand, Lock, CrystalBall, ExternalLink, ArrowLeft } from '@/lib/ui/icons';
import type { LucideIcon } from '@/lib/ui/icons';

export default async function LibreriaPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const items = await prisma.libraryEntry.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
  });

  // Check which events the user has attended (for unlockable content)
  let attendedEventIds: string[] = [];
  if (userId) {
    const memberships = await prisma.tableMembership.findMany({
      where: { userId },
      select: { table: { select: { eventNightId: true } } },
    });
    attendedEventIds = [...new Set(memberships.map(m => m.table.eventNightId))];
  }

  // Separate and process entries
  const processedItems = items.map(item => {
    const isLocked = item.entryType === 'LOCKED' && item.requiresEventId
      ? !attendedEventIds.includes(item.requiresEventId)
      : false;
    return { ...item, isLocked };
  });

  const categories = [...new Set(processedItems.map((i) => i.category))];

  const entryTypeIcons: Record<string, LucideIcon> = {
    ARTICLE: FileText,
    PUZZLE_EXPLAIN: Puzzle,
    HISTORY: ScrollText,
    CURIOSITY: Sparkles,
    TECHNIQUE: MagicWand,
    LOCKED: Lock,
  };

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-10 h-10 text-magic-gold" />
          <h1 className="font-cinzel text-3xl text-magic-gold">Il Grimorio</h1>
        </div>
        <p className="text-white/40 text-sm mb-8 ml-14">
          La tua raccolta di sapere magico. Nuovi frammenti si sbloccano partecipando alle serate.
        </p>

        {processedItems.length === 0 ? (
          <div className="card-magic text-center py-12">
            <BookOpen className="w-12 h-12 text-magic-mystic mx-auto mb-4" />
            <p className="text-white/60 text-lg">Il Grimorio è ancora vuoto.</p>
            <p className="text-white/40 text-sm mt-2">Partecipa alle serate per sbloccare nuovi contenuti!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-magic-mystic font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-magic-mystic/20" />
                  <span>{category}</span>
                  <span className="h-px flex-1 bg-magic-mystic/20" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {processedItems
                    .filter((i) => i.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`card-magic transition-all ${
                          item.isLocked
                            ? 'opacity-50 grayscale border-white/5'
                            : 'hover:border-magic-gold/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {(() => {
                            const IconComp = item.isLocked ? Lock : (entryTypeIcons[item.entryType] || FileText);
                            return <IconComp className="w-5 h-5 text-magic-gold mt-0.5 shrink-0" />;
                          })()}
                          <div className="flex-1">
                            <h3 className="text-magic-gold font-semibold">{item.title}</h3>
                            {item.isLocked ? (
                              <p className="text-white/40 text-sm mt-1 italic flex items-center gap-1">
                                <CrystalBall className="w-4 h-4 shrink-0" /> Partecipa alla serata per sbloccare questo frammento
                              </p>
                            ) : (
                              <>
                                <p className="text-white/60 text-sm mt-1 line-clamp-2">{item.description}</p>
                                {item.entryType !== 'ARTICLE' && (
                                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-magic-purple/10 text-magic-mystic/60">
                                    {item.entryType === 'PUZZLE_EXPLAIN' ? 'Spiegazione Enigma' :
                                     item.entryType === 'HISTORY' ? 'Frammento Storico' :
                                     item.entryType === 'CURIOSITY' ? 'Curiosità' :
                                     item.entryType === 'TECHNIQUE' ? 'Tecnica' : item.entryType}
                                  </span>
                                )}
                              </>
                            )}
                            {item.externalUrl && !item.isLocked && (
                              <a
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-3 text-magic-mystic text-xs hover:text-magic-gold transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 inline" /> Leggi di più →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <a href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
