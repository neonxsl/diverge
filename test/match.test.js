import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, keyOf, parseList, buildIndex, lookup, judge, distance } from '../js/match.js';

test('normalize strips accents, case, punctuation, articles', () => {
  assert.equal(normalize("  Côte d'Ivoire "), 'cote divoire');
  assert.equal(normalize('The Gambia'), 'gambia');
  assert.equal(normalize('St Lucia'), 'saint lucia');
  assert.equal(keyOf('Bosnia & Herzegovina'), 'bosniaandherzegovina');
  assert.equal(keyOf('A'), 'a'); // a lone article survives (vowel question)
});

test('parseList dedupes and keeps aliases', () => {
  const l = parseList('United Kingdom|UK|Britain;Chad; chad ;');
  assert.equal(l.length, 2);
  assert.deepEqual(l[0].forms, ['United Kingdom', 'UK', 'Britain']);
});

test('distance handles transpositions', () => {
  assert.equal(distance('tunisia', 'tunisai', 2), 1);
  assert.equal(distance('kitten', 'sitting', 5), 3);
});

const idx = buildIndex(parseList('Tunisia;Austria;Australia;Niger;Nigeria;Iran;Iraq;United States|USA;Bahamas;Mouse'));

test('lookup: exact, alias, plural, typo', () => {
  const name = (s) => { const i = lookup(idx, s); return i < 0 ? null : idx.entries[i].name; };
  assert.equal(name('usa'), 'United States');
  assert.equal(name('Tunisa'), 'Tunisia');
  assert.equal(name('the bahamas'), 'Bahamas');
  assert.equal(name('Mouses'), 'Mouse');
  assert.equal(name('Niger'), 'Niger');
  assert.equal(name('Nigeria'), 'Nigeria');
  assert.equal(name('Irak'), null); // short words must be exact
  assert.equal(name('Austrailia'), 'Australia');
  assert.equal(name('Austrlia'), null); // one edit from Austria AND Australia: refuse
  assert.equal(name('Zzzz'), null);
});

test('judge separates valid, nofit, unknown, blank', () => {
  const valid = new Set([0]); // only Tunisia qualifies
  const q = { index: idx, valid };
  assert.equal(judge(q, 'tunisia').status, 'valid');
  assert.deepEqual(judge(q, 'Iran'), { status: 'invalid', reason: 'nofit', entry: 5, name: 'Iran' });
  assert.equal(judge(q, 'Narnia').reason, 'unknown');
  assert.equal(judge(q, '   ').status, 'blank');
});
