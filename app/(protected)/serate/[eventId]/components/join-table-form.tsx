'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

interface JoinTableFormProps {
  eventId: string;
}

export function JoinTableForm({ eventId }: JoinTableFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/serate/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l\'accesso al tavolo');
        return;
      }

      router.refresh();
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic border-magic-mystic/30">
      <div className="text-center mb-4">
        <Icon name="Ticket" size="2xl" className="mx-auto text-magic-mystic" />
        <h2 className="text-magic-gold font-semibold text-lg mt-2">Unisciti a un Tavolo</h2>
        <p className="text-white/50 text-sm">Inserisci il codice che ti è stato dato</p>
      </div>

      <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ES: ABC123"
          maxLength={6}
          className="input-magic text-center text-2xl tracking-[0.5em] font-mono uppercase flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="btn-magic disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? <><Icon name="Hourglass" size="sm" className="inline" /> Accesso...</> : <><Icon name="Armchair" size="sm" className="inline" /> Siediti</>}</span>
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center mt-3"><Icon name="XCircle" size="xs" className="inline" /> {error}</p>
      )}
    </div>
  );
}
