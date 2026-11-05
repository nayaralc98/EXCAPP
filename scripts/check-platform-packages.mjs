// `npm run check` and `npm run build:preview` (nextpin, Francesc 2026-11-01): `next`, `react`, `react-dom`,
// `@opennextjs/cloudflare` and `wrangler` are platform-owned. 12 projects moved `next` past what the pinned OpenNext
// adapter runs (a security report asked for it) and every page of their preview answered 500 `Unexpected
// loadManifest(.../preview-props.json)`. The supported set is defined by Totalum, not here: on a Sprite it is the
// agent manager's `image/platform-packages.json` (AM refuses the same versions before every preview deploy, whatever
// copy of this script a project holds). Off a Sprite (a local clone, CI) there is no set and nothing is checked.
// Platform-owned.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PLATFORM_PACKAGES_FILE =
  process.env.TOTALUM_PLATFORM_PACKAGES ?? '/opt/totalum-agent/current/image/platform-packages.json';

/** The supported versions per package (`{ next: ['16.3.8'], … }`), or `null` when this machine has none. */
export function supportedSet(file = PLATFORM_PACKAGES_FILE) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')).packages;
}

/** The combinations the hosting runs (`lines`: next 16.4 needs OpenNext 1.20.12+), or `[]`. */
export function supportedLines(file = PLATFORM_PACKAGES_FILE) {
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, 'utf8')).lines ?? [];
}

const semver = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : undefined;
};
const notAbove = (a, b) => {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] < b[i];
  return true;
};
/** The version to put back for `current`: the newest of `versions` not above it, else the first (a new project's). */
export function restoreTarget(versions, current) {
  const cur = semver(current);
  let best;
  for (const v of versions) {
    const n = semver(v);
    if (cur && n && notAbove(n, cur) && (!best || notAbove(semver(best), n))) best = v;
  }
  return best ?? versions[0] ?? current;
}
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
};
/** A range (`^16.4.2`) stands for its installed copy, else its lockfile entry; an exact pin for itself. */
function resolvedVersion(root, name, declared) {
  if (semver(declared) || !/^[\^~<>=\d]/.test(declared)) return declared;
  return (
    readJson(join(root, 'node_modules', name, 'package.json'))?.version ??
    readJson(join(root, 'package-lock.json'))?.packages?.[`node_modules/${name}`]?.version ??
    declared
  );
}

/**
 * Every platform package `package.json` declares with a version outside the set, or outside the line (combination)
 * of its `next`; a range is judged by the version it resolves to. `supported` of each is the version to put back
 * (AM's revert writes the same): a supported version is never changed (nobody is downgraded, 2026-11-02).
 */
export function platformViolations(pkg, supported, lines = [], root = process.cwd()) {
  const declared = [];
  for (const name of Object.keys(supported ?? {}))
    for (const field of ['dependencies', 'devDependencies']) {
      const version = pkg[field]?.[name];
      if (version !== undefined)
        declared.push({ name, version, resolved: resolvedVersion(root, name, version) });
    }
  const inSet = (name) => {
    const d = declared.find((x) => x.name === name);
    return d && supported[name]?.includes(d.resolved) ? d.resolved : undefined;
  };
  const next = declared.find((d) => d.name === 'next');
  const byNext = inSet('next');
  const byAdapter = inSet('@opennextjs/cloudflare');
  const line = lines.length
    ? (byNext !== undefined && lines.find((l) => l.next?.includes(byNext))) ||
      (byAdapter !== undefined && lines.find((l) => l['@opennextjs/cloudflare']?.includes(byAdapter))) ||
      (next && lines.find((l) => l.next?.includes(restoreTarget(supported.next ?? [], next.resolved)))) ||
      lines.find((l) => declared.every((d) => l[d.name]?.includes(d.resolved) ?? true)) ||
      lines[0]
    : undefined;
  const out = [];
  for (const d of declared) {
    const all = supported[d.name] ?? [];
    const allowed = (line?.[d.name] ?? all).filter((v) => all.includes(v));
    if (!allowed.length || (all.includes(d.resolved) && allowed.includes(d.resolved))) continue;
    out.push({
      name: d.name,
      version: d.version,
      supported: all,
      restore: restoreTarget(allowed, d.resolved),
    });
  }
  return out;
}

const versionsText = (v) => {
  if (v.length <= 7) return v.join(' or ');
  const sorted = [...v].sort((a, b) => (notAbove(semver(a) ?? [0, 0, 0], semver(b) ?? [0, 0, 0]) ? -1 : 1));
  return `${sorted[0]} to ${sorted[sorted.length - 1]}`;
};

export function refusal(violations) {
  return [
    'PLATFORM_PACKAGE_VERSION  package.json',
    ...violations.map(
      (v) =>
        `  ${v.name} ${v.version} (supported: ${versionsText(v.supported)}${v.supported.includes(v.version) ? `; with this project's next: ${v.restore}` : ''})`,
    ),
    '  next, react, react-dom, @opennextjs/cloudflare and wrangler are managed by Totalum: the preview runs only the versions its hosting is tested with. Another version breaks every page of the deployed app (500), and the deploy refuses it.',
    `  Put the supported versions back: \`npm install --save-exact ${violations.map((v) => `${v.name}@${v.restore}`).join(' ')}\`. Do not upgrade these packages; Totalum updates them, including security fixes, for every project. If the user asked for the upgrade, tell them so.`,
  ].join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const supported = supportedSet();
  const found = supported
    ? platformViolations(JSON.parse(readFileSync('package.json', 'utf8')), supported, supportedLines())
    : [];
  if (found.length) {
    console.error(refusal(found));
    process.exitCode = 1;
  }
}
