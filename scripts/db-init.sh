#!/usr/bin/env bash
# CI database initialisation: schema + test admin user
set -euo pipefail

echo "==> Running database setup..."
npx tsx lib/db/setup.ts

# Create test admin user if credentials are provided
if [ -n "${E2E_USER_EMAIL:-}" ] && [ -n "${E2E_USER_PASSWORD:-}" ]; then
  echo "==> Creating test admin user ($E2E_USER_EMAIL)..."
  node -e "
    const bcrypt = require('bcryptjs');
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
    (async () => {
      const hash = await bcrypt.hash(process.env.E2E_USER_PASSWORD, 10);
      const id = 'ci-test-user-' + Date.now();
      const now = new Date().toISOString();
      await client.execute({
        sql: \`INSERT OR IGNORE INTO users
              (id, email, password_hash, name, is_admin, is_approved, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, 1, ?, ?)\`,
        args: [id, process.env.E2E_USER_EMAIL, hash, 'CI Admin', now, now],
      });
      console.log('  Test admin user created (or already exists).');
    })();
  "
  echo "==> Creating second test user for sharing tests (e2e-target@pix3lnote.test)..."
  node -e "
    const bcrypt = require('bcryptjs');
    const { createClient } = require('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
    (async () => {
      const hash = await bcrypt.hash(process.env.E2E_USER_PASSWORD, 10);
      const id = 'ci-test-share-target-' + Date.now();
      const now = new Date().toISOString();
      await client.execute({
        sql: \`INSERT OR IGNORE INTO users
              (id, email, password_hash, name, is_admin, is_approved, created_at, updated_at)
              VALUES (?, 'e2e-target@pix3lnote.test', ?, NULL, 0, 1, ?, ?)\`,
        args: [id, hash, now, now],
      });
      console.log('  Share-target test user created (or already exists).');
    })();
  "
else
  echo "==> Skipping test user (E2E_USER_EMAIL / E2E_USER_PASSWORD not set)"
fi

echo "==> Database initialisation complete!"
