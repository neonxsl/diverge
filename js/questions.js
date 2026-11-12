// Question bank. Four kinds of question, each carrying its exact set of valid answers:
//   hand    – hand-written prompts ("Name a pizza topping")
//   tag     – a specific slice of a category ("Name an African country")
//   tagrule – a slice plus a twist ("Name an African country starting with M")
//   any/rule – a whole category, optionally with a letter rule ("Name a country ending in -stan")
// Rounds lean heavily on hand/tag questions; letter puzzles are the seasoning.

import { countries, capitals, cities } from './data/geo.js';
import { animals, birds, dogBreeds, fruits, vegetables, flowers, elements } from './data/nature.js';
import { sports, instruments, colours, bodyParts, jobs, clothing, foods, carBrands, languages } from './data/stuff.js';
import { handpicked } from './data/handpicked.js';
import { handpicked2 } from './data/handpicked2.js';
import { tags } from './data/tags.js';
import { parseList, buildIndex, keyOf, lettersOf, normalize, isAcronym } from './match.js';

const RAW = [countries, capitals, cities, animals, birds, dogBreeds, fruits, vegetables, flowers,
  elements, sports, instruments, colours, bodyParts, jobs, clothing, foods, carBrands, languages];

export const TIER_NAMES = ['', 'mild', 'warm', 'spicy', 'hot', 'brutal'];

export function tierFor(count) {
  if (count >= 40) return 1;
  if (count >= 20) return 2;
  if (count >= 11) return 3;
  if (count >= 6) return 4;
  return 5;
}

function prepareCategory(c) {
  const entries = parseList(c.items);
  const index = buildIndex(entries);
  // Forms that count for letter rules: canonical name plus non-acronym aliases.
  const shapes = entries.map((e) =>
    e.forms.filter((f, i) => i === 0 || !isAcronym(f)).map((f) => ({ l: lettersOf(f), n: normalize(f) })));
  return { ...c, entries, index, shapes };
}

export const CATEGORIES = Object.fromEntries(RAW.map((c) => [c.id, prepareCategory(c)]));

