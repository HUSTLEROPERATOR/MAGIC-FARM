'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft } from '@/lib/ui/icons';

interface EventSummary {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  joinCode: string | null;
  currentRoundId: string | null;
  _count: { tables: number; rounds: number };
}

export default function AdminPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch('/api/admin/events');
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-3xl text-magic-gold">Pannello Admin</h1>
            <p className="text-white/40 text-sm">Gestisci serate, round, enigmi e tavoli</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/open-stage" className="text-magic-mystic hover:text-magic-gold text-sm px-3 py-1.5 bg-magic-purple/20 rounded">
              Palco Aperto <Sparkles className="w-4 h-4 inline" />
            </Link>
            <Link href="/dashboard" className="text-magic-mystic hover:text-magic-gold text-sm">
              <ArrowLeft className="w-4 h-4 inline" /> Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-magic text-sm"
          >
            + Crea Serata
          </button>
        </div>

        {showCreate && (
          <CreateEventForm
            onCreated={() => {
              setShowCreate(false);
              fetchEvents();
            }}
          />
        )}

        {loading ? (
          <p className="text-white/40 animate-pulse">Caricamento...</p>
        ) : events.length === 0 ? (
          <div className="card-magic text-center py-10">
            <p className="text-white/60">Nessuna serata creata.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onUpdated={fetchEvents} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const now = new Date();
    const endsAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || undefined,
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Errore.');
    } else {
      onCreated();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleCreate} className="card-magic mb-6 space-y-4">
      <h3 className="text-magic-gold font-semibold">Nuova Serata</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome serata"
        className="input-magic w-full"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrizione (opzionale)"
        className="input-magic w-full h-20"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !name.trim()} className="btn-magic text-sm disabled:opacity-40">
        {loading ? 'Creazione...' : 'Crea Serata'}
      </button>
    </form>
  );
}

