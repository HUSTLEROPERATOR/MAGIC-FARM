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
          <h1 className="font-cinzel text-3xl font-bold glow-text mb-2">Informativa sulla Privacy</h1>
          <p className="text-white/40 text-sm mb-8">
            Versione 2.0 &mdash; Ultimo aggiornamento: 13 febbraio 2026
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Titolare del Trattamento</h2>
          <p className="text-white/70 leading-relaxed">
            Il Titolare del trattamento dei dati personali è <strong className="text-white">RVF SNC di Contu</strong> (P.IVA e sede legale in corso di registrazione).
          </p>
          <p className="text-white/70 leading-relaxed mt-2">
            <strong className="text-white">Referente privacy:</strong> Nicola Contu
            <br />
            Email:{' '}
            <a href="mailto:privacy@vecchiafattoriacagliari.com" className="text-magic-mystic underline">
              privacy@vecchiafattoriacagliari.com
            </a>
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Tipologie di Dati Raccolti</h2>
          <p className="text-white/70 leading-relaxed">Raccogliamo le seguenti categorie di dati:</p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Indirizzo email (per autenticazione via Magic Link)</li>
            <li>Alias pubblico (scelto dall&apos;utente per le classifiche)</li>
            <li>Log di accesso con hash dell&apos;indirizzo IP (non conserviamo l&apos;IP in chiaro)</li>
            <li>Dati di gioco: punteggi, risposte inviate, suggerimenti richiesti, tempi di risposta</li>
            <li>Audit log delle azioni rilevanti (login, consensi, invii risposte)</li>
            <li>Dati tecnici necessari al funzionamento del servizio (user-agent, token di sessione)</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Finalità del Trattamento</h2>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Erogazione del gioco e gestione della serata evento</li>
            <li>Sicurezza dell&apos;applicazione e prevenzione di abusi</li>
            <li>Assistenza agli utenti</li>
            <li>Adempimenti tecnici necessari al funzionamento della piattaforma</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Base Giuridica</h2>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-white/90">Esecuzione del servizio</strong> (Art. 6(1)(b) GDPR): il trattamento è necessario
              per l&apos;erogazione del gioco e delle funzionalità richieste dall&apos;utente.
            </li>
            <li>
              <strong className="text-white/90">Legittimo interesse</strong> (Art. 6(1)(f) GDPR): sicurezza della piattaforma,
              prevenzione frodi, audit logging.
            </li>
            <li>
              <strong className="text-white/90">Obblighi di legge</strong> (Art. 6(1)(c) GDPR): ove applicabili, per adempimenti
              normativi.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Conservazione dei Dati</h2>
          <p className="text-white/70 leading-relaxed">
            I dati personali dell&apos;account sono conservati per tutta la durata del rapporto con l&apos;utente.
            In caso di richiesta di cancellazione, i dati vengono anonimizzati o eliminati entro 30 giorni.
          </p>
          <p className="text-white/70 leading-relaxed mt-2">
            I log di audit e i dati di sicurezza possono essere conservati per un periodo più lungo
            (fino a 12 mesi dalla generazione) per finalità di sicurezza e prevenzione abusi,
            in base al legittimo interesse del Titolare.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Destinatari e Fornitori</h2>
          <p className="text-white/70 leading-relaxed">
            I dati possono essere trattati dai seguenti soggetti terzi, in qualità di responsabili del
            trattamento, limitatamente a quanto necessario per il funzionamento del servizio:
          </p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Provider di hosting e infrastruttura cloud</li>
            <li>Provider email per l&apos;invio dei Magic Link di autenticazione</li>
            <li>Provider di database hosting</li>
          </ul>
          <p className="text-white/70 leading-relaxed mt-2">
            L&apos;elenco aggiornato dei fornitori è disponibile su richiesta contattando il referente privacy.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Diritti dell&apos;Interessato</h2>
          <p className="text-white/70 leading-relaxed">
            Ai sensi degli articoli 15-22 del GDPR, hai diritto di:
          </p>
          <ul className="text-white/70 space-y-1 list-disc list-inside">
            <li>Accesso ai tuoi dati personali</li>
            <li>Rettifica dei dati inesatti</li>
            <li>Cancellazione dei dati (&ldquo;diritto all&apos;oblio&rdquo;)</li>
            <li>Limitazione del trattamento</li>
            <li>Opposizione al trattamento</li>
            <li>Portabilità dei dati in formato strutturato</li>
          </ul>
          <p className="text-white/70 leading-relaxed mt-2">
            Per esercitare i tuoi diritti, scrivi a{' '}
            <a href="mailto:privacy@vecchiafattoriacagliari.com" className="text-magic-mystic underline">
              privacy@vecchiafattoriacagliari.com
            </a>.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Reclamo al Garante</h2>
          <p className="text-white/70 leading-relaxed">
            Hai il diritto di proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali
            (
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-magic-mystic underline"
            >
              www.garanteprivacy.it
            </a>
            ) qualora ritenga che il trattamento dei tuoi dati violi il GDPR.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">9. Cookie</h2>
          <p className="text-white/70 leading-relaxed">
            Utilizziamo esclusivamente cookie tecnici necessari per l&apos;autenticazione (session token).
            Non utilizziamo cookie di profilazione né cookie di terze parti.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">10. Modifiche alla presente Informativa</h2>
          <p className="text-white/70 leading-relaxed">
            Il Titolare si riserva il diritto di aggiornare la presente informativa. La versione
            corrente e la data di ultimo aggiornamento sono sempre indicate in cima a questo documento.
            In caso di modifiche sostanziali, l&apos;utente sarà invitato a prenderne visione e ad
            esprimere nuovamente il proprio consenso ove necessario.
          </p>
        </div>
      </div>
    </main>
  );
}
