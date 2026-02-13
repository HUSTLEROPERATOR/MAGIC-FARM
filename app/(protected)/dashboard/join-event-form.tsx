'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function JoinEventForm({ joinCode }: { joinCode: string }) {
  const router = useRouter();
  const [tableCode, setTableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/events/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode,
          ...(tableCode.trim() ? { tableCode: tableCode.trim().toUpperCase() } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore durante l\'accesso.');
        return;
      }

      router.push('/game');
      router.refresh();
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={tableCode}
          onChange={(e) => setTableCode(e.target.value)}
          placeholder="Codice tavolo (opzionale)"
          maxLength={6}
          className="input-magic flex-1 text-sm uppercase"
        />
        <button
          onClick={handleJoin}
          disabled={loading}
          className="btn-magic text-sm whitespace-nowrap disabled:opacity-40"
        >
          {loading ? 'Ingresso...' : 'Entra nella Serata'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <p className="text-white/30 text-xs">
        Inserisci il codice tavolo se ne hai uno, altrimenti verrai assegnato automaticamente.
      </p>
    </div>
  );
}
