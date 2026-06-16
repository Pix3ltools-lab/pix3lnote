/**
 * Database Setup Script
 * Run with: npm run db:setup
 */

import { config } from 'dotenv';
config();

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('Missing TURSO_DATABASE_URL');
  process.exit(1);
}

const client = createClient({ url, ...(authToken ? { authToken } : {}) });

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Rate limits (login brute-force protection)
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'login',
  attempts INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL,
  locked_until TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (identifier, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'default',
  is_pinned INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_archived ON notes(user_id, is_archived);

-- Labels
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id);

-- Note <-> Label (many-to-many)
CREATE TABLE IF NOT EXISTS note_labels (
  note_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (note_id, label_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_note_labels_label_id ON note_labels(label_id);

-- Note shares (collaborative access to a note)
CREATE TABLE IF NOT EXISTS note_shares (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (note_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_user_id ON note_shares(user_id);

-- Checklist items inside a note
CREATE TABLE IF NOT EXISTS note_checklist_items (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  text TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_note_checklist_items_note_id ON note_checklist_items(note_id);

-- Attachments (images stored on Vercel Blob)
CREATE TABLE IF NOT EXISTS note_attachments (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON note_attachments(note_id);

-- Full-text search on notes (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid'
);
`;

const triggers = [
  `CREATE TRIGGER IF NOT EXISTS notes_fts_insert
  AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
  END`,
  `CREATE TRIGGER IF NOT EXISTS notes_fts_delete
  AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
  END`,
  `CREATE TRIGGER IF NOT EXISTS notes_fts_update
  AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
    INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
  END`,
];

async function setup() {
  console.log('Setting up pix3lnote database...\n');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
      const match = statement.match(/(?:TABLE|INDEX|TABLE\s+IF\s+NOT\s+EXISTS)(?:\s+IF\s+NOT\s+EXISTS)?\s+(\w+)/i);
      if (match) console.log(`  Created: ${match[1]}`);
    } catch (error) {
      console.error(`Error: ${statement.substring(0, 60)}...`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('\nSetting up FTS triggers...');
  for (const statement of triggers) {
    try {
      await client.execute(statement);
      const match = statement.match(/TRIGGER\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
      if (match) console.log(`  Created: ${match[1]}`);
    } catch (error) {
      console.error(`Error creating trigger: ${statement.substring(0, 60)}...`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('\nVerifying tables...');
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type IN ('table', 'trigger') ORDER BY name"
  );
  console.log('Objects:', tables.rows.map(r => r.name).join(', '));
  console.log('\nDatabase setup complete!');
}

setup().catch(console.error);
