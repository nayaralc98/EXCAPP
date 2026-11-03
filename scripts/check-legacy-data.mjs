// `npm run check` and `npm run db:migrate` (fixA 2026-10-12, P0 privacy): real users' records never go into the
// project's files. A legacy migration's agent wrote the old app's users (e-mails, password hashes, sessions) into a
// drizzle data migration, so every export, duplicate, template and GitHub push of the code carried them. Rows move
// inside the database (a script that reads them when it runs), never through a migration, a seed or a data file.
// Platform-owned.
//
// legacystub (2026-11-03, Fibolim/Appify): projects migrated before fixA keep such a data migration that dev and live
// already applied. It can be neither kept (this check) nor edited (the applied-migration check) nor deleted (the ledgers
// name it), so every build failed. The platform replaces it with its data-free stub (`legacyStub`): the statements that
// are not data (DDL) stay, every INSERT/UPDATE/DELETE goes, and a first line names the sha256 of the file the databases
// applied. `scripts/migrate.ts` (and Totalum's publish) accept that stub for exactly that ledger hash; the rows stay in
// the databases. `migrate.ts` writes it itself (`stubAppliedLegacyMigrations`) once every database applied the file.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// bcrypt, argon2 and better-auth's scrypt `salt:key` (the hashes the old and new sign-ins store)
const HASH = /\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}|\$argon2(?:id|i|d)\$v=\d+\$|\b[0-9a-f]{32}:[0-9a-f]{128}\b/;
// the old engine's record ids (MongoDB ObjectIds), quoted: a handful in one file is a copy of its data
const OLD_ID = /["'`]([0-9a-f]{24})["'`]/g;
const MAX_OLD_IDS = 5;
const SKIP = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;

/** What `text` (the file `path`) holds of real users' records, or `null`. */
export function legacyDataIn(text) {
  if (HASH.test(text)) return 'a password hash';
  const ids = new Set([...text.matchAll(OLD_ID)].map((m) => m[1]));
  return ids.size >= MAX_OLD_IDS ? `${String(ids.size)} old record ids` : null;
}

/** The first line of a data-free stub: the sha256 (hex) of the applied file it replaces follows. */
export const LEGACY_STUB_MARKER = '-- totalum:legacy-data-removed sha256=';
const BREAKPOINT = '--> statement-breakpoint';
// a line that starts a statement writing rows (what a data migration holds) / one that changes the schema
const DATA_LINE = /^\s*(?:INSERT|UPDATE|DELETE|REPLACE|UPSERT|WITH)\b/im;
const SCHEMA_LINE =
  /^\s*(?:CREATE\s+(?:UNIQUE\s+|VIRTUAL\s+)?(?:TABLE|INDEX|VIEW|TRIGGER)|ALTER\s+TABLE|DROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)|PRAGMA)\b/im;
const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const meaningful = (st) => st.replace(/--[^\n]*/g, '').trim() !== '';

/**
 * The data-free stub of the migration `original` (its exact text, as the ledger hashed it), or `null` when a statement
 * mixes schema and data (no safe automatic cut: such a file stays refused).
 */
export function legacyStub(original) {
  const kept = [];
  for (const st of original.split(BREAKPOINT).filter(meaningful)) {
    const data = DATA_LINE.test(st);
    if (data && SCHEMA_LINE.test(st)) return null;
    if (!data) kept.push(st.trim());
  }
  return (
    `${LEGACY_STUB_MARKER}${sha256(original)}\n` +
    "-- Totalum removed the old app's records from this migration (privacy: the project's files never hold users' data).\n" +
    '-- Every database that applied it keeps them; the line above names the file it applied. Never edit this file.\n' +
    `${kept.length ? kept.join(`\n${BREAKPOINT}\n`) : 'SELECT 1;'}\n`
  );
}

/** The sha256 of the applied file a stub stands for, or `null` when `text` is not a valid data-free stub. */
export function stubbedHash(text) {
  const m = /^-- totalum:legacy-data-removed sha256=([0-9a-f]{64})\r?\n/.exec(text);
  return m && !DATA_LINE.test(text) && !legacyDataIn(text) ? m[1] : null;
}

