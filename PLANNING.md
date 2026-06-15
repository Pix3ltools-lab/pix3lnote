# Pix3lnote — Pianificazione

App stile Google Keep con autenticazione JWT condivisa con pix3lboard/pix3lwiki.

**Stack**: Next.js 14 (App Router) · TypeScript · Turso (SQLite cloud) · Vercel Blob · Tailwind CSS · JWT + bcryptjs

---

## Ambienti di esecuzione

L'applicazione deve poter girare in tutti e tre gli ambienti seguenti, come pix3lboard e pix3lwiki:

| Ambiente | Modalità | Note |
|----------|----------|------|
| **Locale** | `npm run dev` | Sviluppo, debug. DB Turso remoto o sqld locale |
| **Docker** | `docker-compose up` | Test integrazione, CI locale. Turso emulato con sqld |
| **Vercel** | Deploy automatico da GitHub | Produzione. DB Turso cloud, Blob storage |

Ogni ambiente usa le stesse variabili d'ambiente (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`); cambia solo il valore delle variabili.

---

## Stato avanzamento

| Fase | Stato |
|------|-------|
| 1 — Setup progetto | ✅ Completata |
| 2 — Database | ✅ Completata |
| 3 — Autenticazione | ✅ Completata |
| 4 — API Notes | ✅ Completata |
| 5 — UI | ✅ Completata |
| 6 — Test E2E | ✅ Completata |
| 7 — CI/CD e Deploy | 🔶 Parziale (Vercel mancante) |
| 8 — Documentazione | ⬜ Da fare |

---

## Fasi di sviluppo

### Fase 1 — Setup progetto

- [x] Inizializzare repo Next.js 14 con TypeScript e Tailwind
- [x] Configurare ESLint, tsconfig strict
- [x] Creare `.env.example` con le variabili necessarie
- [x] Inizializzare repo Git con `.gitignore`
- [x] Creare `CLAUDE.md` con istruzioni per Claude Code

### Fase 2 — Database

- [ ] Creare database Turso dedicato (`pix3lnote`) ← da fare manualmente
- [x] Scrivere `lib/db/turso.ts` (client Turso)
- [x] Scrivere `lib/db/setup.ts` con schema iniziale:
  - `users` (id, email, password_hash, name, is_admin, is_approved, created_at, updated_at)
  - `rate_limits` (id, identifier, attempts, locked_until, created_at, updated_at)
  - `notes` (id, user_id, title, content, color, is_pinned, is_archived, position, created_at, updated_at)
  - `labels` (id, user_id, name, color, created_at)
  - `note_labels` (note_id, label_id)
  - `attachments` (id, note_id, url, filename, size, mime_type, created_at)
  - `notes_fts` (FTS5 virtual table + trigger insert/update/delete)
- [ ] Testare connessione e setup DB ← dopo creazione DB Turso

### Fase 3 — Autenticazione

Copiare e adattare il pattern da pix3lboard/pix3lwiki:

- [x] `lib/auth/auth.ts` — JWT helpers, register, login, getUserById, admin functions
- [x] `lib/auth/validation.ts` — rate limiting email + IP, getClientIp
- [x] `app/api/auth/login/route.ts`
- [x] `app/api/auth/logout/route.ts`
- [x] `app/api/auth/me/route.ts`
- [x] `app/api/auth/refresh/route.ts`
- [x] `app/api/auth/register/route.ts`
- [x] `middleware.ts` — nonce CSP per tutte le route
- [x] `lib/context/AuthContext.tsx` — stato utente lato client
- [x] Pagina `/login` e `/register`
- [x] Pagina admin per approvazione utenti (`/admin`)

### Fase 4 — API Notes (backend)

- [x] `app/api/notes/route.ts` — GET (lista, filtro archived/label) + POST (crea)
- [x] `app/api/notes/[id]/route.ts` — GET + PATCH + DELETE
- [x] `app/api/notes/[id]/archive/route.ts` — POST toggle archivio
- [x] `app/api/notes/[id]/pin/route.ts` — POST toggle pin
- [x] `app/api/labels/route.ts` — GET + POST
- [x] `app/api/labels/[id]/route.ts` — PATCH + DELETE
- [x] `app/api/notes/[id]/labels/route.ts` — POST + DELETE (assegna/rimuovi etichette)
- [x] `app/api/upload/route.ts` — upload immagini su Vercel Blob (max 5 MB, JPEG/PNG/GIF/WebP)
- [x] `app/api/search/route.ts` — ricerca full-text FTS5 con prefix wildcard
- [x] Validazione Zod per tutti gli input (`lib/validation/noteSchemas.ts`)
- [x] `lib/auth/apiAuth.ts` — helper `requireAuth` condiviso
- [x] `lib/db/notes.ts` — query helper (getNotes, getNoteById, searchNotes, …)
- [x] `types/note.ts` — tipi Note, Label, Attachment, NoteColor

