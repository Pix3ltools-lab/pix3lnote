# Contributing to Pix3lNote

Thank you for your interest in contributing to Pix3lNote! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Open an issue** with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS version

### Suggesting Features

1. **Open an issue** with the `enhancement` label
2. **Describe the feature** and its use case
3. **Explain why** it would benefit users
4. **Consider alternatives** you have thought about

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the code style below
4. **Test thoroughly** — run the E2E suite and verify the UI manually
5. **Commit with clear messages**: use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Open a Pull Request** with a clear title, description, and screenshots for UI changes

## Development Setup

### Prerequisites

- Node.js 20+ and npm
- Git
- A Turso database (or sqld running locally)

### Installation

```bash
git clone https://github.com/Pix3ltools-lab/pix3lnote.git
cd pix3lnote
npm install
cp .env.example .env
# edit .env with your credentials
npm run db:setup
npm run dev
```

The app is available at `http://localhost:3000`.

### Running Tests

Start a local sqld instance first (or use your Turso database), then:

```bash
E2E_USER_EMAIL=test@ci.local E2E_USER_PASSWORD=TestPassword123! npm run db:init
npm run build
npm run test
```

## Code Style Guidelines

### TypeScript / React

- **Strict mode** — all TypeScript errors must be resolved (`npm run type-check`)
- **Functional components** with hooks only — no class components
- **Zod** for all runtime API input validation (`lib/validation/`)
- **No `any`** — use typed Window intersections or proper generics
- Keep components **small and focused**; extract sub-components when a file exceeds ~200 lines

### File Organization

```
pix3lnote/
├── app/
│   ├── (app)/          # Protected routes
│   └── api/            # API routes (one file per resource)
├── components/
│   ├── layout/         # Header, Sidebar
│   ├── note/           # Note-specific components
│   └── ui/             # Generic reusable components
├── lib/
│   ├── auth/           # JWT, rate limiting, apiAuth
│   ├── context/        # React contexts
│   ├── db/             # Turso client, setup, query helpers
│   ├── hooks/          # Custom hooks
│   └── validation/     # Zod schemas
└── types/              # TypeScript types
```

### Naming Conventions

- **Components**: PascalCase (`NoteCard.tsx`)
- **Utility files**: camelCase (`noteColors.ts`)
- **Variables**: camelCase (`activeLabel`)
- **Constants**: UPPER_CASE (`NOTE_COLORS`)
- **Types / Interfaces**: PascalCase (`Note`, `Label`)

### Git Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add drag-and-drop reordering for notes
fix: color picker invisible on yellow notes
docs: update CONTRIBUTING with E2E setup instructions
refactor: extract usePix3lConfig into shared hook
test: add E2E coverage for label filtering
chore: bump Next.js to 14.3
```

### Adding a New Note Field

When adding a new field to notes, update these files in order:

1. `types/note.ts` — add the field to the `Note` interface
2. `lib/validation/noteSchemas.ts` — add Zod validation
3. `lib/db/setup.ts` — add column to the `notes` table (use `IF NOT EXISTS` migration pattern)
4. `lib/db/notes.ts` — update SELECT / INSERT / UPDATE helpers
5. `app/api/notes/route.ts` and `app/api/notes/[id]/route.ts` — handle the field in API routes
6. `components/note/NoteEditor.tsx` — add UI in the editor
7. `components/note/NoteCard.tsx` — render the field in the card if visible
8. `lib/context/NotesContext.tsx` — update optimistic state if needed

### Security Rules (mandatory)

- **Never** concatenate user input into SQL — use parameterized queries (`:param` syntax with `@libsql/client`)
- **Always** call `requireAuth()` at the start of protected API routes
- **Always** validate request body with a Zod schema before using values
- **Never** expose internal error messages to the client — return generic messages and log internally
- File uploads must check magic bytes, not just the `Content-Type` header

## Architecture Notes

### Authentication Flow

- `POST /api/auth/login` → sets `auth-token` HttpOnly cookie (JWT, 2h)
- All protected routes call `requireAuth(request)` from `lib/auth/apiAuth.ts`
- `AuthContext` checks `/api/auth/me` on mount and refreshes the token every 55 minutes

### State Management

- `NotesContext` holds the full notes and labels lists in memory
- Optimistic updates: state is changed immediately, then confirmed by the server
- On server error, state is rolled back to the previous value

### Note Colors

Note cards use inline hex styles (not Tailwind dynamic classes) because Tailwind cannot purge dynamically constructed class names. `NOTE_COLOR_MAP` (light) and `DARK_NOTE_COLOR_MAP` (dark) in `lib/noteColors.ts` define the `bg`, `border`, and `text` values for each of the 11 colors. Components read `isDark` from `useTheme()` and select the appropriate map.

### Full-Text Search

`searchNotes()` in `lib/db/notes.ts` sanitizes the query, splits it into tokens, wraps each token in `"term"*` for FTS5 prefix matching, and joins them with `OR`. Results are joined back to `notes` to enforce `user_id` ownership.

## Testing Checklist

Before submitting a PR, verify:

1. **Auth**: login, wrong password, registration flow (pending state), logout
2. **Notes**: create, edit title/content, change color, delete
3. **Pin/Unpin**: note moves to/from the pinned section
4. **Archive/Unarchive**: note disappears from home, appears in archive
5. **Labels**: create, assign to note, filter by label, delete label
6. **Search**: search by title, by content, no-match state, clear
7. **Dark mode**: toggle works, preference survives page reload
8. **Admin panel**: approve user, reset password, delete user
9. **Responsive**: test at mobile (375px), tablet (768px), desktop (1280px)
10. **Cross-browser**: Chrome, Firefox, Safari

## Questions?

Open an issue with the `question` label or check the [README](README.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Part of the [Pix3lTools](https://github.com/Pix3ltools-lab) suite.**
