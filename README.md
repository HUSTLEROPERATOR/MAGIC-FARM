# 🎩 MAGIC-FARM

> Where Magic Meets Competition - Un'esperienza collaborativa di enigmi magici

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](./STATUS.md)

## 📋 Stato del Progetto

**Progresso:** ~25% Completato | [Vedi Stato Completo](./STATUS.md) | [Versione Italiana](./STATUS.it.md)

MAGIC-FARM è una piattaforma di eventi per giochi di enigmi collaborativi a tema magico. Attualmente l'infrastruttura di base e l'autenticazione sono complete, ma le funzionalità principali di gameplay sono in fase di sviluppo.

### ✅ Funzionalità Implementate
- Autenticazione via email (magic link)
- Sistema di configurazione alias
- Dashboard base
- Infrastruttura di sicurezza e validazione

### 🚧 In Sviluppo
- Sistema gestione eventi
- Interfaccia invio enigmi
- Sistema tavoli e collaborazione
- Classifiche e punteggi

## 🚀 Quick Start

### Prerequisiti
- Node.js 20+
- PostgreSQL
- Account SMTP per email

### Installazione

```bash
# Clona il repository
git clone https://github.com/HUSTLEROPERATOR/MAGIC-FARM.git
cd MAGIC-FARM

# Installa dipendenze
npm install

# Configura variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue configurazioni

# Configura database
npm run db:push
npm run db:seed

# Avvia il server di sviluppo
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth 4.24
- **Email:** Nodemailer
- **Testing:** Vitest

## 📖 Documentazione

- [Stato Completo del Progetto](./STATUS.md)
- [Versione Italiana](./STATUS.it.md)
- [Schema Database](./prisma/schema.prisma)

## 🎯 Roadmap

1. **Fase 1 (MVP):** Sistema invio enigmi e verifiche
2. **Fase 2:** Collaborazione tavoli e messaggistica
3. **Fase 3:** Pannello admin e gestione contenuti
4. **Fase 4:** Funzionalità avanzate e real-time

Vedi [STATUS.md](./STATUS.md) per dettagli completi.

## 📝 Scripts Disponibili

```bash
npm run dev          # Server di sviluppo
npm run build        # Build produzione
npm run start        # Avvia produzione
npm run lint         # Linting codice
npm run db:generate  # Genera client Prisma
npm run db:push      # Push schema a DB
npm run db:migrate   # Migrazioni DB
npm run db:seed      # Seed DB
npm test             # Esegui test
```

## 🤝 Contribuire

Questo progetto è in fase di sviluppo attivo. Contributi benvenuti!

## 📄 Licenza

Proprietario - Tutti i diritti riservati

---

**A che punto sei?** Controlla [STATUS.md](./STATUS.md) per lo stato aggiornato! 🎩