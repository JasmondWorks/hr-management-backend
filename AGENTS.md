<!-- BEGIN:express-agent-rules -->

# This is NOT the Express.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/express/dist/docs/` before writing any code. Heed deprecation notices.

# always use migration for prisma and not push for schema updates

<!-- END:express-agent-rules -->

# Migrations must never destroy data

Tables and columns are never dropped, and no migration may lose rows. Treat every
existing row as production data that someone will ask for again.

**Forbidden in a migration, without exception:**

- `DROP TABLE`
- `DROP COLUMN`
- `prisma migrate reset`, `prisma db push`, or anything else that recreates the schema
- destructive `ALTER COLUMN` (narrowing a type, adding `NOT NULL` without a backfill,
  shrinking a length) — these fail or truncate on live data
- deleting a `prisma/migrations/` folder that has already been applied

`prisma migrate dev` refuses to run non-interactively when it detects data loss.
That refusal is a signal to change the plan, never to reach for `--force`,
`--accept-data-loss`, or a hand-written `DROP`.

**Retire things by expanding, then contracting — and stop after the expand.**

To replace a column or table:

1. Add the new column/table in one migration. Never reuse the old name.
2. Backfill it from the old one in the *same* migration, so no deploy exists where
   the new home is empty. Carry only rows that are still valid, and say in a SQL
   comment why any row is skipped.
3. Stop reading and writing the old column in application code.
4. Leave the old column in place, unused. That is the finished state.

Step 5 — actually removing it — is a separate, human-approved decision. Do not
take it on your own initiative, and do not bundle it into an unrelated migration.

**Renames** follow the same shape: add the new name, backfill, switch the code,
leave the old column. `ALTER TABLE ... RENAME COLUMN` is destructive to any
running instance still reading the old name.

**Before and after any migration touching existing rows**, count what you are
about to change and report the numbers (`n carried over`, `n skipped and why`).
A migration whose effect you cannot state in rows is not ready to run.

If a task genuinely requires losing data, stop and ask. Say plainly what would be
lost and how many rows, and let the human decide — an explicit instruction to drop
something is the only thing that authorises it.
