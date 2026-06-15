# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-15

### Added

- **App name color scheme** — "Pix3lNote" in the header now uses the shared Pix3lTools brand colors: "3" in red (`#ef4444`), "l" in blue (`#3b82f6`), matching Pix3lBoard and Pix3lWiki
- **Version badge** — version number displayed next to the app name in the header

### Changed

- Version promoted from 0.1.0 to 1.0.0 — first stable release

---

## [0.1.0] - 2026-06-15

### Added

- **Notes CRUD** — create, read, update, and delete notes with title, content, and 11 background colors (default, red, orange, yellow, green, teal, blue, purple, pink, brown, gray)
- **Pin / Unpin** — pin important notes to keep them at the top of the grid; optimistic update with server sync
- **Archive / Unarchive** — move notes to the archive view without deleting them; pinned notes are automatically unpinned on archive
- **Labels** — create color-coded labels, assign multiple labels per note, filter the home view by label; inline CRUD in the sidebar
- **Full-Text Search** — FTS5-powered search with prefix wildcards; result count shown; clear button to return to the notes grid
- **Masonry grid** — responsive CSS columns layout (1 → 2 → 3 → 4 columns); `break-inside-avoid` prevents card splits
- **NoteCreator** — inline creation box at the top of the home page, expands on focus, saves on outside click or `Esc`
- **NoteEditor** — modal editor with auto-save on blur, color picker, label picker, archive/delete actions
- **Dark / Light mode** — toggle button in the header (sun/moon icon); preference persisted in `localStorage`; system `prefers-color-scheme` used as default; anti-flash inline script prevents wrong-theme flicker
- **Image upload API** — `POST /api/upload` stores images in Vercel Blob (max 5 MB, JPEG/PNG/GIF/WebP only)
- **Authentication** — JWT (HS256, 2h expiry) in HttpOnly cookies; registration requires admin approval; same database and JWT secret compatible with Pix3lBoard and Pix3lWiki for single sign-on
- **Rate limiting** — per-email (5 attempts / 15 min) and per-IP (20 attempts / 30 min) on login and register; fail-closed on DB error
- **Admin panel** — user list with note count, approve/reject pending registrations, create users, reset passwords, delete users
- **REST API** — internal JSON API covering all note, label, search, and auth operations
- **Health endpoint** — `GET /api/health` returns version and deployed commit SHA (used for deploy verification)
- **Nonce-based CSP** — `Content-Security-Policy` generated per request in Next.js Edge middleware; `unsafe-eval` added only in development for hot reload
- **Cross-app link** — "Pix3lBoard" link in the header, URL configurable via `PIX3LBOARD_URL` env var with hardcoded production default
- **Playwright E2E tests** — 21 tests across 4 suites (auth, notes, labels, search); shared auth state reused across test projects; `scripts/db-init.sh` initialises the DB and creates a CI admin user
- **CI workflow** — GitHub Actions: lint + type-check → E2E tests with sqld service container; Playwright report uploaded as artifact
- **Dockerfile** — multi-stage build (deps → builder → runner); non-root `node` user; health check
- **Docker Compose** — added `pix3lnote` service on port 3002 to the shared Pix3lTools `docker-compose.yml`
