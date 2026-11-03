// Types for check-legacy-data.mjs, for type checkers that read this project without `allowJs` (the devkit's).
export function legacyDataIn(text: string): string | null;
export function legacyDataRefusal(root?: string): string | null;
export const LEGACY_STUB_MARKER: string;
export function legacyStub(original: string): string | null;
export function stubbedHash(text: string): string | null;
export function legacyDataFiles(root?: string): { path: string; what: string }[];
export function legacyDataCheck(
  root?: string,
  env?: Record<string, string | undefined>,
): Promise<{ refusal: string | null; warning: string | null }>;