### Fase 5 — UI Note (frontend)

- [x] Layout principale autenticato (`app/(app)/layout.tsx`) con redirect se non autenticato
- [x] `lib/context/NotesContext.tsx` — stato globale note, CRUD, update ottimistico per pin/archive/labels
- [x] Componente `NoteCard` — card con colore, pin (hover), label chips, toolbar archive
- [x] Componente `NoteEditor` — modale con title, content, color picker, label picker, delete, archive
- [x] Componente `NoteCreator` — box inline espandibile in cima alla home
- [x] Componente `NoteGrid` — layout a colonne masonry (CSS columns)
- [x] `components/layout/Header.tsx` — ricerca live con FTS5, user menu, logo
- [x] `components/layout/Sidebar.tsx` — nav Notes/Archive, etichette con CRUD inline
- [x] Vista archivio (`/archive`)
- [x] Gestione colori nota (11 colori, palette visiva)
- [ ] Drag & drop per riordinare — rimandato (opzionale)
- [ ] Upload immagini nella nota — API pronta, UI non implementata

### Fase 6 — Test E2E

- [x] Configurare Playwright (`playwright.config.ts`) con progetti setup + chromium
- [x] `e2e/auth.setup.ts` — login e salvataggio sessione per tutti i test
- [x] `e2e/auth.spec.ts` — login valido, password errata, redirect, logout, register pending
- [x] `e2e/notes.spec.ts` — crea, modifica, elimina, pin, archivio/unarchivio, colori
- [x] `e2e/labels.spec.ts` — crea, assegna, filtra, rimuovi, elimina etichetta
- [x] `e2e/search.spec.ts` — ricerca per titolo, contenuto, nessun risultato, clear, conteggio
- [x] `e2e/fixtures.ts` — helpers: loginAs, createNote, openNote, closeNote, uniqueName
- [x] `scripts/db-init.sh` — setup schema + creazione utente admin per CI

### Fase 7 — CI/CD e Deploy

- [x] `scripts/db-init.sh` — setup schema + utente admin CI (completato in Fase 6)
- [x] `Dockerfile` per build Docker locale
- [x] Aggiornare `docker-compose.yml` nel parent con servizio pix3lnote (porta 3002)
- [x] Creare repo GitHub (`Pix3ltools-lab/pix3lnote`) e fare push
- [x] `.github/workflows/ci.yml` — lint + type-check + E2E (sqld service container)
- [ ] Configurare progetto su Vercel collegato al repo GitHub
- [ ] Configurare variabili d'ambiente su Vercel (`TURSO_*`, `JWT_SECRET`, `BLOB_READ_WRITE_TOKEN`)

### Fase 8 — Documentazione

- [ ] `README.md`
- [ ] `USER_MANUAL.md`
- [ ] `CHANGELOG.md`

---

## Struttura cartelle target

```
pix3lnote/
├── app/
│   ├── (app)/              # Route protette
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Home — note attive
│   │   └── archive/
│   │       └── page.tsx
│   ├── login/
│   ├── register/
│   ├── admin/
│   └── api/
│       ├── auth/
│       ├── notes/
│       ├── labels/
│       ├── search/
│       └── upload/
├── components/
│   ├── ui/                 # Componenti base (Button, Input, Modal...)
│   ├── note/               # NoteCard, NoteEditor, NoteGrid, NoteList
│   ├── sidebar/            # Navigazione + etichette
│   └── layout/             # Header, SearchBar
├── lib/
│   ├── auth/               # JWT, rate limit
│   ├── context/            # AuthContext, NotesContext
│   ├── db/                 # Turso client, setup, migrazioni
│   └── validation/         # Zod schemas
├── types/
│   ├── note.ts
│   ├── label.ts
│   └── user.ts
├── e2e/
├── scripts/
│   └── db-init.sh
├── middleware.ts
├── playwright.config.ts
├── CLAUDE.md
└── PLANNING.md
```

---

## Variabili d'ambiente

```env
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
JWT_SECRET=
BLOB_READ_WRITE_TOKEN=
```

---

## Stima tempi

| Fase | Stima |
|------|-------|
| 1 — Setup | 1-2 ore |
| 2 — Database | 2-3 ore |
| 3 — Auth | 3-4 ore |
| 4 — API Notes | 4-6 ore |
| 5 — UI | 8-12 ore |
| 6 — Test E2E | 4-6 ore |
| 7 — CI/CD e Deploy | 2-3 ore |
| 8 — Documentazione | 1-2 ore |
| **Totale** | **~25-38 ore** |
