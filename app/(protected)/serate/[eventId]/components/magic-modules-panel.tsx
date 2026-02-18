'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, MagicWand, ScrollText, FileText, Check, X, RefreshCw } from '@/lib/ui/icons';
import type { LucideIcon } from '@/lib/ui/icons';

interface ActiveModule {
  key: string;
  meta: {
    name: string;
    description: string;
    icon: string;
    difficulty: string;
    scope: string;
    priority: number;
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

  return (
    <div className="bg-magic-purple/15 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-400" />
        <span className="text-green-300 text-xs font-medium">Eseguito</span>
        {scoreDelta > 0 && (
          <span className="ml-auto text-magic-gold text-xs font-bold">+{scoreDelta} pts</span>
        )}
      </div>
      {data.correct !== undefined && (
        <p className="text-white/60 text-xs">
          {Boolean(data.correct) ? '✓ Predizione corretta!' : '✗ Predizione errata.'}
        </p>
      )}
      {!!data.revealStyle && (
        <p className="text-magic-mystic text-xs italic">
          Stile rivelazione: {String(data.revealStyle)}
        </p>
      )}
      {!!data.outputFormat && (
        <p className="text-white/60 text-xs italic">{String(data.outputFormat)}</p>
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

  return (
    <div className="bg-white/5 rounded-xl p-3 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-magic-purple/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-magic-mystic" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium">{mod.meta.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${diff.cls}`}>{diff.label}</span>
          </div>
          <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{mod.meta.description}</p>
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
      ) : null}
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
