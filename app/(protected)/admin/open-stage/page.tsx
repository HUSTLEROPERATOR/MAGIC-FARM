'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Application {
  id: string;
  stageName: string;
  realName: string;
  email: string;
  phone: string;
  description: string;
  videoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function AdminOpenStagePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/open-stage');
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = filter === 'ALL' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const pendingCount = applications.filter(app => app.status === 'PENDING').length;
  const approvedCount = applications.filter(app => app.status === 'APPROVED').length;
  const rejectedCount = applications.filter(app => app.status === 'REJECTED').length;

  return (
    <div className="min-h-screen bg-magic-dark p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-3xl text-magic-gold">Palco Aperto Magico</h1>
            <p className="text-white/40 text-sm">Gestisci le candidature dei performer</p>
          </div>
          <Link href="/admin" className="text-magic-mystic hover:text-magic-gold text-sm">
            ← Admin Panel
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card-magic text-center">
            <p className="text-2xl font-bold text-white">{applications.length}</p>
            <p className="text-white/60 text-sm">Totale</p>
          </div>
          <div className="card-magic text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-white/60 text-sm">In Attesa</p>
          </div>
          <div className="card-magic text-center">
            <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
            <p className="text-white/60 text-sm">Approvate</p>
          </div>
          <div className="card-magic text-center">
            <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
            <p className="text-white/60 text-sm">Rifiutate</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'ALL'
                ? 'bg-magic-mystic text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Tutte ({applications.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'PENDING'
                ? 'bg-yellow-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            In Attesa ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'APPROVED'
                ? 'bg-green-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Approvate ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'REJECTED'
                ? 'bg-red-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Rifiutate ({rejectedCount})
          </button>
        </div>

        {/* Applications List */}
        {loading ? (
          <p className="text-white/40 animate-pulse">Caricamento...</p>
        ) : filteredApplications.length === 0 ? (
          <div className="card-magic text-center py-10">
            <p className="text-white/60">Nessuna candidatura trovata.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onUpdated={fetchApplications}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onUpdated,
}: {
  application: Application;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: 'APPROVED' | 'REJECTED') {
    if (!confirm(`Sei sicuro di voler ${status === 'APPROVED' ? 'approvare' : 'rifiutare'} questa candidatura?`)) {
      return;
    }

    setUpdating(true);
    const res = await fetch(`/api/admin/open-stage/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      onUpdated();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Errore durante l\'aggiornamento dello stato. Riprova.');
    }
    setUpdating(false);
  }

  const statusColor =
    application.status === 'APPROVED'
      ? 'text-green-400 bg-green-500/20'
      : application.status === 'REJECTED'
      ? 'text-red-400 bg-red-500/20'
      : 'text-yellow-400 bg-yellow-500/20';

  const createdDate = new Date(application.createdAt).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card-magic">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-magic-gold font-semibold text-lg">{application.stageName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>
              {application.status}
            </span>
          </div>
          <p className="text-white/60 text-sm mb-1">{application.realName}</p>
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <span>📧 {application.email}</span>
            <span>📱 {application.phone}</span>
            <span>🕒 {createdDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {application.status === 'PENDING' && (
            <>
              <button
                onClick={() => updateStatus('APPROVED')}
                disabled={updating}
                className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-40"
              >
                ✓ Approva
              </button>
              <button
                onClick={() => updateStatus('REJECTED')}
                disabled={updating}
                className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-40"
              >
                ✗ Rifiuta
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-magic-mystic hover:text-magic-gold"
          >
            {expanded ? 'Chiudi' : 'Dettagli'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          <div>
            <h4 className="text-white/80 font-medium text-sm mb-2">Descrizione del Numero:</h4>
            <p className="text-white/70 text-sm bg-white/5 p-3 rounded-lg">{application.description}</p>
          </div>
          {application.videoUrl && (
            <div>
              <h4 className="text-white/80 font-medium text-sm mb-2">Video:</h4>
              <a
                href={application.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-magic-mystic hover:text-magic-gold text-sm"
              >
                🎥 Guarda il video →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
