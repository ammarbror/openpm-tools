---
name: query-db
description: Query and inspect PostgreSQL databases (staging and prod readonly) using the OpenPM CLI or SQL query engine.
---

# Query DB Skill

Use this skill to inspect, query, and verify data in PostgreSQL databases (`staging` and `prod`).

## Configuration & Environment Variables
The CLI automatically loads database configurations from your environment (or defaults to local `.pgpass` / environment files):
- **Staging**: `DB_STAGING_HOST`, `DB_STAGING_PORT`, `DB_STAGING_USER`, `DB_STAGING_PASSWORD`, `DB_STAGING_NAME`
- **Production**: `DB_PROD_HOST`, `DB_PROD_PORT`, `DB_PROD_USER`, `DB_PROD_PASSWORD`, `DB_PROD_NAME`

## Environments

1. **Production (`prod`)**:
   - Host: Configured via `DB_PROD_HOST` (default port 5432)
   - User: `readonly_user` (or read-only user)
   - **Strict Read-Only Enforcement**: Production queries are always executed in read-only transactions (`SET TRANSACTION READ ONLY;`). Any `INSERT`, `UPDATE`, `DELETE`, or DDL statements will be blocked immediately.

2. **Staging (`staging`)**:
   - Host: Configured via `DB_STAGING_HOST` (default port 5432)
   - User: `app_user`
   - Read-only by default, but allows write transactions when `--read-write` is specified.

---

## Usage

### 1. Using the CLI

From the `openpm-tools` workspace:

```bash
# Query production (formatted table output)
npx openpm-tools query-db prod "SELECT count(*) FROM projects;"

# Query production (JSON output)
npx openpm-tools query-db prod "SELECT id, name, status FROM projects LIMIT 5;" --json

# Query staging (JSON output)
npx openpm-tools query-db staging "SELECT id, name, status FROM projects LIMIT 5;" --json

# Execute write query on staging (explicit permission required)
npx openpm-tools query-db staging "UPDATE projects SET ... WHERE id = '...';" --read-write
```

### 2. Using Direct psql (macOS local terminal)

Credentials for production `readonly_user` are pre-configured in `~/.pgpass`:

```bash
# Production read-only
psql -h <DB_PROD_HOST> -p 5432 -U readonly_user -d <DB_PROD_NAME> -c "SELECT count(*) FROM projects;"

# Staging
psql -h <DB_STAGING_HOST> -p 5432 -U app_user -d <DB_STAGING_NAME>
```

### 3. Programmatic Usage in TypeScript

```typescript
import { executeKartiniQuery } from 'src/kartini-db/index.ts';

// Query prod readonly
const result = await executeKartiniQuery('prod', 'SELECT id, name FROM projects LIMIT 10;', {
  json: true,
  strictReadOnly: true,
});

console.log(result.stdout);
```

---

## Best Practices & Safety Rules

1. **Production is Read-Only Always**: Never attempt writes on prod. The role `readonly_user` will disallow them at the engine level.
2. **Limit Result Sets**: Always include `LIMIT` clauses when inspecting tables to avoid heavy network transfers.
3. **Sensitive Data Protection**: Redact personal identifiably information (PII) like phone numbers, tokens, and hashed passwords when presenting query outputs to the user.
