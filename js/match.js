// Answer normalisation and typo-tolerant matching. Pure, no DOM.

export function normalize(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(the|a|an) (?=.)/, '')
    .replace(/\bst\b/g, 'saint');
}

/** Comparison key: normalized, no spaces. */
export const keyOf = (s) => normalize(s).replace(/ /g, '');
/** Letters only, used for letter constraints. */
export const lettersOf = (s) => keyOf(s).replace(/[0-9]/g, '');

/** Parse "A|alias;B;C" into [{ name, forms: [...] }], deduped by key. */
export function parseList(str) {
  const seen = new Set();
  const out = [];
  for (const chunk of str.split(';')) {
    const forms = chunk.split('|').map((f) => f.trim()).filter(Boolean);
    if (!forms.length) continue;
    const k = keyOf(forms[0]);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ name: forms[0], forms });
  }
  return out;
}

/** A form counts for letter constraints unless it's a short all-caps acronym (UK, USA, DRC). */
export const isAcronym = (form) => form.length <= 4 && /[A-Z]/.test(form) && form === form.toUpperCase();

/** Build a lookup index over a list of entries. */
export function buildIndex(entries) {
  const byKey = new Map();
  entries.forEach((e, i) => {
    for (const f of e.forms) {
      const k = keyOf(f);
      if (k && !byKey.has(k)) byKey.set(k, i);
    }
  });
  return { entries, byKey, keys: [...byKey.keys()] };
}

export function distance(a, b, max) {
  // Damerau-Levenshtein (optimal string alignment) with early exit.
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length, m = b.length;
  let prev2 = null, prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[m];
}

const tolerance = (len) => (len >= 9 ? 2 : len >= 5 ? 1 : 0);

function variants(k) {
  const v = [k];
  if (k.endsWith('ies') && k.length > 4) v.push(k.slice(0, -3) + 'y');
  if (k.endsWith('es') && k.length > 3) v.push(k.slice(0, -2));
  if (k.endsWith('s') && k.length > 2) v.push(k.slice(0, -1));
  return v;
}

/**
 * Resolve raw text to an entry index in `index`, or -1.
 * Exact (with plural variants) first, then a unique closest fuzzy match.
 */
export function lookup(index, raw) {
  const k = keyOf(raw);
  if (!k) return -1;
  for (const v of variants(k)) if (index.byKey.has(v)) return index.byKey.get(v);
  const tol = tolerance(k.length);
  if (!tol) return -1;
  let best = tol + 1, bestIdx = -1, tie = false;
  for (const key of index.keys) {
    const d = distance(k, key, tol);
    if (d < best) { best = d; bestIdx = index.byKey.get(key); tie = false; }
    else if (d === best && index.byKey.get(key) !== bestIdx) tie = true;
  }
  return best <= tol && !tie ? bestIdx : -1;
}

/**
 * Judge an answer against a question.
 * question: { index (universe), valid: Set<entryIdx> }
 * → { status: 'blank' } | { status: 'valid', entry, name } | { status: 'invalid', reason: 'nofit'|'unknown', name? }
 */
export function judge(question, raw) {
  if (!keyOf(raw)) return { status: 'blank' };
  const idx = lookup(question.index, raw);
  if (idx < 0) return { status: 'invalid', reason: 'unknown' };
  const name = question.index.entries[idx].name;
  if (!question.valid.has(idx)) return { status: 'invalid', reason: 'nofit', entry: idx, name };
  return { status: 'valid', entry: idx, name };
}
