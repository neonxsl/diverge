import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, LIVES } from '../js/game.js';

function setup(names = ['Ada', 'Bo', 'Cy']) {
  let t = 0;
  const timers = { setTimeout: () => 1, clearTimeout: () => {} };
  const g = new Game({ code: 'TEST', now: () => t, timers, rng: () => 0.42 });
  names.forEach((n, i) => g.join('p' + i, n));
  g.tick = (ms) => { t += ms; };
  return g;
}

// Force a known question so answers are predictable.
function forcePlanets(g) {
  g.question = { ...g.question, ...(awaitPlanets()) };
  if (g.duel) g.bomb = 0; // Mercury
}
import { getQuestion } from '../js/questions.js';
const awaitPlanets = () => getQuestion('hand:0');

test('join rules: names, duplicates, rejoin, spectators', () => {
  const g = setup(['Ada']);
  assert.equal(g.join('x', '').ok, false);
  assert.equal(g.join('x', 'ada').ok, false); // taken (case-insensitive)
  g.setConnected('p0', false); // lobby disconnect removes
  assert.equal(g.players.length, 0);
  g.join('p0', 'Ada'); g.join('p1', 'Bo');
  g.start();
  g.setConnected('p1', false);
  assert.equal(g.join('p9', 'Bo').rebound, true); // new tab, same name
  g.join('late', 'Zed');
  assert.equal(g.player('late').spectator, true);
});

test('needs two players to start', () => {
  const g = setup(['Solo']);
  assert.equal(g.start().ok, false);
});

test('clash, invalid and blank lose lives; unique survives', () => {
  const g = setup(['Ada', 'Bo', 'Cy', 'Di']);
  g.start(); forcePlanets(g);
  g.submit('p0', 'Mars');
  g.submit('p1', 'mars ');
  g.submit('p2', 'Pluto');
  assert.equal(g.phase, 'question'); // Di still thinking
  g.submit('p3', '');
  assert.equal(g.phase, 'reveal');
  const { groups, losses, reprieve } = g.groups();
  assert.equal(reprieve, false);
  assert.deepEqual(Object.keys(losses).sort(), ['p0', 'p1', 'p2', 'p3']);
  assert.equal(groups.find((x) => x.label === 'Mars').status, 'clash');
  g.next();
  assert.ok(g.players.every((p) => p.lives === LIVES - 1));
});

test('answers are hidden until reveal', () => {
  const g = setup(['Ada', 'Bo']);
  g.start(); forcePlanets(g);
  g.submit('p0', 'Venus');
  const s = JSON.stringify(g.publicState());
  assert.ok(!s.includes('Venus'));
  assert.equal(g.publicState().players[0].locked, true);
});

test('host can allow an answer missing from the list', () => {
  const g = setup(['Ada', 'Bo', 'Cy']);
  g.start(); forcePlanets(g);
  g.submit('p0', 'Earth'); g.submit('p1', 'Pluto'); g.submit('p2', 'Mars');
  const key = g.groups().groups.find((x) => x.label === 'Pluto').key;
  g.toggleAllow(key);
  assert.deepEqual(g.groups().losses, {});
});

test('reprieve when everyone would be eliminated', () => {
  const g = setup(['Ada', 'Bo']);
  g.start();
  for (const p of g.players) p.lives = 1;
  forcePlanets(g);
  g.submit('p0', 'Mercury'); g.submit('p1', 'Pluto'); // bomb + invalid: both would be out
  assert.equal(g.groups().reprieve, true);
  g.next();
  assert.equal(g.phase, 'question');
  assert.ok(g.players.every((p) => p.lives === 1));
});

test('last one standing wins; timer resolve with no answers', () => {
  const g = setup(['Ada', 'Bo']);
  g.start();
  g.players[1].lives = 1;
  forcePlanets(g);
  g.submit('p0', 'Venus');
  g.tick(60000); g.resolve(); // Bo never answered
  g.next();
  assert.equal(g.phase, 'over');
  const s = g.publicState();
  assert.equal(s.winner, 'p0');
  assert.deepEqual(s.standings, ['p0', 'p1']);
  g.backToLobby();
  assert.equal(g.phase, 'lobby');
  assert.ok(g.players.every((p) => p.lives === LIVES));
});

