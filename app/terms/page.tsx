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
          <h1 className="font-cinzel text-3xl font-bold glow-text mb-2">Termini di Servizio</h1>
          <p className="text-white/40 text-sm mb-8">
            Versione 2.0 &mdash; Ultimo aggiornamento: 13 febbraio 2026
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Oggetto del Servizio</h2>
          <p className="text-white/70 leading-relaxed">
            I presenti Termini di Servizio regolano l&apos;utilizzo della piattaforma di gioco interattivo
            gestita da <strong className="text-white">RVF SNC di Contu</strong> (di seguito &ldquo;il Gestore&rdquo;).
            La piattaforma consente la partecipazione a serate evento basate su enigmi e sfide di gruppo.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Regole di Utilizzo</h2>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>La registrazione richiede un indirizzo email valido e l&apos;accettazione della Privacy Policy.</li>
            <li>Ogni utente può possedere un solo account.</li>
            <li>L&apos;alias scelto deve essere appropriato e non offensivo.</li>
            <li>L&apos;accesso al gioco avviene tramite codice evento fornito durante la serata.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Comportamento e Fair Play</h2>
          <p className="text-white/70 leading-relaxed">
            I partecipanti si impegnano a mantenere un comportamento corretto e rispettoso.
            In particolare è vietato:
          </p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Utilizzare strumenti automatici, bot o script per rispondere agli enigmi</li>
            <li>Condividere risposte con tavoli non alleati</li>
            <li>Manipolare il sistema di punteggio o sfruttare vulnerabilità tecniche</li>
            <li>Pubblicare contenuti offensivi, diffamatori o inappropriati nella Clue Board</li>
            <li>Creare account multipli per ottenere vantaggi</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Divieto di Abuso</h2>
          <p className="text-white/70 leading-relaxed">
            Il sistema include misure automatiche anti-cheat e di rate limiting. Qualsiasi tentativo
            di abuso, interferenza o accesso non autorizzato alla piattaforma è severamente vietato
            e potrà comportare le conseguenze previste al punto 7.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Proprietà dei Contenuti</h2>
          <p className="text-white/70 leading-relaxed">
            Tutti i contenuti del gioco (enigmi, testi narrativi, grafica, struttura delle serate)
            sono di proprietà esclusiva del Gestore e sono protetti dalle leggi sul diritto d&apos;autore.
            È vietata la riproduzione, distribuzione o pubblicazione dei contenuti senza autorizzazione scritta.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Limitazioni di Responsabilità</h2>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Il servizio è fornito &ldquo;così com&apos;è&rdquo; senza garanzie di disponibilità continua.</li>
            <li>Il Gestore non è responsabile per interruzioni tecniche, malfunzionamenti temporanei
                o perdita di dati di gioco dovuta a cause di forza maggiore.</li>
            <li>Le classifiche e i punteggi hanno valore esclusivamente ludico e non commerciale.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Sospensione e Chiusura Account</h2>
          <p className="text-white/70 leading-relaxed">
            Il Gestore si riserva il diritto di sospendere temporaneamente o chiudere definitivamente
            l&apos;account di un utente in caso di:
          </p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Violazione dei presenti Termini di Servizio</li>
            <li>Comportamento scorretto o abusivo reiterato</li>
            <li>Tentativi di manipolazione del sistema</li>
          </ul>
          <p className="text-white/70 leading-relaxed mt-2">
            La sospensione verrà comunicata all&apos;utente con indicazione della motivazione.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Modifiche ai Termini</h2>
          <p className="text-white/70 leading-relaxed">
            Il Gestore può aggiornare i presenti Termini in qualsiasi momento.
            In caso di modifiche sostanziali, l&apos;utente sarà invitato a prenderne visione.
            La versione corrente e la data di aggiornamento sono indicate in cima a questo documento.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Contatti</h2>
          <p className="text-white/70 leading-relaxed">
            Per qualsiasi domanda relativa ai presenti Termini, scrivi a{' '}
            <a href="mailto:privacy@vecchiafattoriacagliari.com" className="text-magic-mystic underline">
              privacy@vecchiafattoriacagliari.com
            </a>.
          </p>
        </div>
      </div>
    </main>
  );
}
