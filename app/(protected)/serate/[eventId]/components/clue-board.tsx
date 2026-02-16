'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  body: string;
  createdAt: string;
  user: { alias: string | null; firstName: string | null };
}

interface ClueBoardProps {
  eventId: string;
  tableName: string;
}

export function ClueBoard({ eventId, tableName }: ClueBoardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/serate/${eventId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // silently fail
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/serate/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="text-magic-gold font-semibold text-sm">Bacheca Indizi</h3>
          <span className="text-white/30 text-xs">{tableName}</span>
        </div>
        <span className="text-white/30 text-xs">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <>
          <div className="h-48 overflow-y-auto space-y-2 mb-3 pr-1">
            {messages.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-8">
                Nessun messaggio. Scrivi qualcosa al tuo tavolo!
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="text-magic-mystic font-medium text-xs">
                    {msg.user.alias || msg.user.firstName || 'Mago'}:
                  </span>{' '}
                  <span className="text-white/70">{msg.body}</span>
                  <span className="text-white/20 text-[10px] ml-2">
                    {new Date(msg.createdAt).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi un messaggio..."
              maxLength={500}
              className="input-magic flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="btn-magic text-sm px-3 disabled:opacity-40"
            >
              Invia
            </button>
          </form>
        </>
      )}
    </div>
  );
}