/** Resolve a ";"-list of names to entry indices in a category; throws on unknown names. */
function resolveNames(cat, names, where) {
  const out = new Set();
  for (const e of parseList(names)) {
    const i = cat.index.byKey.get(keyOf(e.name));
    if (i === undefined) throw new Error(`${where}: "${e.name}" not in ${cat.id}`);
    out.add(i);
  }
  return [...out];
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const RARE = 'bfjkqvwxyz';
const VOWELS = 'aeiou';
const U = (ch) => ch.toUpperCase();
const count = (s, ch) => { let n = 0; for (const c of s) if (c === ch) n++; return n; };

/** Twists that read naturally on a specific slice ("…starting with M"). */
function* tagRules(cat) {
  for (const a of ALPHA) yield { type: 'start', phrase: `starting with ${U(a)}`, test: (f) => f.l[0] === a };
  for (let n = 4; n <= 9; n++) yield { type: 'len', phrase: `with exactly ${n} letters`, test: (f) => f.l.length === n };
  yield { type: 'vowelStart', phrase: 'starting with a vowel', test: (f) => VOWELS.includes(f.l[0]) };
  yield { type: 'vowelEnd', phrase: 'ending in a vowel', test: (f) => VOWELS.includes(f.l.at(-1)) };
  if (['country', 'capital', 'city'].includes(cat.id))
    yield { type: 'multi', phrase: 'with two or more words', test: (f) => f.n.includes(' ') };
  yield { type: 'long', phrase: 'with 10 or more letters', test: (f) => f.l.length >= 10 };
}

/** Letter puzzles over a whole category. Kept to the interesting ones. */
function* catRules(cat) {
  for (const a of ALPHA) yield { type: 'start', phrase: `starting with ${U(a)}`, test: (f) => f.l[0] === a };
  for (const a of 'aeiouy') yield { type: 'end', phrase: `ending in ${U(a)}`, test: (f) => f.l.at(-1) === a };
  // Any letter pair for the big, well-known lists; elsewhere one letter must be rare.
  const anyPair = cat.id === 'country' || cat.id === 'animal';
  for (let i = 0; i < ALPHA.length; i++) for (let j = i + 1; j < ALPHA.length; j++) {
    const a = ALPHA[i], b = ALPHA[j];
    if (!anyPair && !RARE.includes(a) && !RARE.includes(b)) continue;
    yield { type: 'both', phrase: `containing both ${U(a)} and ${U(b)}`, test: (f) => f.l.includes(a) && f.l.includes(b) };
  }
  for (const r of 'jqxz') yield { type: 'has', phrase: `with a ${U(r)} in it`, test: (f) => f.l.includes(r) };
  for (const a of 'aeio') yield { type: 'without', phrase: `without the letter ${U(a)}`, test: (f) => !f.l.includes(a) };
  for (const n of [11, 13]) yield { type: 'long', phrase: `with ${n} or more letters`, test: (f) => f.l.length >= n };
  yield { type: 'short', phrase: 'with 4 letters or fewer', test: (f) => f.l.length <= 4 };
  yield { type: 'double', phrase: 'with a double letter (like LL or EE)', test: (f) => /(.)\1/.test(f.l) };
  yield { type: 'sameEnds', phrase: 'that starts and ends with the same letter', test: (f) => f.l[0] === f.l.at(-1) };
  for (const a of 'aeio') yield { type: 'triple', phrase: `with at least three ${U(a)}'s`, test: (f) => count(f.l, a) >= 3 };
  const suf = new Map();
  for (const e of cat.entries) {
    const l = lettersOf(e.name);
    for (const n of [3, 4]) if (l.length > n + 1) suf.set(l.slice(-n), (suf.get(l.slice(-n)) || 0) + 1);
  }
  for (const [s, c] of suf) if (c >= 3 && c <= 25)
    yield { type: 'suffix', phrase: `ending in "-${s}"`, test: (f) => f.l.endsWith(s) };
}

function buildBank() {
  const bank = [];
  const add = (q) => { if (q.valid.length >= 3) bank.push({ ...q, count: q.valid.length, tier: tierFor(q.valid.length) }); };
  const filter = (cat, pool, test) => pool.filter((i) => cat.shapes[i].some(test));

  for (const cat of Object.values(CATEGORIES)) {
    const all = cat.entries.map((_, i) => i);
    add({ id: `${cat.id}:any`, text: `Name ${cat.noun}`, tag: cat.label, cat: cat.id, kind: 'any', type: 'any', valid: all });
    for (const r of catRules(cat)) {
      const valid = filter(cat, all, r.test);
      if (valid.length === all.length) continue;
      add({ id: `${cat.id}:${r.type}:${r.phrase}`, text: `Name ${cat.noun} ${r.phrase}`, tag: cat.label, cat: cat.id, kind: 'rule', type: r.type, valid });
    }
    (tags[cat.id] || []).forEach((t, n) => {
      const slice = resolveNames(cat, t.names, `tag "${t.noun}"`);
      add({ id: `${cat.id}#${n}`, text: `Name ${t.noun}`, tag: cat.label, cat: cat.id, kind: 'tag', type: 'tag', valid: slice });
      // Twists only read well on short slices ("an African country starting with M").
      if (/\b(where|that|which|you|people|also)\b|\(/.test(t.noun)) return;
      for (const r of tagRules(cat)) {
        const valid = filter(cat, slice, r.test);
        if (valid.length === slice.length || valid.length < 3) continue;
        add({ id: `${cat.id}#${n}:${r.phrase}`, text: `Name ${t.noun} ${r.phrase}`, tag: cat.label, cat: cat.id, kind: 'tagrule', type: r.type, valid });
      }
    });
  }

  [...handpicked, ...handpicked2].forEach((h, n) => {
    let index, valid;
    if (h.cat) {
      index = CATEGORIES[h.cat].index;
      valid = resolveNames(CATEGORIES[h.cat], h.answers, `"${h.text}"`);
    } else {
      index = buildIndex(parseList(h.answers));
      valid = index.entries.map((_, i) => i);
    }
    add({ id: `hand:${n}`, text: h.text, tag: h.tag, cat: h.cat || null, kind: 'hand', type: 'hand', index, valid });
  });
  return bank;
}

export const BANK = buildBank();
const BY_ID = new Map(BANK.map((q) => [q.id, q]));

/** Full question with its matcher (index + valid set), for the host. */
export function getQuestion(id) {
  const q = BY_ID.get(id);
  if (!q) return null;
  if (!q.validSet) {
    q.index ||= CATEGORIES[q.cat].index;
    q.validSet = new Set(q.valid);
  }
  return { ...q, valid: q.validSet };
}

export const tierForRound = (round) => Math.min(5, 1 + Math.floor((round - 1) / 2));

// How often each kind comes up when it's available.
const KIND_WEIGHT = { hand: 0.5, tag: 0.2, tagrule: 0.15, rule: 0.12, any: 0.03 };

function weightedKind(pool, rng) {
  const kinds = [...new Set(pool.map((q) => q.kind))];
  const total = kinds.reduce((s, k) => s + KIND_WEIGHT[k], 0);
  let r = rng() * total;
  for (const k of kinds) { r -= KIND_WEIGHT[k]; if (r <= 0) return k; }
  return kinds.at(-1);
}

function pickFrom(pool, rng) {
  const kind = weightedKind(pool, rng);
  const ofKind = pool.filter((q) => q.kind === kind);
  // Within letter rules, pick a rule type first so "contains both" can't dominate.
  const types = [...new Set(ofKind.map((q) => q.type))];
  const type = types[Math.floor(rng() * types.length)];
  const ofType = ofKind.filter((q) => q.type === type);
  return ofType[Math.floor(rng() * ofType.length)].id;
}

const notLast = (pool, lastCat) => {
  const fresh = pool.filter((q) => (q.cat || q.tag) !== lastCat);
  return fresh.length ? fresh : pool;
};

/** Choose the next question: tier follows the round, never repeats, varies the category. */
export function pickQuestion({ round, alive, used = new Set(), lastCat = null, rng = Math.random }) {
  const target = tierForRound(round);
  const tiers = [target, target - 1, target + 1, target - 2, target + 2].filter((t) => t >= 1 && t <= 5);
  for (const t of tiers) {
    let pool = BANK.filter((q) => q.tier === t && !used.has(q.id));
    if (!pool.length) continue;
    const roomy = pool.filter((q) => q.count > alive);
    if (roomy.length) pool = roomy;
    return pickFrom(notLast(pool, lastCat), rng);
  }
  return null;
}

/** Showdown question: very few answers, so one of them can be the bomb. */
export function pickDuelQuestion({ used = new Set(), lastCat = null, rng = Math.random }) {
  for (const [lo, hi] of [[3, 6], [3, 8], [3, 12]]) {
    const pool = BANK.filter((q) => q.count >= lo && q.count <= hi && !used.has(q.id) && q.kind !== 'rule');
    if (pool.length) return pickFrom(notLast(pool, lastCat), rng);
  }
  return pickQuestion({ round: 9, alive: 2, used, lastCat, rng });
}

/** A few valid answers nobody gave, for the "could've said" line. */
export function sampleAnswers(q, excludeEntries, n = 6, rng = Math.random) {
  const pool = [...q.valid].filter((i) => !excludeEntries.has(i));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n).map((i) => q.index.entries[i].name);
}
