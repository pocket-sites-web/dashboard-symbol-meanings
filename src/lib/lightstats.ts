// Statistics from our own owner's-manual light data (data/lights.json), computed at build time so they
// update whenever new manuals are added.
import fs from 'node:fs';
import path from 'node:path';
import { byId, matchSymbol, SYMBOLS } from './symbols';
import type { RawYear } from './data';

const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export interface LightRow { make: string; model: string; year: number; lights: number; symbols: Set<string> }

let cache: ReturnType<typeof build> | null = null;
export const lightStats = () => (cache ??= build());

function build() {
  const raw: RawYear[] = JSON.parse(fs.readFileSync(path.resolve('data', 'lights.json'), 'utf8'));
  const rows: LightRow[] = raw.map((r) => {
    const symbols = new Set<string>();
    for (const l of r.lights) { const s = (l.symbol && byId.get(l.symbol)) || matchSymbol(l.name); if (s) symbols.add(s.id); }
    return { make: r.make, model: r.model, year: r.year, lights: r.lights.length, symbols };
  });
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const makes = [...new Set(rows.map((r) => r.make))].sort();
  const max = rows.reduce((a, b) => (b.lights > a.lights ? b : a));
  const min = rows.reduce((a, b) => (b.lights < a.lights ? b : a));
  const periods: [number, number][] = [[2010, 2014], [2015, 2019], [2020, 2024], [2025, 2026]];
  const byPeriod = periods.map(([a, b]) => { const v = rows.filter((r) => r.year >= a && r.year <= b).map((r) => r.lights); return { label: `${a}–${b}`, n: v.length, median: median(v) }; }).filter((p) => p.n);
  const byMake = makes.map((m) => { const v = rows.filter((r) => r.make === m).map((r) => r.lights); return { label: m, n: v.length, median: median(v) }; }).sort((a, b) => b.median - a.median);
  const share = (rs: LightRow[], id: string) => (rs.length ? (100 * rs.filter((r) => r.symbols.has(id)).length) / rs.length : 0);
  const symbolShare = SYMBOLS.map((s) => ({ id: s.id, name: s.name, severity: s.severity, pct: share(rows, s.id) })).filter((s) => s.pct > 0).sort((a, b) => b.pct - a.pct);
  const ADAS = ['pre-collision', 'lane', 'blind-spot', 'auto-high-beam', 'brake-hold'];
  const adoption = ADAS.map((id) => ({ id, name: byId.get(id)!.name, early: share(rows.filter((r) => r.year <= 2014), id), late: share(rows.filter((r) => r.year >= 2025), id),
    byYear: years.map((y) => ({ year: y, pct: share(rows.filter((r) => r.year === y), id) })) }));
  return { rows, years, makes, models: new Set(rows.map((r) => `${r.make}|${r.model}`)).size, modelYears: rows.length, totalLights: rows.reduce((a, r) => a + r.lights, 0),
    median: median(rows.map((r) => r.lights)), max, min, byPeriod, byMake, symbolShare, adoption,
    earlyN: rows.filter((r) => r.year <= 2014).length, lateN: rows.filter((r) => r.year >= 2025).length };
}