function EventCard({ event, onUpdated }: { event: EventSummary; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadDetail() {
    if (detail) {
      setExpanded(!expanded);
      return;
    }
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/events/${event.id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail(data.event);
    }
    setLoadingDetail(false);
    setExpanded(true);
  }

  async function updateStatus(status: string) {
    await fetch(`/api/admin/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onUpdated();
  }

  const statusColor =
    event.status === 'LIVE' ? 'text-green-400 bg-green-500/20' :
    event.status === 'ENDED' ? 'text-white/40 bg-white/10' :
    'text-magic-mystic bg-magic-purple/20';

  return (
    <div className="card-magic">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-magic-gold font-semibold text-lg">{event.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
              {event.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/40 text-xs">
            {event.joinCode && <span>Codice: <span className="text-magic-mystic font-mono">{event.joinCode}</span></span>}
            <span>{event._count.tables} tavoli</span>
            <span>{event._count.rounds} round</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.status === 'DRAFT' && (
            <button onClick={() => updateStatus('LIVE')} className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">
              Attiva
            </button>
          )}
          {event.status === 'LIVE' && (
            <button onClick={() => updateStatus('ENDED')} className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">
              Termina
            </button>
          )}
          <button onClick={loadDetail} className="text-xs text-magic-mystic hover:text-magic-gold">
            {loadingDetail ? '...' : expanded ? 'Chiudi' : 'Dettagli'}
          </button>
        </div>
      </div>

      {expanded && detail && (
        <EventDetailPanel event={detail} onUpdated={async () => {
          const res = await fetch(`/api/admin/events/${event.id}`);
          if (res.ok) setDetail((await res.json()).event);
          onUpdated();
        }} />
      )}
    </div>
  );
}

interface EventDetail {
  id: string;
  name: string;
  status: string;
  joinCode: string | null;
  currentRoundId: string | null;
  tables: { id: string; name: string; _count: { memberships: number } }[];
  rounds: {
    id: string;
    title: string;
    status: string;
    type: string;
    puzzles: {
      id: string;
      title: string;
      order: number;
      hints: { id: string; text: string; order: number; penaltyPoints: number }[];
      _count: { submissions: number };
    }[];
  }[];
}

function EventDetailPanel({ event, onUpdated }: { event: EventDetail; onUpdated: () => void }) {
  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-6">
      {/* Tables */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium text-sm">Tavoli</h4>
          <AddTableForm eventId={event.id} onAdded={onUpdated} />
        </div>
        {event.tables.length === 0 ? (
          <p className="text-white/30 text-xs">Nessun tavolo.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {event.tables.map((t) => (
              <span key={t.id} className="text-xs px-2 py-1 bg-magic-purple/10 text-magic-mystic rounded">
                {t.name} ({t._count.memberships} membri)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rounds */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium text-sm">Round</h4>
          <AddRoundForm eventId={event.id} onAdded={onUpdated} />
        </div>
        {event.rounds.map((round) => (
          <RoundPanel key={round.id} round={round} eventId={event.id} onUpdated={onUpdated} />
        ))}
      </div>
    </div>
  );
}

function AddTableForm({ eventId, onAdded }: { eventId: string; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/admin/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventNightId: eventId, name }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(`Codice: ${data.joinCode}`);
      setName('');
      onAdded();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-green-400 text-xs font-mono">{result}</span>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome tavolo"
        className="input-magic text-xs py-1 px-2 w-32"
      />
      <button onClick={handleAdd} disabled={loading} className="text-xs text-magic-gold hover:text-magic-mystic disabled:opacity-40">
        + Aggiungi
      </button>
    </div>
  );
}

function AddRoundForm({ eventId, onAdded }: { eventId: string; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch('/api/admin/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventNightId: eventId, title, type: 'SINGLE_TABLE' }),
    });
    if (res.ok) {
      setTitle('');
      onAdded();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titolo round"
        className="input-magic text-xs py-1 px-2 w-32"
      />
      <button onClick={handleAdd} disabled={loading} className="text-xs text-magic-gold hover:text-magic-mystic disabled:opacity-40">
        + Aggiungi
      </button>
    </div>
  );
}

function RoundPanel({ round, eventId, onUpdated }: {
  round: EventDetail['rounds'][0];
  eventId: string;
  onUpdated: () => void;
}) {
  const [showAddPuzzle, setShowAddPuzzle] = useState(false);

  async function activateRound() {
    await fetch(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentRoundId: round.id }),
    });
    onUpdated();
  }

  const statusColor = round.status === 'ACTIVE' ? 'text-green-400' : round.status === 'COMPLETED' ? 'text-white/40' : 'text-magic-mystic';

  return (
    <div className="ml-4 mb-4 pl-4 border-l border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${statusColor}`}>{round.title}</span>
          <span className="text-white/20 text-xs">{round.type}</span>
          <span className="text-white/20 text-xs">({round.status})</span>
        </div>
        <div className="flex items-center gap-2">
          {round.status !== 'ACTIVE' && (
            <button onClick={activateRound} className="text-xs text-green-400 hover:text-green-300">
              Attiva
            </button>
          )}
          <button onClick={() => setShowAddPuzzle(!showAddPuzzle)} className="text-xs text-magic-gold">
            + Enigma
          </button>
        </div>
      </div>

      {showAddPuzzle && (
        <AddPuzzleForm roundId={round.id} onAdded={() => { setShowAddPuzzle(false); onUpdated(); }} />
      )}

      {round.puzzles.map((puzzle) => (
        <div key={puzzle.id} className="ml-4 mb-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/70">{puzzle.order + 1}. {puzzle.title}</span>
            <span className="text-white/30 text-xs">{puzzle._count.submissions} risposte, {puzzle.hints.length} hint</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddPuzzleForm({ roundId, onAdded }: { roundId: string; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/puzzles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId, title, prompt, answer }),
    });
    if (res.ok) {
      onAdded();
    } else {
      const data = await res.json();
      setError(data.error || 'Errore.');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleAdd} className="bg-white/5 p-3 rounded mb-3 space-y-2">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo enigma" className="input-magic w-full text-sm" required />
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Testo dell'enigma" className="input-magic w-full text-sm h-16" required />
      <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Risposta corretta" className="input-magic w-full text-sm" required />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="btn-magic text-xs disabled:opacity-40">
        {loading ? 'Aggiunta...' : 'Aggiungi Enigma'}
      </button>
    </form>
  );
}
