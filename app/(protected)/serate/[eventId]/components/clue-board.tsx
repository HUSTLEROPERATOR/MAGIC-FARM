'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/icon';

interface Message {
  id: string;
  body: string;
  createdAt: string;
  user: {
    alias: string | null;
    firstName: string | null;
  };
}

interface ClueBoardProps {
  eventId: string;
  tableName: string;
}

export function ClueBoard({ eventId, tableName }: ClueBoardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/serate/${eventId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/serate/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-magic">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Icon name="MessageCircle" size="md" className="text-magic-gold" />
          <h3 className="text-magic-gold font-semibold text-sm">Chat — {tableName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-xs bg-magic-mystic/20 text-magic-mystic px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
          <span className="text-white/30 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <>
          {/* Messages */}
          <div className="h-64 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
            {messages.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-8">
                Nessun messaggio ancora.<br />Scrivi al tuo tavolo!
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-magic-mystic text-xs font-semibold">
                      {msg.user.alias || msg.user.firstName || 'Mago'}
                    </span>
                    <span className="text-white/20 text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{msg.body}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Scrivi al tavolo..."
              maxLength={500}
              className="input-magic text-sm flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-3 py-2 rounded-xl bg-magic-purple/50 text-white text-sm hover:bg-magic-purple transition-colors disabled:opacity-50"
            >
              {loading ? <Icon name="Hourglass" size="sm" /> : <Icon name="Send" size="sm" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
