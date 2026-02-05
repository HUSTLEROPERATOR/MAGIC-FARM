import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-magic-dark via-magic-dark to-[#0d051a] -z-10" />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-magic-gold transition-colors mb-8 group"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
          <span>Torna indietro</span>
        </Link>

        <div className="card-magic prose prose-invert max-w-none">
          <h1 className="font-cinzel text-3xl font-bold glow-text mb-2">Regolamento Evento</h1>
          <p className="text-white/40 text-sm mb-8">Ultimo aggiornamento: Febbraio 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Partecipazione</h2>
          <p className="text-white/70 leading-relaxed">
            La partecipazione agli eventi Magic Farm è aperta a tutti gli utenti registrati
            che hanno completato l&apos;onboarding e accettato la Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Tavoli e Collaborazione</h2>
          <p className="text-white/70 leading-relaxed">
            I partecipanti vengono assegnati a tavoli. La collaborazione all&apos;interno del tavolo
            è incoraggiata. Le alleanze tra tavoli seguono le regole specifiche di ogni round.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Punteggio</h2>
          <p className="text-white/70 leading-relaxed">
            Il punteggio si basa su: correttezza della risposta (100 punti base),
            velocità di risoluzione (fino a 50 punti bonus), suggerimenti utilizzati
            (penalità di 10 punti ciascuno) e tentativi effettuati (penalità di 5 punti
            dopo il primo).
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Fair Play</h2>
          <p className="text-white/70 leading-relaxed">
            È vietato l&apos;uso di strumenti automatici, la condivisione di risposte tra tavoli
            non alleati, e qualsiasi forma di manipolazione del gioco. Il sistema anti-cheat
            monitora automaticamente le attività sospette.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Classifiche</h2>
          <p className="text-white/70 leading-relaxed">
            Le classifiche sono calcolate in tempo reale. In caso di parità di punteggio,
            il tempo medio di risoluzione determina la posizione. L&apos;alias pubblico scelto
            durante la registrazione viene visualizzato nelle classifiche.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Condotta</h2>
          <p className="text-white/70 leading-relaxed">
            I messaggi nella Clue Board devono essere rispettosi. I moderatori possono
            nascondere messaggi inappropriati. Violazioni ripetute possono portare alla
            sospensione dall&apos;evento.
          </p>
        </div>
      </div>
    </main>
  );
}
