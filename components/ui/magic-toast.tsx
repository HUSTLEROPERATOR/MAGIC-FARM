'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import { Icon } from '@/components/ui/icon';

/* ── Types ─────────────────────────────────────── */
type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  /** true when the exit animation is running */
  exiting: boolean;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

/* ── Context ───────────────────────────────────── */
const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

/* ── Styling per variante ─────────────────────── */
const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-magic-gold/50 bg-gradient-to-r from-magic-gold/10 to-transparent text-magic-gold',
  error:
    'border-magic-error/50 bg-gradient-to-r from-magic-error/10 to-transparent text-magic-error',
  info:
    'border-magic-mystic/50 bg-gradient-to-r from-magic-mystic/10 to-transparent text-magic-mystic',
};

const variantIcons: Record<ToastVariant, 'Check' | 'X' | 'Sparkle'> = {
  success: 'Check',
  error: 'X',
  info: 'Sparkle',
};

const DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

/* ── Provider ──────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    // start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    // remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = ++idRef.current;
      setToasts((prev) => {
        const next = [...prev, { id, message, variant, exiting: false }];
        // trim oldest if over limit
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
      setTimeout(() => removeToast(id), DISMISS_MS);
    },
    [removeToast],
  );

  const api: ToastAPI = {
    success: useCallback((m: string) => addToast(m, 'success'), [addToast]),
    error: useCallback((m: string) => addToast(m, 'error'), [addToast]),
    info: useCallback((m: string) => addToast(m, 'info'), [addToast]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl
              border backdrop-blur-lg shadow-lg max-w-sm
              ${variantStyles[t.variant]}
              ${t.exiting ? 'animate-toast-out' : 'animate-toast-in'}
            `}
          >
            <Icon name={variantIcons[t.variant]} size="sm" />
            <span className="text-sm font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Chiudi"
            >
              <Icon name="X" size="xs" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
