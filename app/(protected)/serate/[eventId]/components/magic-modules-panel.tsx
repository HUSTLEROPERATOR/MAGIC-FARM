'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, MagicWand, ScrollText, FileText, Check, X, RefreshCw } from '@/lib/ui/icons';
import type { LucideIcon } from '@/lib/ui/icons';
import { MagicianControlPanel } from '@/components/modules/MagicianControlPanel';

interface ActiveModule {
  key: string;
  meta: {
    name: string;
    playerLabel?: string;
    description: string;
    icon: string;
    difficulty: string;
    scope: string;
    priority: number;
    magicianControlled?: boolean;
  };
  config: Record<string, unknown>;
  eventModuleId: string;
  globallyDisabled: boolean;
}

interface ExecuteResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  code?: string;
}

interface MagicModulesPanelProps {
  eventId: string;
  activeRoundId: string | null;
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  CrystalBall: Sparkles,
  ScrollText: ScrollText,
  FileText: FileText,
};

const SpinIcon = RefreshCw;

// --- Magician Control Field Mappings ---
const MAGICIAN_CONTROL_FIELDS: Record<string, Array<{
  name: string;
  type: 'text' | 'number' | 'select' | 'action';
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
}>> = {
  TWENTY_ONE_CARDS: [
    { name: 'columnChoice', type: 'select', label: 'Colonna (sinistra/centro/destra)', options: ['0', '1', '2'] },
  ],
  ACAAN_DYNAMIC: [
    { name: 'namedCard', type: 'text', label: 'Carta nominata', placeholder: 'es. 7 di Cuori' },
    { name: 'namedPosition', type: 'number', label: 'Posizione (1-52)', min: 1, max: 52 },
  ],
  PSYCHOLOGICAL_FORCE_CARD: [
    { name: 'chosenCard', type: 'text', label: 'Carta pensata dal pubblico', placeholder: 'es. 7 di Cuori' },
  ],
  MAGICIANS_CHOICE_4: [
    { name: 'chosen', type: 'select', label: 'Carta/e selezionata/e', options: ['0', '1', '2', '3'] },
  ],
  CLOCK_FORCE: [
    { name: 'position', type: 'number', label: 'Posizione orologio (1-12)', min: 1, max: 12 },
  ],
  SEALED_ENVELOPE_DIGITAL: [
    { name: 'action', type: 'action', label: '🔒 Mostra Sigillo' },
    { name: 'reveal', type: 'action', label: '📖 Rivela Predizione' },
    { name: 'chosenCard', type: 'text', label: 'Carta scelta (opzionale)', placeholder: 'Lascia vuoto se non serve' },
  ],
  PREDICTION_HASH: [
    { name: 'get_hash', type: 'action', label: '🔐 Mostra Hash' },
    { name: 'reveal', type: 'action', label: '🔓 Rivela Previsione' },
  ],
  BIRTHDAY_CARD_FORCE: [
    { name: 'day', type: 'number', label: 'Giorno di nascita', min: 1, max: 31 },
    { name: 'month', type: 'number', label: 'Mese di nascita', min: 1, max: 12 },
  ],
  SHARED_IMPOSSIBLE_CARD: [
    { name: 'get_assignment', type: 'action', label: '🎴 Assegna Carta al Tavolo' },
    { name: 'reveal_combination', type: 'action', label: '✨ Rivela Combinazione' },
    { name: 'tableIndex', type: 'number', label: 'Indice tavolo', min: 0, max: 10 },
  ],
  INVISIBLE_DECK_DIGITAL: [
    { name: 'namedCard', type: 'text', label: 'Carta nominata', placeholder: 'es. Asso di Picche' },
  ],
  MULTILEVEL_PREDICTION: [
    { name: 'chosenSeme', type: 'select', label: 'Seme', options: ['Picche', 'Cuori', 'Quadri', 'Fiori'] },
    { name: 'chosenValore', type: 'select', label: 'Valore', options: ['Asso', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Fante', 'Regina', 'Re'] },
    { name: 'chosenColore', type: 'select', label: 'Colore', options: ['rosso', 'nero'] },
    { name: 'chosenPosizione', type: 'number', label: 'Posizione (1-52)', min: 1, max: 52 },
  ],
  FIRMA_SIGILLATA: [
    { name: 'get_commit', type: 'action', label: '🔐 Mostra Commit Hash' },
    { name: 'submit_thought', type: 'action', label: '💭 Invia Pensiero Pubblico' },
    { name: 'thought', type: 'text', label: 'Pensiero (per submit)', placeholder: 'Es. Sette di Cuori' },
  ],
};

function difficultyLabel(d: string) {
  if (d === 'base') return { label: 'Base', cls: 'text-green-400 bg-green-500/15' };
  if (d === 'intermedio') return { label: 'Intermedio', cls: 'text-yellow-400 bg-yellow-500/15' };
  return { label: 'Avanzato', cls: 'text-red-400 bg-red-500/15' };
}

// --- CARD_PREDICTION_BINARY ---
function CardPredictionUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function choose(choice: string) {
    setLoading(choice);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { choice } }),
      });
      const data = await res.json();
      onDone(res.ok ? data.result : { success: false, error: data.error });
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-white/50 text-xs">Scegli il colore della carta:</p>
      <div className="flex gap-2">
        <button
          onClick={() => choose('rosso')}
          disabled={!!loading}
          className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm font-medium disabled:opacity-40 transition-colors"
        >
          {loading === 'rosso' ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '♥ Rosso'}
        </button>
        <button
          onClick={() => choose('nero')}
          disabled={!!loading}
          className="flex-1 py-2 rounded-lg bg-zinc-700/40 text-zinc-300 hover:bg-zinc-700/60 text-sm font-medium disabled:opacity-40 transition-colors"
        >
          {loading === 'nero' ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '♠ Nero'}
        </button>
      </div>
    </div>
  );
}

