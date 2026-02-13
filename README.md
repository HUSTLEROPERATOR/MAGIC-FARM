# 🎩 MAGIC-FARM

> Where Magic Meets Competition - Un'esperienza collaborativa di enigmi magici

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](./STATUS.md)

## 📋 Stato del Progetto

**Progresso:** ~25% Completato | [Vedi Stato Completo](./STATUS.md) | [Versione Italiana](./STATUS.it.md)

MAGIC-FARM è una piattaforma di eventi per giochi di enigmi collaborativi a tema magico. Attualmente l'infrastruttura di base e l'autenticazione sono complete, ma le funzionalità principali di gameplay sono in fase di sviluppo.

### Funzionalita Implementate
- Autenticazione via email (magic link)
- Sistema di configurazione alias
- Dashboard con join event attivo
- RBAC: ruoli USER e ADMIN
- Consent management (privacy + termini obbligatori, marketing opzionale)
- Game loop completo: join event, tavoli, round, enigmi, suggerimenti, punteggi
- Scoring atomico con `prisma.$transaction`
- Classifica per tavolo (evento) e classifica globale
- Pannello admin: CRUD serate, round, enigmi, suggerimenti, tavoli
- Anti-cheat detection (velocita sospetta, tentativi rapidi, pattern perfetti)
- Rate limiting su submissions (5/30s), hints (3/5min), login (5/15min)
- Soft-delete enforcement: utenti cancellati non possono accedere
- Audit logging su tutte le azioni chiave
- Libreria/Grimorio con contenuti sbloccabili

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
pnpm db:generate

# Push schema a DB (sviluppo — no migration files)
pnpm db:push

# Oppure crea migrazioni formali
pnpm db:migrate

# Popola il DB con dati di test
pnpm db:seed
```

### Avvia il Server

```bash
pnpm dev
```

Visita [http://localhost:3000](http://localhost:3000)

### Testare il Vertical Slice

Dopo `pnpm db:seed`, il DB contiene:

| Risorsa | Valore |
|---|---|
| Admin email | `admin@magic-farm.test` |
| Player email | `player@magic-farm.test` |
| Event join code | `MAGIC1` |
| Table join codes | `TBL001`, `TBL002`, `TBL003` |
| Round 1 | ACTIVE (2 enigmi) |
| Round 2 | PENDING (2 enigmi) |

**Flusso di test:**

1. Login con `player@magic-farm.test` (magic link — usa Mailtrap o simile)
2. Completa onboarding (nome, cognome, privacy)
3. Imposta alias
4. Accetta consensi obbligatori su `/consents`
5. Dalla dashboard, entra nella serata con codice `MAGIC1` (opzionalmente codice tavolo `TBL001`)
6. Vai a `/game` — risolvi enigmi (risposte: `9`, `il fiammifero`)
7. Richiedi suggerimenti e vedi la penalita punti
8. Controlla classifica su `/leaderboard`

**Come admin:**

1. Login con `admin@magic-farm.test`
2. Vai a `/admin` (link visibile in dashboard)
3. Crea nuova serata, aggiungi round, enigmi, tavoli
4. Attiva la serata (DRAFT -> LIVE)
5. Attiva un round cliccando "Attiva"

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

## Troubleshooting

**Email magic link non arriva:**
- Verifica le variabili SMTP in `.env` (host, porta, user, password)
- Usa Mailtrap/Mailhog per catturare le email in sviluppo
- Controlla i log del server per errori di invio

**Errore "Relation does not exist":**
- Esegui `pnpm db:push` o `pnpm db:migrate` per sincronizzare lo schema
- Verifica che `DATABASE_URL` sia corretto e il server PostgreSQL sia attivo

**Errore "NEXTAUTH_SECRET" mancante:**
- Genera un secret: `openssl rand -base64 32`
- Aggiungilo a `.env` come `NEXTAUTH_SECRET=...`

**Seed fallisce:**
- Assicurati che lo schema sia stato pushato prima: `pnpm db:push && pnpm db:seed`
- Se il seed e gia stato eseguito, e idempotente — puo essere rieseguito

**Redirect loop su /consents:**
- I consensi (privacy + termini) sono obbligatori per accedere a `/game` e `/serate`
- Vai a `/consents` e accetta entrambi, oppure usa `/profilo` per verificare lo stato

**Admin non vede il pannello:**
- Solo utenti con `role: ADMIN` vedono il link "Admin" in dashboard
- Nel seed, `admin@magic-farm.test` ha ruolo ADMIN

## Contribuire

Questo progetto è in fase di sviluppo attivo. Contributi benvenuti!

## 📄 Licenza

Proprietario - Tutti i diritti riservati

---

**A che punto sei?** Controlla [STATUS.md](./STATUS.md) per lo stato aggiornato! 🎩
