# 🎩 MAGIC-FARM

> Where Magic Meets Competition — Un'esperienza collaborativa di enigmi magici

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)](./STATUS.md)

---

## Panoramica

MAGIC-FARM è una piattaforma full-stack per serate di enigmi collaborativi a tema magico. I giocatori si uniscono a serate (eventi), entrano in tavoli, risolvono enigmi in round progressivi, richiedono suggerimenti, formano alleanze tra tavoli e scalano le classifiche. Il pannello admin offre controllo completo su eventi, round, enigmi e moduli opzionali. L'interfaccia è interamente in italiano; il codice e la documentazione tecnica sono in inglese/italiano misto.

---

## ✨ Funzionalità

### Autenticazione e Utenti
- Login passwordless via **magic link** (NextAuth + Nodemailer)
- Sessioni JWT (30 giorni), refresh automatico
- Flusso onboarding multi-step: profilo → alias → consensi
- Ruoli **USER** e **ADMIN** con RBAC su ogni route
- Soft-delete: gli utenti cancellati non possono più accedere

### Game Loop
- **Serate** (EventNight) con stati DRAFT → LIVE → ENDED
- **Tavoli** con codici di ingresso hash-verificati; auto-assegnazione al tavolo meno pieno
- **Round** (SINGLE_TABLE / MULTI_TABLE / INDIVIDUAL) con attivazione sequenziale
- **Enigmi** con risposta hashata, scoring configurabile, 5 tipi (DIGITAL, PHYSICAL, OBSERVATION, LISTENING, HYBRID)
- **Submissions** atomiche (`$transaction`): verifica risposta → calcolo punteggio → aggiornamento classifica
- **Suggerimenti** progressivi con penalità punti, sbloccabili in ordine
- **Answer normalizer**: rimozione articoli italiani, normalizzazione, fuzzy matching (Levenshtein con guardrail)
- **Anti-cheat**: detect velocità sospetta, tentativi rapidi, pattern perfetti

### Classifiche e Punteggi
- Scoring: punti base + bonus tempo + penalità suggerimenti + penalità tentativi + bonus cross-table
- Classifica per serata: ranking individuale e per tavolo
- Classifica locale per organizzazione/venue
- Classifica globale cross-organization, consent-filtered
- LeaderboardEntry persistente top-50 con ranking tie-aware

### Collaborazione e Social
- **Clue Board**: messaggistica per tavolo (max 500 char, moderazione)
- **Alleanze cross-tavolo**: proposta, accettazione, effetti (HINT_SHARING, POINT_BONUS, POINT_PENALTY, COMMON_GOAL)
- **Modalità spettatore**: segui la serata senza incidere sul ranking

### 🪄 Magic Modules (Incantesimi)

Sistema di feature-flag per evento che permette all'admin di abilitare moduli di gioco opzionali su singole serate. Ogni modulo ha logica autonoma (validazione input, disponibilità per round, esecuzione con scoring), può richiedere artefatti server-side all'attivazione (`onEnable`), ed è rate-limited lato player (3 esecuzioni / 10s / utente). Il catalogo è in-memory (registry); la configurazione per-evento è su DB (`EventModule`); le interazioni player sono tracciate su `ModuleInteraction`.

**18 moduli implementati** in `lib/modules/modules/`:

| Gruppo | Moduli |
|--------|--------|
| Predizione carte | card-prediction-binary, envelope-prediction, sealed-envelope-digital, acaan-dynamic |
| Forza psicologica | equivoque-guided, magicians-choice-4, psychological-force-card, clock-force, birthday-card-force |
| Matematica | mathematical-force-27, math-1089-cards |
| Carte particolari | invisible-deck-digital, twenty-one-cards, shared-impossible-card |
| Multilevel / Collettivo | multilevel-prediction, synced-card-thought |
| Sigillato | firma-sigillata, prediction-hash |