// --- EQUIVOQUE_GUIDED ---
const EQUIVOQUE_CHOICES = [
  ['Luna', 'Stelle', 'Sole'],
  ['Fuoco', 'Acqua', 'Terra'],
  ['Cuore', 'Spada', 'Moneta'],
];

function EquivoqueUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const choices = EQUIVOQUE_CHOICES[step] ?? ['A', 'B', 'C'];

  async function choose(choice: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step, choice } }),
      });
      const data = await res.json();
      const result: ExecuteResult = res.ok ? data.result : { success: false, error: data.error };
      if (res.ok && data.result?.data?.isLastStep === false) {
        setStep((s) => s + 1);
      } else {
        onDone(result);
      }
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-white/50 text-xs">Passo {step + 1}/3 — Scegli istintivamente:</p>
      <div className="flex gap-2">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => choose(c)}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm disabled:opacity-40 transition-colors"
          >
            {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : c}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- MATHEMATICAL_FORCE_27 ---
function MathForce27UI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [step, setStep] = useState(-1); // -1 = not started
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  async function callStep(s: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step: s, value: 0 } }),
      });
      const data = await res.json();
      if (!res.ok) {
        onDone({ success: false, error: data.error });
        return;
      }
      const d = data.result?.data ?? {};
      if (d.reveal) {
        onDone(data.result); // ResultDisplay shows the reveal card
      } else {
        setInstruction(d.instruction as string);
        setStep(d.nextStep as number);
      }
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  if (step === -1) {
    return (
      <button
        onClick={() => callStep(0)}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors"
      >
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Inizia l\'Incantesimo'}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-white/80 text-xs font-medium mb-1">Passo {step}/5</p>
        <p className="text-white text-sm">{instruction}</p>
      </div>
      <button
        onClick={() => callStep(step)}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors"
      >
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : 'Ho fatto → Continua'}
      </button>
    </div>
  );
}

// --- ENVELOPE_PREDICTION ---
function EnvelopeUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: null }),
      });
      const data = await res.json();
      onDone(res.ok ? data.result : { success: false, error: data.error });
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={reveal}
      disabled={loading}
      className="w-full py-2 rounded-lg bg-magic-gold/10 text-magic-gold hover:bg-magic-gold/20 text-sm font-medium disabled:opacity-40 transition-colors"
    >
      {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✉ Apri la Busta Sigillata'}
    </button>
  );
}

