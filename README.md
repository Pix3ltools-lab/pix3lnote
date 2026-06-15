# Pix3lNote

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turso](https://img.shields.io/badge/Turso-SQLite-4FF8D2.svg?style=flat&logo=turso)](https://turso.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg?style=flat)](#)
[![Platform](https://img.shields.io/badge/Platform-Vercel-black.svg?style=flat&logo=vercel)](https://vercel.com/)
[![Platform](https://img.shields.io/badge/Platform-Docker-2496ED.svg?style=flat&logo=docker&logoColor=white)](#deploy-with-docker)

A Google Keep-inspired note-taking application built with Next.js 14. Notes are stored securely in the cloud and sync across all your devices. Part of the [Pix3lTools](https://github.com/Pix3ltools-lab) suite, sharing authentication with [Pix3lBoard](https://board.pix3ltools.com) and [Pix3lWiki](https://wiki.pix3ltools.com).

## Features

### Notes
- **Rich Notes**: Title, content, and 11 background colors
- **Pin Notes**: Keep important notes at the top
- **Archive**: Move notes out of the way without deleting them
- **Labels**: Create and assign color-coded labels for organization
- **Label Filtering**: Click a label in the sidebar to see only matching notes
- **Full-Text Search**: FTS5-powered instant search across titles and content
- **Masonry Grid**: Responsive columns layout (1→2→3→4 columns)
- **Image Uploads**: Attach images to notes (Vercel Blob, max 5 MB, JPEG/PNG/GIF/WebP)

### User Experience
- **Dark / Light Mode**: Toggle in the header, preference saved in localStorage
- **Inline Creation**: Click the note creator at the top to expand and start typing
- **Auto-save**: Notes save automatically on blur
- **Keyboard Shortcuts**: `Esc` to close editors and modals
- **Optimistic Updates**: Pin, archive, and label actions feel instant
- **Responsive Design**: Works on desktop, tablet, and mobile

### Cloud & Authentication
- **User Accounts**: Register and login with email/password
- **Admin Approval**: New accounts require admin approval before access
- **Secure Sessions**: JWT stored in HttpOnly cookies (2-hour expiry)
- **Shared Auth**: Same user database as Pix3lBoard and Pix3lWiki — log in once, access all apps

### Admin Panel
- **User Management**: View all users with note count
- **User Approval**: Approve pending registrations
- **Create Users**: Admin can create pre-approved accounts
- **Delete Users**: Remove users and all their data
- **Reset Passwords**: Admin can reset any user's password

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Turso (libSQL / SQLite cloud)
- **File Storage**: Vercel Blob
- **Authentication**: JWT (jose) + bcryptjs
- **Validation**: Zod schema validation
- **Styling**: Tailwind CSS 3
- **Search**: SQLite FTS5 with prefix wildcards
- **ID Generation**: nanoid

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Turso account (free tier available) — or an existing Pix3lBoard / Pix3lWiki database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Pix3ltools-lab/pix3lnote.git
cd pix3lnote
```

2. Install dependencies:
```bash
npm install
```

3. Create a Turso database (skip if sharing the Pix3lBoard database):
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create pix3lnote

# Get URL and token
turso db show pix3lnote --url
turso db tokens create pix3lnote
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
JWT_SECRET="your-random-secret-key-min-32-chars"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"  # optional, for image uploads
PIX3LBOARD_URL="https://board.pix3ltools.com"   # optional cross-app link
```

> **Shared database**: Pix3lNote uses `CREATE TABLE IF NOT EXISTS` so it can safely share the Turso database with Pix3lBoard and Pix3lWiki. Use the same `JWT_SECRET` across all three apps for single sign-on.

5. Initialize the database:
```bash
npm run db:setup
```

6. Create an admin user (required — registration needs approval):
```bash
node -e "
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
(async () => {
  const hash = await bcrypt.hash('YourPassword123!', 12);
  const now = new Date().toISOString();
  await client.execute({ sql: 'INSERT OR IGNORE INTO users (id, email, password_hash, name, is_admin, is_approved, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, ?, ?)', args: ['admin-1', 'admin@example.com', hash, 'Admin', now, now] });
  console.log('Admin created.');
})();
"
```

7. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Storage → Blob)
   - `PIX3LBOARD_URL` (optional, for the header link)
4. Deploy — Vercel triggers automatically on every push to `main`

### Deploy with Docker

Pix3lNote ships as part of the [Pix3lTools Docker stack](https://github.com/Pix3ltools-lab/pix3ltools-deploy). Run the full stack with one command:

```bash
git clone https://github.com/Pix3ltools-lab/pix3ltools-deploy.git
cd pix3ltools-deploy
./setup.sh
```

Pix3lNote is available on port **3003** (`http://localhost:3003`).

To build only the Pix3lNote image:
```bash
docker build -t pix3lnote .
docker run -p 3000:3000 \
  -e TURSO_DATABASE_URL=http://localhost:8080 \
  -e JWT_SECRET=your-secret \
  pix3lnote
```

## Project Structure

```
pix3lnote/
├── app/
│   ├── (app)/                  # Protected routes (require auth)
│   │   ├── layout.tsx          # Auth guard + Header + Sidebar
│   │   ├── page.tsx            # Home — active notes
│   │   └── archive/page.tsx    # Archived notes
│   ├── admin/page.tsx          # Admin panel
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   └── api/
│       ├── auth/               # login, logout, me, refresh, register
│       ├── admin/              # users, approve, reset-password
│       ├── notes/              # CRUD + archive + pin + labels
│       ├── labels/             # CRUD
│       ├── search/             # FTS5 full-text search
│       ├── upload/             # Vercel Blob image upload
│       └── health/             # Health check endpoint
├── components/
│   ├── layout/
│   │   ├── Header.tsx          # Search bar, theme toggle, user menu, app links
│   │   └── Sidebar.tsx         # Notes/Archive nav + label management
│   ├── note/
│   │   ├── NoteCard.tsx        # Note card with pin/archive toolbar
│   │   ├── NoteCreator.tsx     # Inline note creation box
│   │   ├── NoteEditor.tsx      # Full note editor modal
│   │   ├── NoteGrid.tsx        # Masonry columns grid
│   │   └── ColorPicker.tsx     # 11-color palette
│   └── ui/
│       └── Modal.tsx           # Base modal component
├── lib/
│   ├── auth/
│   │   ├── auth.ts             # JWT helpers, register, login, admin functions
│   │   ├── validation.ts       # Rate limiting (email+IP), input sanitization
│   │   └── apiAuth.ts          # requireAuth() shared helper
│   ├── context/
│   │   ├── AuthContext.tsx     # User state, signIn/signUp/signOut
│   │   ├── NotesContext.tsx    # Notes/labels state, CRUD, optimistic updates
│   │   └── ThemeContext.tsx    # Dark/light theme with localStorage persistence
│   ├── db/
│   │   ├── turso.ts            # Singleton Turso client
│   │   ├── setup.ts            # Schema initialization (CREATE TABLE IF NOT EXISTS)
│   │   └── notes.ts            # Query helpers (getNotes, searchNotes, etc.)
│   ├── hooks/
│   │   └── usePix3lConfig.ts   # Cross-app URL config from window.__PIX3L_CONFIG__
│   ├── validation/
│   │   └── noteSchemas.ts      # Zod schemas for notes and labels
│   ├── noteColors.ts           # Color maps for light and dark mode
│   └── env.ts                  # Environment variable validation
├── types/
│   └── note.ts                 # Note, Label, Attachment, NoteColor types
├── e2e/                        # Playwright E2E tests
├── scripts/
│   └── db-init.sh              # Schema setup + test admin user (for CI)
├── middleware.ts               # Nonce-based CSP headers
├── playwright.config.ts
├── Dockerfile
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Database Schema

Pix3lNote adds the following tables to the shared Turso database (existing tables are left untouched):

| Table | Description |
|---|---|
| `users` | User accounts (shared with Pix3lBoard / Pix3lWiki) |
| `rate_limits` | Login brute-force protection (shared) |
| `notes` | Notes with title, content, color, pin/archive state |
| `labels` | User-defined color labels |
| `note_labels` | Many-to-many note ↔ label association |
| `note_attachments` | Image uploads linked to notes |
| `notes_fts` | FTS5 virtual table for full-text search |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript compiler (no emit)
npm run db:setup     # Initialize database tables
npm run db:init      # Setup + create CI test user (reads E2E_USER_*)
npm run test         # Run Playwright E2E tests
npm run test:ui      # Playwright UI mode
```

## Security

- **Authentication**: JWT (HS256, 2-hour expiry) in HttpOnly + SameSite cookies
- **Password hashing**: bcrypt with factor 12
- **Rate limiting**: per-email (5 attempts, 15 min lockout) + per-IP (20 attempts, 30 min lockout), fail-closed on DB error
- **Input validation**: Zod on all API inputs, parameterized SQL queries
- **File uploads**: magic-byte + MIME whitelist, 5 MB limit
- **CSP**: nonce-based `Content-Security-Policy` (generated per request in Edge middleware)
- **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`

## Browser Compatibility

- Chrome / Edge: fully supported
- Firefox: fully supported
- Safari: fully supported
- Mobile browsers: responsive design

## Known Limitations

- No drag & drop to reorder notes (position field is stored, UI not implemented)
- No offline support
- Image upload UI not exposed in the note editor (API endpoint is ready)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full release history.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Turso](https://turso.tech/)
- [Tailwind CSS](https://tailwindcss.com/)
- [jose](https://github.com/panva/jose)
- [Zod](https://zod.dev/)
- [Playwright](https://playwright.dev/)

---

**Part of [Pix3lTools](https://x.com/pix3ltools)**

Made with the help of Claude Code
