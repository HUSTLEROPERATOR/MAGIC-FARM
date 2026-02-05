import Link from 'next/link';

export default function PrivacyPage() {
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
          <h1 className="font-cinzel text-3xl font-bold glow-text mb-2">Privacy Policy</h1>
          <p className="text-white/40 text-sm mb-8">Versione 1.0 &mdash; Ultimo aggiornamento: Febbraio 2026</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Titolare del Trattamento</h2>
          <p className="text-white/70 leading-relaxed">
            Il titolare del trattamento dei dati è Magic Farm (&quot;Noi&quot;, &quot;Nostro&quot;).
            Per qualsiasi richiesta relativa alla privacy, contattaci all&apos;indirizzo email indicato nell&apos;applicazione.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Dati Raccolti</h2>
          <p className="text-white/70 leading-relaxed">Raccogliamo i seguenti dati:</p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Indirizzo email (per autenticazione via Magic Link)</li>
            <li>Nome e cognome (forniti durante l&apos;onboarding)</li>
            <li>Alias pubblico (scelto dall&apos;utente per le classifiche)</li>
            <li>Consensi espressi (privacy e marketing) con hash di evidenza</li>
            <li>Dati di gioco: punteggi, risposte, tempi di risposta</li>
            <li>Log di audit con hash IP (non memorizziamo l&apos;IP in chiaro)</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Finalità del Trattamento</h2>
          <p className="text-white/70 leading-relaxed">
            I dati vengono utilizzati per: autenticazione sicura, gestione del profilo utente,
            funzionamento delle competizioni, generazione delle classifiche, e sicurezza dell&apos;applicazione.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Base Giuridica</h2>
          <p className="text-white/70 leading-relaxed">
            Il trattamento si basa sul consenso esplicito dell&apos;utente (Art. 6(1)(a) GDPR)
            e sull&apos;esecuzione del servizio richiesto (Art. 6(1)(b) GDPR).
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Conservazione dei Dati</h2>
          <p className="text-white/70 leading-relaxed">
            I dati personali sono conservati per la durata dell&apos;account. In caso di cancellazione
            dell&apos;account, i dati vengono anonimizzati o eliminati entro 30 giorni, ad eccezione
            dei log di audit che vengono conservati per motivi di sicurezza.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Diritti dell&apos;Utente</h2>
          <p className="text-white/70 leading-relaxed">
            Hai il diritto di accesso, rettifica, cancellazione, limitazione del trattamento,
            portabilità dei dati e opposizione al trattamento, secondo il GDPR.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Sicurezza</h2>
          <p className="text-white/70 leading-relaxed">
            Utilizziamo misure tecniche e organizzative per proteggere i tuoi dati, tra cui:
            hashing delle password e degli IP, crittografia dei dati sensibili, rate limiting,
            e audit logging completo.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Cookie</h2>
          <p className="text-white/70 leading-relaxed">
            Utilizziamo solo cookie tecnici necessari per l&apos;autenticazione (session token JWT).
            Non utilizziamo cookie di profilazione o di terze parti.
          </p>
        </div>
      </div>
    </main>
  );
}