// --- Generic step-by-step UI (instruction-based multi-step modules) ---
function GenericStepUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [step, setStep] = useState(-1);
  const [instruction, setInstruction] = useState('');
  const [totalSteps, setTotalSteps] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function callStep(s: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step: s, value: 0 } }),
      });
      const data = await res.json();
      if (!res.ok) { onDone({ success: false, error: data.error }); return; }
      const d = data.result?.data ?? {};
      if (d.reveal || d.isLastStep === true) {
        onDone(data.result);
      } else {
        setInstruction(d.instruction as string);
        const next = d.nextStep as number;
        if (totalSteps === null && typeof d.totalSteps === 'number') setTotalSteps(d.totalSteps);
        setStep(next);
      }
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  if (step === -1) {
    return (
      <button onClick={() => callStep(0)} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Inizia l\'Incantesimo'}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-lg p-3">
        {totalSteps && <p className="text-white/50 text-xs mb-1">Passo {step}/{totalSteps}</p>}
        <p className="text-white text-sm">{instruction}</p>
      </div>
      <button onClick={() => callStep(step)} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : 'Ho fatto → Continua'}
      </button>
    </div>
  );
}

// --- MAGICIANS_CHOICE_4 ---
function MagiciansChoice4UI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [step, setStep] = useState(-1);
  const [cards, setCards] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  async function callAPI(input: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input }),
      });
      const data = await res.json();
      if (!res.ok) { onDone({ success: false, error: data.error }); return; }
      const d = data.result?.data ?? {};
      if (d.isLastStep === true || d.reveal) {
        onDone(data.result);
      } else {
        setInstruction(d.instruction as string);
        if (d.cards) setCards(d.cards as string[]);
        if (d.remaining) setRemaining(d.remaining as number[]);
        setSelected([]);
        setStep(d.nextStep as number);
      }
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  function toggleCard(idx: number) {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : prev.length < 2 ? [...prev, idx] : prev
    );
  }

  if (step === -1) {
    return (
      <button onClick={() => callAPI({ step: 0 })} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Inizia l\'Incantesimo'}
      </button>
    );
  }

  // step === 1: show 4 cards, select 2
  if (step === 1) {
    return (
      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/50 text-xs mb-2">{instruction}</p>
          <p className="text-white/70 text-xs mb-2">Segna le due carte scelte mentalmente:</p>
          <div className="grid grid-cols-2 gap-2">
            {cards.map((card, i) => (
              <button key={i} onClick={() => toggleCard(i)} disabled={loading}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${selected.includes(i) ? 'bg-magic-purple/60 text-white border border-magic-purple' : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'}`}>
                🃏 {card}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => callAPI({ step: 1, chosen: selected })} disabled={loading || selected.length !== 2}
          className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
          {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : `Conferma (${selected.length}/2 selezionate)`}
        </button>
      </div>
    );
  }

  // step === 2: show 2 remaining cards, tap one to eliminate
  if (step === 2) {
    const remainingCards = remaining.map((i) => ({ idx: i, card: cards[i] ?? '?' }));
    return (
      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/50 text-xs mb-2">{instruction}</p>
          <p className="text-white/70 text-xs mb-2">Tocca la carta da eliminare:</p>
          <div className="flex gap-2">
            {remainingCards.map(({ idx, card }) => (
              <button key={idx} onClick={() => callAPI({ step: 2, chosen: idx })} disabled={loading}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/20 transition-colors disabled:opacity-40">
                ✕ {card}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// --- PSYCHOLOGICAL_FORCE_CARD ---
function PsychForceCardUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [stage, setStage] = useState<'idle' | 'phrases' | 'input'>('idle');
  const [phrases, setPhrases] = useState<string[]>([]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [chosenCard, setChosenCard] = useState('');
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step: 0 } }),
      });
      const data = await res.json();
      if (!res.ok) { onDone({ success: false, error: data.error }); return; }
      const d = data.result?.data ?? {};
      setPhrases((d.phrases as string[]) ?? []);
      setPhraseIdx(0);
      setStage('phrases');
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  async function submitCard() {
    if (!chosenCard.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step: 1, chosenCard: chosenCard.trim() } }),
      });
      const data = await res.json();
      onDone(res.ok ? data.result : { success: false, error: data.error });
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  if (stage === 'idle') {
    return (
      <button onClick={start} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '🧠 Inizia Lettura Mentale'}
      </button>
    );
  }

  if (stage === 'phrases') {
    const safePhraseIdx = Math.min(phraseIdx, phrases.length - 1);
    const isLast = safePhraseIdx >= phrases.length - 1;
    return (
      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
          <p className="text-white text-sm text-center italic">&quot;{phrases[safePhraseIdx]}&quot;</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/30 text-xs">{safePhraseIdx + 1}/{phrases.length}</span>
          <button onClick={() => isLast ? setStage('input') : setPhraseIdx((i) => i + 1)} disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium transition-colors">
            {isLast ? 'Ho la carta in mente →' : 'Avanti →'}
          </button>
        </div>
      </div>
    );
  }

  // stage === 'input'
  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-white/50 text-xs mb-2">Qual è la carta che hai pensato?</p>
        <input type="text" value={chosenCard} onChange={(e) => setChosenCard(e.target.value)}
          placeholder="es. 7 di Cuori" disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && submitCard()}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-magic-purple/50" />
      </div>
      <button onClick={submitCard} disabled={loading || !chosenCard.trim()}
        className="w-full py-2 rounded-lg bg-magic-gold/20 text-magic-gold hover:bg-magic-gold/30 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Rivela il Pensiero'}
      </button>
    </div>
  );
}