/** The files git would commit (tracked + new, not ignored) holding real users' records, as `{ path, what }`. */
export function legacyDataFiles(root = '.') {
  const r = spawnSync('git', ['ls-files', '-z', '-co', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) return []; // not a git tree (a laptop download): nothing to judge
  const found = [];
  for (const path of r.stdout.split('\0').filter((p) => p && !SKIP.test(p))) {
    let text;
    try {
      text = readFileSync(`${root}/${path}`, 'utf8');
    } catch {
      continue; // deleted in the work tree
    }
    if (text.includes('\0')) continue; // binary
    const what = legacyDataIn(text);
    if (what) found.push({ path, what });
  }
  return found;
}

const refusalOf = (found) =>
  found.length
    ? `LEGACY_DATA_IN_CODE\n${found.map((f) => `  ${f.path}: ${f.what}`).join('\n')}\n` +
      "  Records of real users never go into this project's files (migrations, seeds, JSON/TS/SQL data): every " +
      'export, duplicate, template and GitHub push copies the code. Delete that data from the file (a migration not ' +
      'applied yet: delete the file and its `drizzle/meta/_journal.json` entry) and insert the rows from a script that ' +
      'reads them when it runs and writes them through the database (`totalumD1()`), never into a file. A migration ' +
      'every database already applied is replaced by its data-free stub by `npx tsx scripts/migrate.ts --check-applied` ' +
      '(the build runs it): never edit such a migration yourself.'
    : null;

/** The refusal the agent reads (one line per file), or `null`: the files git would commit (tracked + new, not ignored). */
export function legacyDataRefusal(root = '.') {
  return refusalOf(legacyDataFiles(root));
}

/**
 * legacystub (2026-11-03): the ledger of the database this project's key reads (dev, or live on a project without a
 * dev database) through SDK-API, as `when → hash`; `null` when it cannot be read (no key: a laptop).
 */
async function ledgerOverApi(env = process.env) {
  const url = env['TOTALUM_SDK_API_URL'];
  const key = env['TOTALUM_PROJECT_KEY'];
  if (!url || !key) return null;
  for (const target of ['dev', 'live']) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/v1/db/query`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          'x-totalum-env': target,
        },
        body: JSON.stringify({ sql: 'SELECT hash, created_at FROM "_migrations"', params: [], mode: 'all' }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) return new Map((body?.data?.results ?? []).map((r) => [Number(r.created_at), r.hash]));
      if (target === 'dev' && body?.errors?.errorCode === 'DEV_DATABASE_NOT_FOUND') continue;
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * The check `npm run check` and the build run. legacystub: in a project whose `scripts/migrate.ts` predates the stub
 * (the template refresh keeps it while the project's packages differ from the template's), a records migration its
 * database already applied can be neither stubbed (that migrate.ts would refuse the edited file) nor removed: it is
 * reported, not refused, until migrate.ts follows the template and the build replaces it with its stub. Everything
 * else holding records is refused.
 */
export async function legacyDataCheck(root = '.', env = process.env) {
  const found = legacyDataFiles(root);
  const migrate = `${root}/scripts/migrate.ts`;
  const stubAware =
    !existsSync(migrate) || readFileSync(migrate, 'utf8').includes('stubAppliedLegacyMigrations');
  let journal = [];
  try {
    journal = JSON.parse(readFileSync(`${root}/drizzle/meta/_journal.json`, 'utf8')).entries ?? [];
  } catch {
    /* no migrations */
  }
  const migrationOf = (path) => journal.find((e) => `drizzle/${e.tag}.sql` === path);
  const candidates = stubAware ? [] : found.filter((f) => migrationOf(f.path));
  const ledger = candidates.length ? await ledgerOverApi(env) : null;
  const kept = ledger
    ? candidates.filter(
        (f) =>
          ledger.get(Number(migrationOf(f.path)?.when)) === sha256(readFileSync(`${root}/${f.path}`, 'utf8')),
      )
    : [];
  return {
    refusal: refusalOf(found.filter((f) => !kept.includes(f))),
    warning: kept.length
      ? `legacy data: ${kept.map((f) => f.path).join(', ')} already applied with real users' records; ` +
        "kept as it is until scripts/migrate.ts follows Totalum's template, which then replaces it with its data-free " +
        'stub (the rows stay in the database). Never edit or delete it yourself.'
      : null,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { refusal, warning } = await legacyDataCheck();
  if (warning) console.warn(warning);
  if (refusal) {
    console.error(refusal);
    process.exitCode = 1;
  }
}
