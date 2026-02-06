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
- Onboarding obbligatorio con consenso privacy
- Rate limiting e audit logging

### 🚧 In Sviluppo
- Sistema gestione eventi
- Interfaccia invio enigmi
- Sistema tavoli e collaborazione
- Classifiche e punteggi

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
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
```

### Variabili d'Ambiente

Modifica `.env` con i tuoi valori:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret per JWT (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL dell'app (es. `http://localhost:3000`) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 per TLS, 465 per SSL) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | Indirizzo mittente (es. `Magic Farm <noreply@example.com>`) |
| `ENCRYPTION_KEY` | Chiave AES per dati sensibili |

L'app valida le variabili d'ambiente all'avvio e fallisce immediatamente se mancano.

### Setup Database

```bash
# Genera client Prisma
npm run db:generate

# Push schema a DB (sviluppo)
npm run db:push

# Oppure con migrazioni
npm run db:migrate
```

### Avvia il Server

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)

## 📧 SMTP Testing

Per lo sviluppo locale puoi usare:

- [Mailtrap](https://mailtrap.io/) - cattura tutte le email in uscita
- [Mailhog](https://github.com/mailhog/MailHog) - server SMTP locale con web UI
- [Ethereal](https://ethereal.email/) - account SMTP usa e getta

## 👤 User Flow

1. L'utente visita `/` e clicca "Entra nel Magic"
2. Inserisce l'email su `/login` e riceve un magic link
3. Clicca il link e atterra su `/onboarding`
4. Completa l'onboarding: nome, cognome, consenso privacy
5. Imposta l'alias pubblico su `/setup-alias`
6. Accede a `/dashboard` e a tutte le sezioni dell'app

## 🔒 Security Notes

- **Autenticazione**: Email magic links via NextAuth con sessioni JWT
- **Zero password**: Nessuna password da archiviare; autenticazione via link email one-time
- **IP hashing**: Gli indirizzi IP sono hashati SHA-256 prima dello storage (mai in chiaro)
- **Rate limiting**: Tentativi di login, cambio alias e API sono rate-limited
- **Audit logging**: Tutti gli eventi di autenticazione, consenso e alias sono loggati
- **Consent tracking**: Privacy e marketing consent con evidence hash, IP hash, user agent e versione
- **Input validation**: Tutti gli input validati con Zod schemas
- **CSRF protection**: Built-in via NextAuth
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

## 💾 Dati Archiviati

| Dato | Storage | Scopo |
|---|---|---|
| Email | Plaintext (richiesto per auth) | Autenticazione |
| Nome/Cognome | Plaintext | Profilo utente |
| Alias | Plaintext (unico, lowercase) | Display nelle classifiche |
| Indirizzo IP | Solo hash SHA-256 | Audit trails, rate limiting |
| Consensi | Con evidence hash + versioni | Compliance GDPR |
| Dati di gioco | Punteggi, tempi, tentativi | Meccaniche di competizione |

Vedi [SECURITY.md](./SECURITY.md) e [PRIVACY_IMPLEMENTATION.md](./PRIVACY_IMPLEMENTATION.md) per informazioni dettagliate.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** NextAuth 4.24 (JWT strategy)
- **Email:** Nodemailer
- **Testing:** Vitest

## 📖 Documentazione

- [Stato Completo del Progetto](./STATUS.md)
- [Versione Italiana](./STATUS.it.md)
- [Security Model](./SECURITY.md)
- [Privacy Implementation](./PRIVACY_IMPLEMENTATION.md)
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
