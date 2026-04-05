/**
 * CORS settings shared by Fastify (`main.ts`) and the Socket.io gateway (`MetricsGateway`).
 * Single env source: `ALLOWED_ORIGINS` (comma-separated); defaults to local dashboard.
 */
export function getCorsOptions(): {
  origin: string[];
  credentials: boolean;
} {
  const raw = process.env.ALLOWED_ORIGINS;
  const trimmed =
    raw
      ?.split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0) ?? [];

  const origin =
    trimmed.length > 0 ? trimmed : ['http://localhost:3000'];

  return { origin, credentials: true };
}
