'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinTableFormProps {
  eventId: string;
}

export function JoinTableForm({ eventId }: JoinTableFormProps) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/serate/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l\'accesso al tavolo.');
        return;
      }

      router.refresh();
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🪑</span>
        <h3 className="text-magic-gold font-semibold">Unisciti a un tavolo</h3>
      </div>
      <p className="text-white/50 text-sm mb-4">
        Inserisci il codice del tuo tavolo per unirti alla serata.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Codice tavolo..."
          maxLength={10}
          className="input-magic flex-1 uppercase tracking-widest text-center"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !joinCode.trim()}
          className="btn-magic whitespace-nowrap disabled:opacity-40"
        >
          {loading ? 'Accesso...' : 'Entra'}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
    </div>
  );
}
