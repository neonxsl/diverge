import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANK, CATEGORIES, getQuestion, pickQuestion, tierFor, sampleAnswers } from '../js/questions.js';
import { judge } from '../js/match.js';

test('bank is big and well-formed', () => {
  assert.ok(BANK.length > 2000, `only ${BANK.length} questions`);
  const ids = new Set();
  for (const q of BANK) {
    assert.ok(q.count >= 3, `${q.text} has ${q.count} answers`);
    assert.equal(q.tier, tierFor(q.count));
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
  }
  for (let t = 1; t <= 5; t++) assert.ok(BANK.some((q) => q.tier === t), `tier ${t} empty`);
});

test('generated constraints are actually satisfied', () => {
  const q = getQuestion('country:both:containing both T and U');
  const names = [...q.valid].map((i) => q.index.entries[i].name);
  assert.ok(names.includes('Tunisia'));
  assert.ok(names.includes('Turkey'));
  assert.ok(!names.includes('Canada'));
  for (const n of names) assert.ok(/t/i.test(n) || CATEGORIES.country.entries.find((e) => e.name === n).forms.some((f) => /t/i.test(f)));
});

test('judging a real question end to end', () => {
  const q = getQuestion('country:suffix:ending in "-stan"');
  assert.equal(judge(q, 'kazakstan').status, 'valid');
  assert.equal(judge(q, 'France').reason, 'nofit');
  assert.equal(judge(q, 'Wakanda').reason, 'unknown');
});

test('acronyms do not satisfy letter rules on their own', () => {
  const q = getQuestion('country:start:starting with U');
  const names = [...q.valid].map((i) => q.index.entries[i].name);
  assert.ok(names.includes('United Kingdom')); // via its real name
  assert.equal(judge(q, 'UK').status, 'valid');  // typing the acronym still matches
  assert.ok(!names.includes('Central African Republic')); // "CAR" alias doesn't count
});

test('pickQuestion ramps difficulty and never repeats', () => {
  const used = new Set();
  let rng = 1; const r = () => (rng = (rng * 16807) % 2147483647) / 2147483647;
  for (let round = 1; round <= 12; round++) {
    const id = pickQuestion({ round, alive: 4, used, rng: r });
    assert.ok(id && !used.has(id));
    used.add(id);
    const q = getQuestion(id);
    if (round <= 2) assert.equal(q.tier, 1);
    if (round >= 9) assert.ok(q.tier >= 4, `round ${round} tier ${q.tier}`);
    assert.ok(q.count > 4);
  }
});

test('sampleAnswers excludes given ones', () => {
  const q = getQuestion('hand:0'); // planets
  const s = sampleAnswers(q, new Set([0, 1, 2]), 10);
  assert.equal(s.length, 5);
  assert.ok(!s.includes('Mercury'));
});
