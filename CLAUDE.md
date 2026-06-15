# Pix3lnote — Istruzioni per Claude Code

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript (strict mode)
- **Database**: Turso (SQLite cloud)
- **Storage**: Vercel Blob
- **Auth**: JWT + bcryptjs
- **Styling**: Tailwind CSS
- **Validazione**: Zod

## Ambienti di esecuzione

| Ambiente | Comando | Note |
|----------|---------|------|
| Locale | `npm run dev` | DB Turso remoto o sqld locale |
| Docker | `docker-compose up` | sqld emulato, `.env` nella parent dir |
| Vercel | Deploy da GitHub | DB Turso cloud, Blob storage |

## Variabili d'ambiente

```
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
JWT_SECRET
BLOB_READ_WRITE_TOKEN
```

## Convenzioni di Codice

### Commit
- Messaggi in **inglese**
- Formato: `type: description`
- Tipi: `feat`, `fix`, `docs`, `chore`, `refactor`
- Aggiungere `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

### TypeScript
- Strict mode abilitato
- Definire tipi in `types/`
- Usare Zod per validazione runtime in `lib/validation/`

### Componenti React
- Client components: `'use client'` in cima
- Usare React Context per stato globale
- Componenti UI riutilizzabili in `components/ui/`

### API Routes
- Sempre verificare autenticazione con `verifyToken()`
- Validare input con Zod schema
- Query parametrizzate (no string concatenation)
- Gestire errori con try/catch

## Pattern Importanti

### Null vs Undefined

- `undefined` = "non modificare questo campo"
- `null` o `''` = "cancella questo campo"

### Auth

- JWT in HttpOnly cookie (`token`)
- Scadenza: 2 ore
- Rate limiting su login: 5 tentativi, 15 min lockout
- Nuovi utenti richiedono approvazione admin

## File Chiave

| File | Scopo |
|------|-------|
| `lib/db/turso.ts` | Client database |
| `lib/db/setup.ts` | Schema iniziale DB |
| `lib/auth/auth.ts` | JWT helpers, login, register |
| `lib/auth/validation.ts` | Rate limiting, IP |
| `lib/context/AuthContext.tsx` | Stato autenticazione |
| `lib/context/NotesContext.tsx` | Stato globale note |
| `middleware.ts` | Protezione route + CSP |

## Setup DB

```bash
# Prima volta
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx lib/db/setup.ts

# Migrazioni successive
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx lib/db/migrate-*.ts
```

## Test e Build

```bash
npm run build    # Verifica build
npm run lint     # ESLint
npm run dev      # Dev server
npx playwright test  # E2E tests
```

## Sicurezza

- Mai esporre credenziali o token
- Query sempre parametrizzate
- Validare tutti gli input utente
- Rate limiting su login
- JWT in HttpOnly cookies
- Nonce-based CSP in middleware
