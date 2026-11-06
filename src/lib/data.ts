import fs from 'node:fs';
import path from 'node:path';
import { byId, matchSymbol, usualColour, type Colour, type Symbol } from './symbols';

// data/lights.json, written by scripts/import-lights.py: one record per make/model/year.
export interface RawLight { name: string; symbol: string | null; colour: Colour | null; meaning: string; action?: string; page?: string }
export interface RawYear { make: string; model: string; year: number; source_name: string; lights: RawLight[] }

export interface Light extends RawLight { sym: Symbol | null; col: Colour; colourKnown: boolean; key: string }
export interface Generation { from: number; to: number; years: number[]; sources: { year: number; name: string }[]; lights: Light[]; anchor: string }
export interface Model { make: string; makeSlug: string; model: string; modelSlug: string; gens: Generation[]; from: number; to: number }
export interface Make { make: string; makeSlug: string; models: Model[] }

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const enrich = (l: RawLight): Light => {
  const sym = (l.symbol && byId.get(l.symbol)) || matchSymbol(l.name);
  return { ...l, sym, col: l.colour ?? usualColour(sym), colourKnown: !!l.colour, key: `${sym?.id ?? ''}|${l.name.toLowerCase()}` };
};

// Lights change by generation, not by year: consecutive years with (nearly) the same light list
// share one section.
const similar = (a: Set<string>, b: Set<string>) => {
  let n = 0;
  for (const k of a) if (b.has(k)) n++;
  return n / Math.max(1, new Set([...a, ...b]).size) >= 0.75;
};

let cache: Make[] | null = null;
export function getMakes(): Make[] {
  if (cache) return cache;
  const file = path.resolve('data', 'lights.json');
  const raw: RawYear[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const models = new Map<string, RawYear[]>();
  for (const r of raw) {
    const k = `${r.make}|${r.model}`;
    if (!models.has(k)) models.set(k, []);
    models.get(k)!.push(r);
  }
  const makes = new Map<string, Make>();
  for (const rs of models.values()) {
    rs.sort((a, b) => a.year - b.year);
    const gens: Generation[] = [];
    let cur: { rs: RawYear[]; keys: Set<string> } | null = null;
    for (const r of rs) {
      const keys = new Set(r.lights.map((l) => enrich(l).key));
      const last = cur?.rs[cur.rs.length - 1];
      if (cur && last && r.year - last.year <= 1 && similar(cur.keys, keys)) {
        cur.rs.push(r);
        for (const k of keys) cur.keys.add(k);
      } else {
        cur = { rs: [r], keys };
        gens.push(null as unknown as Generation);
      }
      // The newest year in a generation has the most complete list; use its manual for the section.
      const newest = cur.rs[cur.rs.length - 1];
      const seen = new Set<string>();
      const lights = newest.lights.map(enrich).filter((l) => (seen.has(l.key) ? false : (seen.add(l.key), true)));
      const from = cur.rs[0].year, to = newest.year;
      gens[gens.length - 1] = {
        from, to, years: cur.rs.map((x) => x.year), lights, anchor: from === to ? `${from}` : `${from}-${to}`,
        sources: cur.rs.map((x) => ({ year: x.year, name: x.source_name })),
      };
    }
    gens.reverse();
    const { make, model } = rs[0];
    const m: Model = { make, makeSlug: slugify(make), model, modelSlug: slugify(model), gens, from: rs[0].year, to: rs[rs.length - 1].year };
    if (!makes.has(make)) makes.set(make, { make, makeSlug: slugify(make), models: [] });
    makes.get(make)!.models.push(m);
  }
  cache = [...makes.values()]
    .map((mk) => ({ ...mk, models: mk.models.sort((a, b) => a.model.localeCompare(b.model)) }))
    .sort((a, b) => a.make.localeCompare(b.make));
  return cache;
}

export const getModels = () => getMakes().flatMap((m) => m.models);
export const yearSpan = (a: number, b: number) => (a === b ? `${a}` : `${a} to ${b}`);

/** Every light a make uses, one entry per symbol (unmatched lights grouped by name), with the models using it. */
export function makeLights(mk: Make) {
  const out = new Map<string, { l: Light; models: Set<string> }>();
  for (const m of mk.models)
    for (const g of m.gens)
      for (const l of g.lights) {
        const k = l.sym?.id ?? `name:${l.name.toLowerCase()}`;
        if (!out.has(k)) out.set(k, { l, models: new Set() });
        out.get(k)!.models.add(m.model);
      }
  return [...out.values()];
}
