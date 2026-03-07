'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, MagicWand, ScrollText, FileText, Check, X, RefreshCw, Wand2 } from '@/lib/ui/icons';
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
  const revealedCard = (data.targetCard ?? data.finalCard ?? data.revealedCard) as string | undefined;
  const revealedNumber = typeof data.result === 'number' ? data.result : undefined;
  const revealMessage = data.message as string | undefined;
  const isReveal = !!(data.reveal || data.isLastStep === true);

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