// --- MULTILEVEL_PREDICTION ---
const SEMI_OPTIONS = ['Picche', 'Cuori', 'Quadri', 'Fiori'];
const VALORI_OPTIONS = ['Asso', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Fante', 'Regina', 'Re'];
const COLORI_OPTIONS = ['Rosso', 'Nero'];

function MultilevelPredictionUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  const [step, setStep] = useState(-1);
  const [instruction, setInstruction] = useState('');
  const [predictions, setPredictions] = useState<Array<{ label: string; match: boolean }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [posInput, setPosInput] = useState('');
  const [loading, setLoading] = useState(false);

  type InputType = 'seme' | 'valore' | 'colore' | 'posizione';
  const inputTypeByStep: Record<number, InputType> = { 1: 'seme', 2: 'valore', 3: 'colore', 4: 'posizione' };

  async function callStep(s: number, extraInput: Record<string, unknown> = {}) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: { step: s, ...extraInput } }),
      });
      const data = await res.json();
      if (!res.ok) { onDone({ success: false, error: data.error }); return; }
      const d = data.result?.data ?? {};
      if (d.isLastStep === true) {
        onDone(data.result);
        return;
      }
      setInstruction(d.instruction as string);
      // Accumulate revealed predictions
      if (d.prediction1 && predictions.length === 0) {
        setPredictions([{ label: d.prediction1 as string, match: !!(d.match1) }]);
      } else if (d.prediction2) {
        setPredictions((p) => [...p.slice(0, 1), { label: d.prediction2 as string, match: !!(d.match2) }]);
      } else if (d.prediction3) {
        setPredictions((p) => [...p.slice(0, 2), { label: d.prediction3 as string, match: !!(d.match3) }]);
      }
      setCurrentInput('');
      setPosInput('');
      setStep(d.nextStep as number);
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  if (step === -1) {
    return (
      <button onClick={() => callStep(0)} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '🔮 Inizia Previsione'}
      </button>
    );
  }

  const inputType = inputTypeByStep[step];

  return (
    <div className="space-y-3">
      {/* Show accumulated predictions */}
      {predictions.length > 0 && (
        <div className="space-y-1">
          {predictions.map((p, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${p.match ? 'bg-green-500/10 text-green-300' : 'bg-magic-gold/10 text-magic-gold'}`}>
              <span>{p.match ? '✓' : '★'}</span>
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      )}
      {/* Current instruction */}
      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-white/50 text-xs mb-2">Passo {step}/4</p>
        <p className="text-white text-sm">{instruction}</p>
      </div>
      {/* Input for current step */}
      {inputType === 'seme' && (
        <div className="grid grid-cols-2 gap-2">
          {SEMI_OPTIONS.map((s) => (
            <button key={s} onClick={() => callStep(step, { chosenSeme: s })} disabled={loading}
              className="py-2 rounded-lg bg-white/5 text-white/80 hover:bg-magic-purple/20 text-xs font-medium transition-colors disabled:opacity-40">
              {s === 'Picche' ? '♠' : s === 'Cuori' ? '♥' : s === 'Quadri' ? '♦' : '♣'} {s}
            </button>
          ))}
        </div>
      )}
      {inputType === 'valore' && (
        <div className="grid grid-cols-4 gap-1">
          {VALORI_OPTIONS.map((v) => (
            <button key={v} onClick={() => callStep(step, { chosenValore: v })} disabled={loading}
              className="py-1.5 rounded-lg bg-white/5 text-white/80 hover:bg-magic-purple/20 text-xs font-medium transition-colors disabled:opacity-40">
              {v}
            </button>
          ))}
        </div>
      )}
      {inputType === 'colore' && (
        <div className="flex gap-2">
          {COLORI_OPTIONS.map((c) => (
            <button key={c} onClick={() => callStep(step, { chosenColore: c.toLowerCase() })} disabled={loading}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${c === 'Rosso' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-zinc-700/40 text-zinc-300 hover:bg-zinc-700/60'}`}>
              {c === 'Rosso' ? '♥ Rosso' : '♠ Nero'}
            </button>
          ))}
        </div>
      )}
      {inputType === 'posizione' && (
        <div className="space-y-2">
          <input type="number" min={1} max={52} value={posInput} onChange={(e) => setPosInput(e.target.value)}
            placeholder="Posizione 1–52" disabled={loading}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-magic-purple/50" />
          <button onClick={() => callStep(step, { chosenPosizione: Number(posInput) })}
            disabled={loading || !posInput || Number(posInput) < 1 || Number(posInput) > 52}
            className="w-full py-2 rounded-lg bg-magic-gold/20 text-magic-gold hover:bg-magic-gold/30 text-sm font-medium disabled:opacity-40 transition-colors">
            {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Rivela Tutte le Previsioni'}
          </button>
        </div>
      )}
    </div>
  );
}

