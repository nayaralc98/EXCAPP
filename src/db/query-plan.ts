// qeff (2026-11-02): reads that grow with the data. A customer app read 461 million preview rows in two days: a list
// status matched with `OR` across two columns (no index usable: all of `servicios` for every row) and a 60 s poll
// taking `max(actualizado_en)` of 9 unindexed tables. Under `npm run dev` each new SELECT's plan is read once
// (`EXPLAIN QUERY PLAN`, the same database) and a plan that reads a whole table per row or per call is logged as a
// `slow query` line, which `try:form` reports. Data-independent: a small dev database shows it before it costs.
// Platform-owned; never edit.

type PlanRow = { id: number; parent: number; detail: string };

const LOOP = /^(SCAN|SEARCH) (\S+)(.*)$/;

/** What in a plan reads a whole table more than once per call, or for one value; `undefined` when nothing does. */
export function slowPlan(rows: PlanRow[]): string | undefined {
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const r of rows) {
    const m = LOOP.exec(r.detail);
    if (!m) continue;
    const [, op, table = '', rest = ''] = m;
    if (table === 'CONSTANT' || table.startsWith('(')) continue;
    if (/AUTOMATIC/.test(rest))
      return `no index on the column \`${table}\` is matched on: every call reads all of it`;
    if (op === 'SEARCH' && !/ USING /.test(rest))
      return `max()/min() reads all of \`${table}\`: index that column`;
    if (op !== 'SCAN' || / USING /.test(rest)) continue;
    const innerLoop = rows.some((s) => s.parent === r.parent && s.id < r.id && LOOP.test(s.detail));
    let correlated = false;
    for (let p = byId.get(r.parent); p && !correlated; p = byId.get(p.parent))
      correlated = /^CORRELATED /.test(p.detail);
    if (innerLoop || correlated)
      return `reads all of \`${table}\` for every row: index each column it is matched on (an OR needs one on each side)`;
  }
  return undefined;
}

/** `?` placeholders outside string literals and quoted names: EXPLAIN binds each to NULL (the plan does not change). */
const placeholders = (sql: string): number =>
  sql.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '').split('?').length - 1;

type Db = { prepare(sql: string): { bind(...v: unknown[]): { all(): Promise<{ results: unknown[] }> } } };

/** The database `npm run dev` uses, with each new SELECT's plan checked once (never in a built Worker). */
export function watchQueryPlans<T extends object>(client: T): T {
  const seen = new Set<string>();
  const explain = (sql: string) =>
    (client as unknown as Db)
      .prepare(`EXPLAIN QUERY PLAN ${sql}`)
      .bind(...Array<null>(placeholders(sql)).fill(null))
      .all()
      .then(({ results }) => {
        const why = slowPlan(results as PlanRow[]);
        if (why) console.error(`slow query: ${why} (_system-docs/database.md §1): ${sql.slice(0, 300)}`);
      })
      .catch(() => {});
  return new Proxy(client, {
    get(target, key) {
      const value = Reflect.get(target, key) as unknown;
      if (typeof value !== 'function') return value;
      if (key !== 'prepare') return (value as (...a: unknown[]) => unknown).bind(target);
      return (sql: string) => {
        if (!seen.has(sql) && /^\s*(select|with)\b/i.test(sql)) {
          seen.add(sql);
          void explain(sql);
        }
        return (value as (s: string) => unknown).call(target, sql);
      };
    },
  });
}
