'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Theater, Timer, Users, Sparkles, FileEdit, AlertTriangle, Clock, Ban, Camera, Check, ArrowLeft } from '@/lib/ui/icons';

export default function OpenMagicStagePage() {
  return (
    <div className="min-h-screen bg-magic-dark">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-magic-purple/20 to-transparent py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-cinzel text-5xl md:text-6xl text-magic-gold mb-4 glow-text">
            Palco Aperto Magico
          </h1>
          <p className="text-2xl text-magic-mystic mb-6 font-semibold">
            Il palco dove le idee prendono forma
          </p>
          <div className="text-white/80 leading-relaxed max-w-3xl mx-auto">
            <p>
              Il Palco Aperto Magico è uno spazio dedicato ai maghi emergenti e professionisti che desiderano 
              testare nuove routine, sperimentare effetti inediti e condividere la loro arte con un pubblico appassionato. 
              Un format open-mic che celebra l&apos;illusionismo in tutte le sue forme, creando connessioni autentiche tra 
              performer e spettatori. Ogni serata è un&apos;opportunità per crescere, imparare e far parte di una community 
              magica locale in continua espansione. Salire sul palco significa contribuire alla leaderboard globale 
              Magic-Farm e lasciare il segno nella storia della magia locale.
            </p>
          </div>
        </div>
      </section>

      {/* What Is It Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-magic">
            <h2 className="font-cinzel text-3xl text-magic-gold mb-6">Cos&apos;è</h2>
            <div className="space-y-4 text-white/80">
              <div className="flex items-start gap-4">
                <Theater className="w-6 h-6 text-magic-gold shrink-0" />
                <div>
                  <h3 className="text-magic-mystic font-semibold mb-2">Format Open-Mic per Maghi</h3>
                  <p>Un palco aperto dove ogni mago può esibirsi e condividere la propria arte con il pubblico.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Timer className="w-6 h-6 text-magic-gold shrink-0" />
                <div>
                  <h3 className="text-magic-mystic font-semibold mb-2">Slot da 10 Minuti</h3>
                  <p>Ogni performer ha a disposizione 10 minuti per presentare il proprio numero magico.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Users className="w-6 h-6 text-magic-gold shrink-0" />
                <div>
                  <h3 className="text-magic-mystic font-semibold mb-2">Numero Massimo di Performer</h3>
                  <p>Ogni serata ospita un numero limitato di performer per garantire qualità e coinvolgimento.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-magic-gold shrink-0" />
                <div>
                  <h3 className="text-magic-mystic font-semibold mb-2">Interazione con il Pubblico</h3>
                  <p>Il pubblico è parte integrante dello show, con possibilità di partecipazione diretta ai numeri.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Objectives Section */}
      <section className="py-16 px-6 bg-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="card-magic">
            <h2 className="font-cinzel text-3xl text-magic-gold mb-6">Obiettivi</h2>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <span className="text-magic-mystic text-xl mt-1">•</span>
                <span><strong className="text-magic-gold">Dare spazio a nuovi talenti:</strong> Offrire una piattaforma per maghi emergenti che desiderano farsi conoscere.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-magic-mystic text-xl mt-1">•</span>
                <span><strong className="text-magic-gold">Testare nuovi numeri:</strong> Sperimentare routine inedite in un ambiente accogliente e costruttivo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-magic-mystic text-xl mt-1">•</span>
                <span><strong className="text-magic-gold">Creare community magica locale:</strong> Costruire una rete di appassionati e professionisti dell&apos;illusionismo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-magic-mystic text-xl mt-1">•</span>
                <span><strong className="text-magic-gold">Alimentare leaderboard globale Magic-Farm:</strong> Ogni esibizione contribuisce al sistema di ranking della piattaforma.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-magic border-magic-gold/30">
            <h2 className="font-cinzel text-3xl text-magic-gold mb-6">Regolamento</h2>
            <div className="space-y-4 text-white/80">
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-magic-mystic font-semibold mb-2 flex items-center gap-2"><FileEdit className="w-4 h-4" /> Materiale Originale</h3>
                <p>È richiesto materiale originale o con diritti autorizzati. Rispetta sempre la proprietà intellettuale.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-magic-mystic font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Sicurezza</h3>
                <p>Nessun numero pericoloso senza preventiva autorizzazione dell&apos;organizzazione.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-magic-mystic font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Rispetto dei Tempi</h3>
                <p>Il limite di 10 minuti deve essere rigorosamente rispettato per garantire spazio a tutti i performer.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-magic-mystic font-semibold mb-2 flex items-center gap-2"><Ban className="w-4 h-4" /> Contenuti Appropriati</h3>
                <p>Divieto assoluto di contenuti offensivi, discriminatori o inappropriati.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-magic-mystic font-semibold mb-2 flex items-center gap-2"><Camera className="w-4 h-4" /> Privacy e Diritti d&apos;Immagine</h3>
                <p>Accettazione del GDPR e liberatoria per l&apos;uso dell&apos;immagine durante l&apos;evento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-magic-purple/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-cinzel text-4xl text-magic-gold mb-4">Candidati come Performer</h2>
            <p className="text-white/70">Compila il modulo per candidarti alla prossima serata del Palco Aperto Magico</p>
          </div>
          <ApplicationForm />
        </div>
      </section>

      {/* Public Booking Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-magic text-center bg-gradient-to-br from-magic-gold/10 to-magic-mystic/10 border-magic-gold/50">
            <h2 className="font-cinzel text-3xl text-magic-gold mb-4">Vuoi Assistere allo Show?</h2>
            <p className="text-white/80 mb-6">
              Prenota il tuo tavolo alla Vecchia Fattoria e vivi un&apos;esperienza magica indimenticabile
            </p>
            <a 
              href="https://pro.pns.sm/32l5slf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-magic inline-block"
            >
              <span>Prenota il tuo tavolo</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className="py-10 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/dashboard" className="text-magic-mystic hover:text-magic-gold transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna alla Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function ApplicationForm() {
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    email: '',
    phone: '',
    description: '',
    videoUrl: '',
    acceptRules: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.acceptRules) {
      setError('Devi accettare il regolamento per candidarti');
      setLoading(false);
      return;
    }

    if (formData.description.length > 300) {
      setError('La descrizione non può superare i 300 caratteri');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/open-stage/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageName: formData.stageName,
          realName: formData.realName,
          email: formData.email,
          phone: formData.phone,
          description: formData.description,
          videoUrl: formData.videoUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l&apos;invio della candidatura');
      } else {
        setSuccess(true);
        setFormData({
          stageName: '',
          realName: '',
          email: '',
          phone: '',
          description: '',
          videoUrl: '',
          acceptRules: false,
        });
      }
    } catch (err) {
      setError('Errore di connessione. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      acceptRules: e.target.checked,
    });
  };

  if (success) {
    return (
      <div className="card-magic text-center bg-green-500/10 border-green-500/30">
        <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-magic-gold font-cinzel text-2xl mb-3">Candidatura Inviata!</h3>
        <p className="text-white/80 mb-4">
          La tua candidatura è stata ricevuta con successo. Ti contatteremo presto via email.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="text-magic-mystic hover:text-magic-gold transition-colors text-sm"
        >
          Invia un&apos;altra candidatura
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-magic space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/80 mb-2 text-sm font-medium">
            Nome d&apos;Arte <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="stageName"
            value={formData.stageName}
            onChange={handleChange}
            className="input-magic w-full"
            placeholder="Il tuo nome artistico"
            required
          />
        </div>

        <div>
          <label className="block text-white/80 mb-2 text-sm font-medium">
            Nome Reale <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="realName"
            value={formData.realName}
            onChange={handleChange}
            className="input-magic w-full"
            placeholder="Nome e cognome"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-white/80 mb-2 text-sm font-medium">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-magic w-full"
            placeholder="tua@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-white/80 mb-2 text-sm font-medium">
            Telefono <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input-magic w-full"
            placeholder="+39 xxx xxx xxxx"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-white/80 mb-2 text-sm font-medium">
          Descrizione del Numero <span className="text-red-400">*</span>
          <span className="text-white/40 text-xs ml-2">
            ({formData.description.length}/300 caratteri)
          </span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input-magic w-full h-32"
          placeholder="Descrivi brevemente il tuo numero magico..."
          maxLength={300}
          required
        />
      </div>

      <div>
        <label className="block text-white/80 mb-2 text-sm font-medium">
          Link Video <span className="text-white/40">(facoltativo)</span>
        </label>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          className="input-magic w-full"
          placeholder="https://youtube.com/..."
        />
        <p className="text-white/40 text-xs mt-1">
          Condividi un video della tua performance (YouTube, Vimeo, ecc.)
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-magic-gold/10 rounded-lg border border-magic-gold/30">
        <input
          type="checkbox"
          id="acceptRules"
          checked={formData.acceptRules}
          onChange={handleCheckboxChange}
          className="mt-1"
          required
        />
        <label htmlFor="acceptRules" className="text-white/80 text-sm cursor-pointer">
          Dichiaro di aver letto e accettato il regolamento del Palco Aperto Magico, 
          incluse le norme sulla sicurezza, il rispetto dei tempi, e acconsento al trattamento 
          dei dati personali secondo il GDPR e all&apos;utilizzo della mia immagine durante l&apos;evento.
        </label>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !formData.acceptRules}
        className="btn-magic w-full disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{loading ? 'Invio in corso...' : 'Invia Candidatura'}</span>
      </button>
    </form>
  );
}
