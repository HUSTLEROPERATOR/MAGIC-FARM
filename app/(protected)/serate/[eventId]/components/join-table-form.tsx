'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Hourglass, Armchair, X } from '@/lib/ui/icons';

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
        <Ticket className="w-10 h-10 text-magic-gold mx-auto" />
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
          <span className="flex items-center gap-1.5">
            {loading ? <Hourglass className="w-4 h-4" /> : <Armchair className="w-4 h-4" />}
            {loading ? 'Accesso...' : 'Siediti'}
          </span>
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center mt-3 flex items-center justify-center gap-1">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
