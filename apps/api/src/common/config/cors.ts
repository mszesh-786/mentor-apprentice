const DEFAULT_ORIGIN = 'http://localhost:5173';

/** `CORS_ORIGIN` accepts a comma-separated list, e.g. "https://app.example.com,http://localhost:5173". */
export function parseCorsOrigins(raw: string | undefined): string | string[] {
  const origins = (raw ?? DEFAULT_ORIGIN)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (origins.length === 0) return DEFAULT_ORIGIN;
  return origins.length === 1 ? origins[0] : origins;
}