// --- TWENTY_ONE_CARDS ---
function TwentyOneCardsUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
}) {
  type Columns = { left: string[]; center: string[]; right: string[] };
  const [step, setStep] = useState(-1);
  const [columns, setColumns] = useState<Columns | null>(null);
  const [deck, setDeck] = useState<string[]>([]);
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);

  async function callStep(s: number, columnChoice?: number) {
    setLoading(true);
    try {
      const input: Record<string, unknown> = { step: s };
      if (columnChoice !== undefined) input.columnChoice = columnChoice;
      if (deck.length > 0) input.deckState = deck;
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input }),
      });
      const data = await res.json();
      if (!res.ok) { onDone({ success: false, error: data.error }); return; }
      const d = data.result?.data ?? {};
      if (d.isLastStep === true || d.reveal) {
        onDone(data.result);
        return;
      }
      setColumns(d.columns as Columns);
      setDeck(Array.isArray(d.deck) ? (d.deck as string[]) : []);
      setInstruction(d.instruction as string);
      setStep(d.nextStep as number);
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  if (step === -1) {
    return (
      <button onClick={() => callStep(0)} disabled={loading}
        className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
        {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '🃏 Inizia il Gioco delle Carte'}
      </button>
    );
  }

  const colData = columns ? [
    { label: 'Sinistra', cards: columns.left, idx: 0 },
    { label: 'Centro', cards: columns.center, idx: 1 },
    { label: 'Destra', cards: columns.right, idx: 2 },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="bg-white/5 rounded-lg p-2">
        <p className="text-white/50 text-[10px] mb-2">Round {step}/3 — {instruction}</p>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {colData.map(({ label, cards }) => (
            <div key={label}>
              <p className="text-white/40 text-center mb-1 font-medium">{label}</p>
              {cards.map((card, i) => (
                <div key={i} className="text-white/70 bg-white/5 rounded px-1 py-0.5 mb-0.5 text-center truncate">
                  {card}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-white/50 text-xs text-center">In quale colonna si trova la carta pensata?</p>
      <div className="flex gap-2">
        {colData.map(({ label, idx }) => (
          <button key={idx} onClick={() => callStep(step, idx)} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors">
            {loading ? <SpinIcon className="w-3 h-3 inline animate-spin" /> : label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Generic fallback (modules without dedicated UI) ---
function GenericModuleUI({
  eventId,
  roundId,
  moduleKey,
  onDone,
  magicianControlled = false,
}: {
  eventId: string;
  roundId: string;
  moduleKey: string;
  onDone: (result: ExecuteResult) => void;
  magicianControlled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  async function execute(input?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/modules/${moduleKey}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, input: input ?? null }),
      });
      const data = await res.json();
      onDone(res.ok ? data.result : { success: false, error: data.error });
    } catch {
      onDone({ success: false, error: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  }

  const handleMagicianExecute = async (input: Record<string, unknown>) => {
    // If module has step-based flow, inject step
    if (MAGICIAN_CONTROL_FIELDS[moduleKey]?.some((f) => f.name === 'step')) {
      input.step = step;
    }
    await execute(input);
    setStep((s) => s + 1);
  };

  const handleReset = () => {
    setStep(0);
  };

  // If magician controlled, show control panel
  if (magicianControlled) {
    const fields = MAGICIAN_CONTROL_FIELDS[moduleKey] ?? [];
    if (fields.length > 0) {
      return (
        <MagicianControlPanel
          moduleKey={moduleKey}
          moduleName={moduleKey}
          fields={fields}
          onExecute={handleMagicianExecute}
          onReset={handleReset}
          currentStep={step > 0 ? step : undefined}
          loading={loading}
        />
      );
    }
  }

  // Fallback: simple button
  return (
    <button
      onClick={() => execute()}
      disabled={loading}
      className="w-full py-2 rounded-lg bg-magic-purple/20 text-magic-mystic hover:bg-magic-purple/40 text-sm font-medium disabled:opacity-40 transition-colors"
    >
      {loading ? <SpinIcon className="w-4 h-4 inline animate-spin" /> : '✨ Attiva Incantesimo'}
    </button>
  );
}

// --- Result display ---
function ResultDisplay({ result }: { result: ExecuteResult }) {
  if (!result.success) {
    return (
      <div className="flex items-start gap-2 bg-red-500/10 rounded-lg p-2">
        <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p className="text-red-300 text-xs">{result.error || 'Errore sconosciuto'}</p>
      </div>
    );
  }

  const data = result.data ?? {};
  const scoreDelta = typeof data.scoreDelta === 'number' ? data.scoreDelta : 0;
  const revealedCard = (data.targetCard ?? data.finalCard ?? data.revealedCard ?? data.chosenCard) as string | undefined;
  const revealedNumber = typeof data.result === 'number' ? data.result : undefined;
  const revealMessage = data.message as string | undefined;
  const isReveal = !!(data.reveal || data.isLastStep === true);

  // Multilevel prediction: special layout showing all 4 predictions
  if (isReveal && data.allPredictions) {
    const ap = data.allPredictions as Record<string, unknown>;
    const uc = (data.userChoices ?? {}) as Record<string, unknown>;
    const totalMatches = typeof data.totalMatches === 'number' ? data.totalMatches : 0;
    return (
      <div className="bg-magic-gold/10 border border-magic-gold/30 rounded-xl p-4 space-y-3">
        <div className="text-center space-y-1">
          <div className="text-2xl">🔮</div>
          <p className="text-magic-gold font-bold text-sm">{totalMatches}/4 Previsioni Corrette</p>
        </div>
        <div className="space-y-1.5">
          {[
            { key: 'seme', label: 'Seme', chosen: uc.chosenSeme, predicted: ap.seme },
            { key: 'valore', label: 'Valore', chosen: uc.chosenValore, predicted: ap.valore },
            { key: 'colore', label: 'Colore', chosen: uc.chosenColore, predicted: ap.colore },
            { key: 'posizione', label: 'Posizione', chosen: uc.chosenPosizione, predicted: ap.posizione },
          ].map(({ key, label, chosen, predicted }) => {
            const match = String(chosen ?? '').toLowerCase() === String(predicted ?? '').toLowerCase();
            return (
              <div key={key} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${match ? 'bg-green-500/10 text-green-300' : 'bg-white/5 text-white/60'}`}>
                <span>{label}</span>
                <span className="font-semibold">{String(predicted ?? '–')} {match ? '✓' : '→ tu: ' + String(chosen ?? '?')}</span>
              </div>
            );
          })}
        </div>
        {revealMessage && <p className="text-white/50 text-xs italic text-center">{revealMessage}</p>}
      </div>
    );
  }

  if (isReveal && revealedCard) {
    return (
      <div className="bg-magic-gold/10 border border-magic-gold/30 rounded-xl p-4 text-center space-y-2">
        <div className="text-3xl">🃏</div>
        {revealedNumber !== undefined && (
          <p className="text-magic-gold font-bold text-sm">Il risultato è {revealedNumber}!</p>
        )}
        <p className="text-white/80 text-sm font-semibold">La tua carta è: {revealedCard}</p>
        {revealMessage && (
          <p className="text-white/50 text-xs italic">{revealMessage}</p>
        )}
        {scoreDelta > 0 && (
          <p className="text-magic-gold text-xs font-bold">+{scoreDelta} pts</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-magic-purple/15 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-green-300 text-xs font-medium">Completato</span>
        {scoreDelta > 0 && (
          <span className="ml-auto text-magic-gold text-xs font-bold">+{scoreDelta} pts</span>
        )}
      </div>
      {revealMessage && (
        <p className="text-white/70 text-xs">{revealMessage}</p>
      )}
      {data.correct !== undefined && (
        <p className="text-white/60 text-xs">
          {Boolean(data.correct) ? '✓ Predizione corretta!' : '✗ Predizione errata.'}
        </p>
      )}
    </div>
  );
}

// --- Module card ---
function ModuleCard({
  mod,
  eventId,
  roundId,
}: {
  mod: ActiveModule;
  eventId: string;
  roundId: string;
}) {
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const diff = difficultyLabel(mod.meta.difficulty);
  const Icon = MODULE_ICONS[mod.meta.icon] ?? MagicWand;

  // Determine UI mode
  const hasCustomUI = [
    'CARD_PREDICTION_BINARY',
    'EQUIVOQUE_GUIDED',
    'ENVELOPE_PREDICTION',
    'MATHEMATICAL_FORCE_27',
    'MAGICIANS_CHOICE_4',
    'PSYCHOLOGICAL_FORCE_CARD',
    'MULTILEVEL_PREDICTION',
    'TWENTY_ONE_CARDS',
  ].includes(mod.key);
  const hasStepUI = ['MATH_1089_CARDS', 'SYNCED_CARD_THOUGHT'].includes(mod.key);
  const isMagicianControlled = mod.meta.magicianControlled === true;

  // Badge for UI mode
  let modeBadge: { label: string; cls: string } | null = null;
  if (hasCustomUI) {
    modeBadge = { label: '🎨 Custom UI', cls: 'bg-green-500/15 text-green-400' };
  } else if (isMagicianControlled) {
    modeBadge = { label: '🪄 Mago', cls: 'bg-magic-gold/15 text-magic-gold' };
  } else if (hasStepUI) {
    modeBadge = { label: '🔁 Auto', cls: 'bg-blue-500/15 text-blue-400' };
  }

  return (
    <div className="bg-white/5 rounded-xl p-3 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-magic-purple/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-magic-mystic" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">{mod.meta.playerLabel ?? mod.meta.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${diff.cls}`}>{diff.label}</span>
            {modeBadge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${modeBadge.cls}`}>
                {modeBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {result ? (
        <ResultDisplay result={result} />
      ) : mod.key === 'CARD_PREDICTION_BINARY' ? (
        <CardPredictionUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'EQUIVOQUE_GUIDED' ? (
        <EquivoqueUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'ENVELOPE_PREDICTION' ? (
        <EnvelopeUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'MATHEMATICAL_FORCE_27' ? (
        <MathForce27UI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'MAGICIANS_CHOICE_4' ? (
        <MagiciansChoice4UI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'PSYCHOLOGICAL_FORCE_CARD' ? (
        <PsychForceCardUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'MULTILEVEL_PREDICTION' ? (
        <MultilevelPredictionUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : mod.key === 'TWENTY_ONE_CARDS' ? (
        <TwentyOneCardsUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : ['MATH_1089_CARDS', 'SYNCED_CARD_THOUGHT'].includes(mod.key) ? (
        <GenericStepUI eventId={eventId} roundId={roundId} moduleKey={mod.key} onDone={setResult} />
      ) : (
        <GenericModuleUI
          eventId={eventId}
          roundId={roundId}
          moduleKey={mod.key}
          onDone={setResult}
          magicianControlled={isMagicianControlled}
        />
      )}
    </div>
  );
}

// --- Main panel ---
export function MagicModulesPanel({ eventId, activeRoundId }: MagicModulesPanelProps) {
  const [modules, setModules] = useState<ActiveModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!activeRoundId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/serate/${eventId}/modules?roundId=${activeRoundId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId, activeRoundId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  if (!activeRoundId || loading || modules.length === 0) return null;

  return (
    <div className="card-magic">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-magic-gold" />
        <h3 className="text-magic-gold font-semibold text-sm">Incantesimi del Round</h3>
      </div>
      <div className="space-y-3">
        {modules.map((mod) => (
          <ModuleCard key={mod.key} mod={mod} eventId={eventId} roundId={activeRoundId} />
        ))}
      </div>
    </div>
  );
}
