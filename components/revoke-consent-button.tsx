'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

interface RevokeConsentButtonProps {
  field: 'consentShareWithHost' | 'consentHostMarketing' | 'consentControllerMarketing';
  label: string;
  /** Extra warning text shown in confirmation dialog */
  warning?: string;
}

/**
 * Button to revoke a specific optional consent with immediate effect.
 * Shows a confirmation dialog before revoking.
 */
export function RevokeConsentButton({ field, label, warning }: RevokeConsentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(null);

  async function handleRevoke() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/consents/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Errore durante la revoca.' });
        return;
      }

      setResult({ success: true, message: data.message });
      setShowConfirm(false);
      // Refresh the page after a short delay to reflect changes
      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch {
      setResult({ success: false, message: 'Errore di rete. Riprova.' });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <span className="text-yellow-400 text-xs animate-pulse">
        <Icon name="Check" size="xs" className="inline" /> Revocato
      </span>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-yellow-300 text-xs">
          {warning || 'Sei sicuro?'}
        </span>
        <button
          onClick={handleRevoke}
          disabled={loading}
          className="text-xs px-2 py-0.5 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Revocando...' : 'Conferma'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="text-xs px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/60 rounded transition-colors"
        >
          Annulla
        </button>
        {result && !result.success && (
          <span className="text-red-400 text-xs w-full mt-1">{result.message}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-xs px-2 py-0.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded transition-colors"
    >
      {label}
    </button>
  );
}