| Path | Contenuto |
|------|-----------|
| `lib/modules/types.ts` | Interfacce TypeScript (`MagicModuleHandler`, `ActiveModule`, `ModuleResult`) |
| `lib/modules/registry.ts` | Registry in-memory: `registerModule`, `executeModule` |
| `lib/modules/resolver.ts` | DB resolver con cache 15s: `getActiveModulesForRound` |
| `lib/modules/modules/` | 18 moduli implementati |
| `lib/validations/schemas.ts` | Zod: `moduleToggleSchema`, `moduleConfigSchema`, `moduleExecuteSchema` |
| `lib/security/rate-limit.ts` | `rateLimitModuleExecute` (3 esecuzioni / 10s / utente) |
| `prisma/schema.prisma` | Modelli: `MagicModule`, `EventModule`, `ModuleInteraction` |
| `__tests__/modules/` | 7 file di test Vitest (validators, registry, resolver, 4 moduli) |

> **Nota:** I modelli Prisma per i moduli (`MagicModule`, `EventModule`, `ModuleInteraction`) richiedono una migrazione dedicata prima del primo avvio. Vedi [Setup Database](#setup-database).

### Narrativa e Contenuti
- **Ritual overlay**: narrative di apertura/chiusura e teaser prossimo evento
- **Il Grimorio** (Libreria): contenuti educativi sulla magia, sbloccabili in base alle serate frequentate
- **Badge / Achievements**: assegnazione automatica al raggiungimento di soglie

### Pannello Admin
- CRUD completo: serate, round, enigmi, suggerimenti, tavoli
- Gestione stati evento (DRAFT → LIVE → ENDED) e attivazione round
- Gestione moduli (Incantesimi) per evento: toggle e configurazione
- Gestione Open Stage: candidature e approvazioni
- Metriche evento aggregate e cachate

### Host & Privacy
- **Host invite**: inviti email privacy-safe — la piattaforma invia per conto dell'host, solo a utenti con doppio consenso
- **Top players**: visibili all'host solo con consenso esplicito (`consentShareWithHost`)
- Email dell'utente mai esposta all'host

### Privacy e GDPR
- 6 consensi granulari: privacy, termini, piattaforma, marketing controller, condivisione con host, marketing host
- Evidence hash (IP hashato + User Agent + timestamp) per ogni consenso
- Versionamento policy
- Consensi obbligatori enforced via middleware prima di accedere alle serate

### Sicurezza
- **Zero password**: autenticazione via magic link one-time
- **IP hashing**: SHA-256 prima dello storage (mai in chiaro)
- **Rate limiting**: login (5/15min), submissions (5/30s), hints (3/5min), join (3/5min), clue board (20/min), host invite (5/10min), moduli (3/10s)
- **Audit logging**: 25+ azioni tracciate (auth, consent, game, admin, host, privacy)
- **Encryption**: AES per dati sensibili, SHA-256 con salt per hash
- **Input validation**: Zod schemas su tutte le operazioni
- **CSRF protection**: built-in via NextAuth
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Env validation**: l'app fallisce immediatamente se mancano variabili obbligatorie

---

## 🚀 Quick Start

### Prerequisiti
- **Node.js** 18+
- **PostgreSQL** 16+ (o usa il `docker-compose.yml` incluso)
- **npm** (incluso con Node.js)
- **Account SMTP** per l'invio email (o servizio di testing locale)

### Installazione

```bash
git clone https://github.com/HUSTLEROPERATOR/MAGIC-FARM.git
cd MAGIC-FARM
npm install
cp .env.example .env.local
```

### Database con Docker (opzionale)

```bash
# Avvia PostgreSQL 16 in container
docker compose up -d

# Il DB sarà disponibile su localhost:5432
# Database: magic_farm | User: postgres | Password: postgres
```

### Variabili d'Ambiente

Modifica `.env.local` con i tuoi valori:

| Variabile | Descrizione |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (es. `postgresql://postgres:postgres@localhost:5432/magic_farm`) |
| `NEXTAUTH_SECRET` | Secret per JWT — genera con `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL dell'app (es. `http://localhost:3001`) |
| `SMTP_HOST` | Hostname server SMTP |
| `SMTP_PORT` | Porta SMTP (587 per TLS, 465 per SSL) |
| `SMTP_USER` | Username SMTP |
| `SMTP_PASSWORD` | Password SMTP |
| `SMTP_FROM` | Mittente (es. `Magic Farm <noreply@example.com>`) |
| `ADMIN_EMAILS` | Email admin separate da virgola |
| `ENCRYPTION_KEY` | Chiave AES per crittografia dati sensibili — genera con `openssl rand -base64 32` |

### Setup Database

```bash
# Genera client Prisma
npm run db:generate

# Crea le tabelle nel DB (sviluppo — senza migration files)
npm run db:push

# Oppure applica migrazioni formali (consigliato per ambienti non-dev)
npm run db:migrate

# Se stai usando i Magic Modules per la prima volta, applica la migrazione dedicata:
npx prisma migrate dev --name add_magic_modules

# Popola il DB con dati di test (admin, player, serata, enigmi)
npm run db:seed
```

### Avvia il Server

```bash
npm run dev
```

Visita [http://localhost:3001](http://localhost:3001)

---

## 🧪 Testare il Flusso Completo

Dopo `npm run db:seed`, il DB contiene:

| Risorsa | Valore |
|---|---|
| Admin email | `admin@magic-farm.test` |
| Player email | `player@magic-farm.test` |
| Codice serata | `MAGIC1` |
| Codici tavolo | `TBL001`, `TBL002`, `TBL003` |
| Round 1 | ACTIVE (2 enigmi) |
| Round 2 | PENDING (2 enigmi) |

### Come giocatore

1. Login con `player@magic-farm.test` (magic link — usa Mailtrap o simile)
2. Completa onboarding (nome, cognome, privacy)
3. Imposta alias su `/setup-alias`
4. Accetta consensi obbligatori su `/consents`
5. Dalla dashboard, entra nella serata con codice `MAGIC1` (opzionale: codice tavolo `TBL001`)
6. Vai a `/serate/[id]` — risolvi enigmi (risposte di test: `9`, `il fiammifero`)
7. Richiedi suggerimenti e osserva la penalità punti
8. Controlla classifica su `/leaderboard`

### Come admin

1. Login con `admin@magic-farm.test`
2. Vai a `/admin` (link visibile in dashboard)
3. Crea nuova serata, aggiungi round, enigmi, tavoli
4. Attiva la serata (DRAFT → LIVE) e un round
5. Abilita moduli (Incantesimi) dalla sezione SpellsPanel dell'evento

---

## 📧 SMTP Testing

Per lo sviluppo locale:

- [Mailtrap](https://mailtrap.io/) — cattura tutte le email in uscita
- [Mailhog](https://github.com/mailhog/MailHog) — server SMTP locale con web UI
- [Ethereal](https://ethereal.email/) — account SMTP usa e getta

---

## 👤 User Flow

```
Landing (/)
  └─► Login (/login) — inserisci email
        └─► Magic link via email
              └─► Onboarding (/onboarding) — nome, cognome, privacy
                    └─► Alias (/setup-alias) — scegli alias pubblico
                          └─► Consensi (/consents) — accetta privacy + termini
                                └─► Dashboard (/dashboard)
                                      ├─► Serate (/serate) — elenco eventi
                                      │     └─► Serata (/serate/[id]) — round, enigmi, clue board, classifica, moduli
                                      ├─► Classifiche (/leaderboard, /classifica)
                                      ├─► Il Grimorio (/libreria) — contenuti sbloccabili
                                      ├─► Profilo (/profilo) — dati + stato consensi
                                      └─► Admin (/admin) — solo ruolo ADMIN
```

---

## 🗄️ Schema Database

25 modelli Prisma, 10 enum. Vedi [prisma/schema.prisma](./prisma/schema.prisma) per lo schema completo.

| Modello | Scopo |
|---|---|
| `User` | Utenti con alias, ruolo (USER/ADMIN), soft-delete |
| `Account` / `Session` / `VerificationToken` | NextAuth (auth, sessioni, token magic link) |
| `Consent` | 6 consensi GDPR granulari con evidence hash |
| `Organization` | Supporto multi-venue |
| `EventNight` | Serate con stato, tema, venue, host, narrative, spettatori |
| `Table` / `TableMembership` | Tavoli con join code hashati, membership con timestamp |
| `Round` | Round per serata (3 tipi), stato, configurazione |
| `Puzzle` | Enigmi con risposta hashata, scoring config, 5 tipi |
| `Hint` | Suggerimenti progressivi con penalità |
| `Submission` | Risposte con scoring, flag anti-cheat, modalità spettatore |
| `ClueBoardMessage` | Chat per tavolo con moderazione |
| `Alliance` | Alleanze cross-tavolo con 4 tipi di effetti |
| `AuditLog` | Trail completo con IP hashati |
| `LibraryEntry` | Contenuti educativi con condizioni di sblocco |
| `LeaderboardEntry` | Punteggi persistenti aggregati |
| `Badge` / `BadgeAward` | Achievement con trigger automatici |
| `EventMetrics` | Analytics evento aggregate e cachate |
| `MagicModule` | Catalogo moduli disponibili |
| `EventModule` | Configurazione per-evento dei moduli |
| `ModuleInteraction` | Esecuzioni moduli per player |
| `OpenStageApplication` | Candidature Open Stage |

---

## 🔌 API Routes (48 route)

<details>
<summary><strong>Auth & User</strong> (4 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handler (magic link, JWT) |
| `/api/auth/request-link` | POST | Richiesta magic link rate-limited |
| `/api/user/onboarding` | POST | Completa profilo + consenso iniziale |
| `/api/user/alias` | POST | Imposta alias unico |

</details>

<details>
<summary><strong>Consents</strong> (3 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/consents` | GET | Stato consensi corrente |
| `/api/consents` | POST | Crea/aggiorna consensi con evidence hash |
| `/api/consents/revoke` | POST | Revoca consenso specifico |

</details>

<details>
<summary><strong>Events & Serate</strong> (16 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/events` | GET | Lista eventi |
| `/api/events/active` | GET | Evento LIVE corrente |
| `/api/events/join` | POST | Entra in serata (joinCode + tableCode opzionale) |
| `/api/events/[eventId]` | GET | Dettaglio evento |
| `/api/serate` | GET | Lista serate DRAFT + LIVE |
| `/api/serate/[eventId]` | GET | Dettaglio serata completo |
| `/api/serate/[eventId]/join` | POST | Entra in tavolo (hash-verificato) |
| `/api/serate/[eventId]/submit` | POST | Invia risposta (scoring atomico) |
| `/api/serate/[eventId]/hint` | POST | Richiedi suggerimento |
| `/api/serate/[eventId]/messages` | GET/POST | Clue board (lettura + invio) |
| `/api/serate/[eventId]/leaderboard` | GET | Classifica live per serata |
| `/api/serate/[eventId]/spectator` | GET/POST | Toggle modalità spettatore |
| `/api/serate/[eventId]/ritual` | GET | Narrative apertura/chiusura |
| `/api/serate/[eventId]/metrics` | GET/POST | Metriche evento aggregate |
| `/api/serate/[eventId]/alliance-effect` | POST | Effetti alleanza |
| `/api/serate/[eventId]/modules` | GET | Moduli attivi per round |
| `/api/serate/[eventId]/modules/[moduleKey]/execute` | POST | Esegui modulo (rate-limited) |

</details>

<details>
<summary><strong>Game</strong> (4 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/submissions` | POST | Invio risposta con scoring atomico |
| `/api/puzzles/[puzzleId]` | GET | Dettaglio enigma |
| `/api/hints/request` | POST | Richiesta suggerimento |
| `/api/table/me` | GET | Stato tavolo corrente per l'utente |

</details>

<details>
<summary><strong>Classifiche</strong> (2 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/leaderboard` | GET | Classifica multi-scope (serata, locale, globale) |
| `/api/classifica` | GET | Top-50 persistente |

</details>

<details>
<summary><strong>Host</strong> (2 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/host/top-players` | GET | Top giocatori (solo con consenso) |
| `/api/host/invite` | POST | Inviti email privacy-safe |

</details>

<details>
<summary><strong>Profilo, Libreria, Badge</strong> (4 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/profilo` | GET | Profilo utente |
| `/api/libreria` | GET | Contenuti libreria pubblicati |
| `/api/badges` | GET | Badge con stato utente |
| `/api/badges/check` | POST | Trigger assegnazione badge |

</details>

<details>
<summary><strong>Open Stage</strong> (3 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/open-stage/apply` | POST | Candidatura player a Open Stage |
| `/api/admin/open-stage` | GET/PATCH | Lista candidature (admin) |
| `/api/admin/open-stage/[id]` | GET/PATCH/DELETE | Gestione candidatura singola (admin) |

</details>

<details>
<summary><strong>Admin</strong> (11 route)</summary>

| Route | Metodo | Descrizione |
|---|---|---|
| `/api/admin/events` | GET/POST | Lista / crea eventi |
| `/api/admin/events/[eventId]` | GET/PATCH | Dettaglio / aggiorna evento |
| `/api/admin/rounds` | POST | Crea round |
| `/api/admin/puzzles` | POST | Crea enigma |
| `/api/admin/hints` | POST | Crea suggerimento |
| `/api/admin/tables` | POST | Crea tavolo |
| `/api/admin/modules` | GET | Lista moduli per evento |
| `/api/admin/modules/[eventModuleId]` | GET/PATCH | Dettaglio / toggle modulo |
| `/api/admin/modules/[eventModuleId]/config` | POST | Configura modulo |
| `/api/admin/modules/firma-sigillata/reveal` | POST | Reveal speciale Firma Sigillata |

</details>

---

## 🔒 Sicurezza

| Layer | Implementazione |
|---|---|
| Autenticazione | Magic link one-time, zero password |
| Sessioni | JWT con NextAuth, 30 giorni, refresh automatico |
| RBAC | `requireAuth()` e `requireAdmin()` su ogni route protetta |
| Rate Limiting | 7 limiter configurabili (login, submissions, hints, join, clue board, host invite, moduli) |
| Dati sensibili | IP hashati SHA-256, dati crittografati AES |
| Audit | 25+ azioni tracciate con IP hashato, user agent, timestamp |
| Validazione | Zod schemas su tutti gli input |
| Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CSRF | Built-in via NextAuth |
| Anti-cheat | Detect velocità, tentativi rapidi, pattern sospetti |

Vedi [SECURITY.md](./SECURITY.md) e [PRIVACY_IMPLEMENTATION.md](./PRIVACY_IMPLEMENTATION.md) per dettagli completi.

---

## 💾 Dati Archiviati

| Dato | Storage | Scopo |
|---|---|---|
| Email | Plaintext (richiesto per auth) | Autenticazione |
| Nome / Cognome | Plaintext | Profilo utente |
| Alias | Plaintext (unico, lowercase) | Display nelle classifiche |
| Indirizzo IP | Solo hash SHA-256 | Audit trail, rate limiting |
| Consensi | Evidence hash + versioni policy | Compliance GDPR |
| Risposte enigmi | Hash SHA-256 con salt | Verifica senza esporre la soluzione |
| Dati di gioco | Punteggi, tempi, tentativi, flag | Meccaniche di competizione |

---

## 🛠️ Tech Stack

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Linguaggio | TypeScript 5.5 |
| UI | React 18.3, Tailwind CSS (tema custom: `magic-dark`, `magic-gold`, `magic-purple`) |
| Animazioni | Framer Motion 12 (card engine, motion presets, riduzione movimento) |
| Font | Cinzel (headings) + Inter (body) |
| Database | PostgreSQL 16 + Prisma ORM 5.22 |
| Auth | NextAuth 4.24 (Email provider, JWT, PrismaAdapter) |
| Email | Nodemailer 7.0 (template HTML custom) |
| Validazione | Zod 3.23 |
| Sicurezza | bcrypt, crypto-js, rate-limiter-flexible |
| Testing (unit) | Vitest 2.0 — 14 file di test |
| Testing (E2E) | Playwright — 3 spec (home, login, verify-request) |
| Containerizzazione | Docker Compose (PostgreSQL) |

---

## 🧪 Testing

```bash
# Tutti i test unitari
npm test

# UI interattiva Vitest
npm run test:ui

# Test E2E (richiede server attivo su porta 3001)
npm run test:e2e
npm run test:e2e:ui        # con UI Playwright
npm run test:e2e:report    # visualizza report HTML
```

Test unitari coperti (14 file):
- `scoring.test.ts` — calcolo punteggio, bonus tempo, penalità, anti-cheat, ranking
- `answer-normalizer.test.ts` — normalizzazione, Levenshtein, fuzzy matching, guardrail
- `schemas.test.ts` — validazione schemas Zod
- `alias-normalization.test.ts` — normalizzazione e validazione alias
- `env-validation.test.ts` — validazione variabili d'ambiente
- `harry-potter-quiz.test.ts` — normalizzazione risposte quiz
- `host-invite-rate-limit.test.ts` — rate limiting inviti host
- `__tests__/modules/` — 7 file per validators, registry, resolver e 4 moduli

---

## 📝 Scripts Disponibili

```bash
npm run dev           # Server di sviluppo (porta 3001)
npm run build         # Build produzione
npm run start         # Avvia produzione
npm run lint          # Linting codice
npm run db:generate   # Genera client Prisma
npm run db:push       # Push schema a DB (sviluppo)
npm run db:migrate    # Migrazioni DB
npm run db:seed       # Seed DB con dati di test
npm test              # Esegui test unitari
npm run test:ui       # Test con UI interattiva
npm run test:e2e      # Test E2E (Playwright)
```

---

## 📖 Documentazione

- [Security Model](./SECURITY.md)
- [Privacy Implementation](./PRIVACY_IMPLEMENTATION.md)
- [Schema Database](./prisma/schema.prisma)
- [Magic Modules Design](./docs/plans/2026-02-16-magic-modules-design.md)
- [Magician Controlled System](./docs/MAGICIAN_CONTROLLED_SYSTEM.md)

> **Nota:** `STATUS.md` riflette lo stato del progetto a febbraio 2026 e non è aggiornato con le funzionalità aggiunte successivamente.

---

## ❓ Troubleshooting

<details>
<summary><strong>Email magic link non arriva</strong></summary>

- Verifica le variabili SMTP in `.env.local` (host, porta, user, password)
- Usa Mailtrap/Mailhog per catturare le email in sviluppo
- Controlla i log del server per errori di invio

</details>

<details>
<summary><strong>Errore "Relation does not exist"</strong></summary>

- Esegui `npm run db:push` o `npm run db:migrate` per sincronizzare lo schema
- Se l'errore riguarda `magic_modules` / `event_modules` / `module_interactions`, applica la migrazione dedicata:
  ```bash
  npx prisma migrate dev --name add_magic_modules
  ```
- Verifica che `DATABASE_URL` sia corretto e il server PostgreSQL sia attivo

</details>

<details>
<summary><strong>Errore "NEXTAUTH_SECRET" mancante</strong></summary>

- Genera un secret: `openssl rand -base64 32`
- Aggiungilo a `.env.local` come `NEXTAUTH_SECRET=...`

</details>

<details>
<summary><strong>Errore "ENCRYPTION_KEY" mancante</strong></summary>

- Genera una chiave: `openssl rand -base64 32`
- Aggiungila a `.env.local` come `ENCRYPTION_KEY=...`
- Questa variabile è obbligatoria — l'app non si avvia senza di essa

</details>

<details>
<summary><strong>Seed fallisce</strong></summary>

- Assicurati che lo schema sia stato pushato prima: `npm run db:push && npm run db:seed`
- Il seed è idempotente — può essere rieseguito senza problemi

</details>

<details>
<summary><strong>Redirect loop su /consents</strong></summary>

- I consensi (privacy + termini) sono obbligatori per accedere a `/serate`
- Vai a `/consents` e accetta entrambi, oppure usa `/profilo` per verificare lo stato

</details>

<details>
<summary><strong>Admin non vede il pannello</strong></summary>

- Solo utenti con `role: ADMIN` vedono il link "Admin" in dashboard
- Nel seed, `admin@magic-farm.test` ha ruolo ADMIN
- Il ruolo va impostato tramite DB o tramite `ADMIN_EMAILS` in `.env.local`

</details>

---

## 🎯 Limitazioni Attuali e Roadmap

**Limitazioni note:**
- Nessun ruolo `HOST` dedicato — le operazioni host usano temporaneamente il ruolo ADMIN
- Aggiornamenti real-time (classifica, clue board) tramite polling; WebSocket non ancora implementato
- L'interfaccia è solo in italiano; nessun supporto i18n
- Nessun Dockerfile per l'app Next.js — solo il DB è containerizzato

**Roadmap:**
- [ ] Ruolo `HOST` dedicato
- [ ] WebSocket per aggiornamenti real-time
- [ ] Dockerfile per deployment containerizzato completo
- [ ] Classifiche stagionali
- [ ] Internazionalizzazione

---

## 📄 Licenza

Proprietario — Tutti i diritti riservati.

---

**Pronto a giocare?** Segui il [Quick Start](#-quick-start) e lancia la tua prima serata! 🎩
