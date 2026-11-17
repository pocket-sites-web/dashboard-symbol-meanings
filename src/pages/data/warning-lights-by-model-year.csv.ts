import type { APIRoute } from 'astro';
import { lightStats } from '../../lib/lightstats';

// CSV download for /statistics/dashboard-lights/: one row per model year in our owner's-manual data.
export const GET: APIRoute = () => {
  const s = lightStats();
  const ids = s.adoption.map((a) => a.id);
  const head = ['make', 'model', 'model_year', 'lights_listed_in_manual', ...ids.map((i) => `has_${i.replace(/-/g, '_')}`)];
  const q = (v: string | number) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const lines = [head.join(','), ...[...s.rows].sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.year - b.year)
    .map((r) => [r.make, r.model, r.year, r.lights, ...ids.map((i) => (r.symbols.has(i) ? 1 : 0))].map(q).join(','))];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