test('showdown: two left means a secret bomb, and matching is fine', () => {
  const g = setup(['Ada', 'Bo']);
  g.start();
  assert.equal(g.duel, true);
  assert.ok(g.question.count >= 3 && g.question.count <= 12, `duel question has ${g.question.count} answers`);
  const names = [...g.question.valid].map((i) => g.question.index.entries[i].name);
  const bomb = g.question.index.entries[g.bomb].name;
  const safe = names.find((n) => n !== bomb);
  // Both pick the same safe answer: no clash in a showdown.
  g.submit('p0', safe); g.submit('p1', safe);
  assert.deepEqual(g.groups().losses, {});
  assert.ok(!JSON.stringify(g.publicState()).includes('"bomb":"') || g.phase === 'reveal');
  assert.equal(g.publicState().reveal.bomb, bomb);
  assert.ok(!g.publicState().reveal.suggestions.includes(bomb));
  g.next();
  // Next round: Ada hits the bomb, Bo plays safe.
  const b2 = g.question.index.entries[g.bomb].name;
  const s2 = [...g.question.valid].map((i) => g.question.index.entries[i].name).find((n) => n !== b2);
  g.submit('p0', b2); g.submit('p1', s2);
  const { groups, losses } = g.groups();
  assert.deepEqual(losses, { p0: 1 });
  assert.equal(groups.find((x) => x.label === b2).status, 'bomb');
});

test('bomb stays secret during the question', () => {
  const g = setup(['Ada', 'Bo']);
  g.start();
  const bomb = g.question.index.entries[g.bomb].name;
  const s = g.publicState();
  assert.equal(s.question.duel, true);
  assert.equal(s.reveal, undefined);
  assert.ok(!JSON.stringify(s).includes(bomb) || g.question.text.includes(bomb));
});

test('three players is a normal round, not a showdown', () => {
  const g = setup(['Ada', 'Bo', 'Cy']);
  g.start();
  assert.equal(g.duel, false);
});

test('a seat can only be reclaimed with its secret', () => {
  const g = new Game({ code: 'T', timers: { setTimeout: () => 1, clearTimeout: () => {} } });
  g.join('p0', 'Ada', 's0');
  g.join('p1', 'Bo', 's1');
  // Bo can read p0 from the public state; that alone must not unlock Ada's seat.
  assert.equal(g.join('p0', 'Bo', 'guess').ok, false);
  assert.equal(g.join('p0', 'Ada', 's0').ok, true);
  assert.ok(!JSON.stringify(g.publicState()).includes('s0'));
});

test('rejoining from a new tab keeps an answer already sent', () => {
  const g = setup(['Ada', 'Bo', 'Cy']);
  g.start(); forcePlanets(g);
  g.submit('p1', 'Venus');
  g.setConnected('p1', false);
  g.join('p1b', 'Bo');
  g.submit('p0', 'Mars'); g.submit('p2', 'Earth');
  assert.equal(g.phase, 'reveal');
  assert.equal(g.results.find((r) => r.pid === 'p1b').name, 'Venus');
});

test('wrong-but-real answers group by what they match, not how they were typed', () => {
  const g = setup(['Ada', 'Bo', 'Cy']);
  g.start();
  g.question = getQuestion('country:start:starting with D');
  g.submit('p0', 'France'); g.submit('p1', 'france '); g.submit('p2', 'Frnace');
  const fr = g.groups().groups.filter((x) => x.label === 'France');
  assert.equal(fr.length, 1);
  assert.equal(fr[0].pids.length, 3);
});

test('running out of questions recycles instead of crashing', () => {
  const g = setup(['Ada', 'Bo', 'Cy']);
  g.start();
  const { BANK } = awaitBank;
  for (const q of BANK) g.used.add(q.id);
  g.phase = 'reveal'; g.results = []; g.next();
  assert.ok(g.question, 'got a question');
});
import * as awaitBank from '../js/questions.js';
