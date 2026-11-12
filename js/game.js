// Host-authoritative game engine. Pure logic + timers; no DOM, no network.
// The host app feeds it actions and broadcasts `publicState()` on every change.

import { getQuestion, pickQuestion, pickDuelQuestion, sampleAnswers } from './questions.js';
import { judge, keyOf } from './match.js';

export const LIVES = 3;
export const COLORS = ['#ff5a36', '#3a86ff', '#2ec27e', '#ffbe0b', '#ff6fb5', '#8c5cff', '#00b4c6', '#ff8f1f', '#6b8f00', '#d43f8d', '#4a5568', '#b5651d'];
const GRACE_MS = 1200; // late answers still count for a moment after zero
export const roundSeconds = (round) => Math.max(15, 26 - round);

export class Game {
  constructor({ code, onChange = () => {}, rng = Math.random, now = () => Date.now(), timers = globalThis } = {}) {
    Object.assign(this, { code, onChange, rng, now, timers });
    this.players = [];   // { pid, name, color, lives, connected, spectator, outRound }
    this.phase = 'lobby';
    this.round = 0;
    this.used = new Set();
    this.lastCat = null;
    this.question = null; // full question (host only)
    this.answers = new Map();
    this.deadline = 0;
    this.timer = null;
    this.results = null;  // per-round judged data
    this.allowed = new Set();
  }

  emit() { this.onChange(this); }
  player(pid) { return this.players.find((p) => p.pid === pid); }
  alive() { return this.players.filter((p) => !p.spectator && p.lives > 0); }

  // ---- membership -------------------------------------------------------
  // `pid` is public (it's in every state broadcast); `secret` proves a seat is yours.
  join(pid, rawName, secret = null) {
    const name = String(rawName || '').trim().slice(0, 16);
    const existing = this.player(pid);
    if (existing) {
      if (existing.secret !== secret) return { ok: false, error: 'That seat belongs to someone else.' };
      existing.connected = true; this.emit(); return { ok: true };
    }
    if (!name) return { ok: false, error: 'Pick a name first.' };
    const clash = this.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (clash) {
      if (clash.connected) return { ok: false, error: `Someone's already called ${clash.name}.` };
      // Same name, disconnected: treat as a rejoin from a new tab.
      if (this.answers.has(clash.pid)) { this.answers.set(pid, this.answers.get(clash.pid)); this.answers.delete(clash.pid); }
      Object.assign(clash, { pid, secret, connected: true });
      this.emit();
      return { ok: true, rebound: true };
    }
    if (this.players.length >= 16) return { ok: false, error: 'Room is full (16 max).' };
    const used = new Set(this.players.map((p) => p.color));
    const color = COLORS.find((c) => !used.has(c)) || COLORS[this.players.length % COLORS.length];
    const spectator = this.phase !== 'lobby';
    this.players.push({ pid, secret, name, color, lives: spectator ? 0 : LIVES, connected: true, spectator, outRound: null });
    this.emit();
    return { ok: true };
  }

  setConnected(pid, connected) {
    const p = this.player(pid);
    if (!p) return;
    if (!connected && this.phase === 'lobby') this.players = this.players.filter((x) => x !== p);
    else p.connected = connected;
    this.emit();
    if (this.phase === 'question') this.maybeResolveEarly();
  }

  // ---- flow ---------------------------------------------------------------
  start() {
    const seated = this.players.filter((p) => p.connected);
    if (seated.length < 2) return { ok: false, error: 'Need at least 2 players.' };
    this.players = seated;
    for (const p of this.players) Object.assign(p, { lives: LIVES, spectator: false, outRound: null });
    this.round = 0; this.used.clear(); this.lastCat = null;
    this.nextRound();
    return { ok: true };
  }

  nextRound() {
    this.round++;
    // Showdown: with two left, clashing would just knock both out together, so instead
    // one answer to a stingy question is secretly the bomb. Say it and you lose a heart.
    this.duel = this.alive().length === 2;
    const opts = { round: this.round, alive: this.alive().length, used: this.used, lastCat: this.lastCat, rng: this.rng };
    const pick = () => (this.duel ? pickDuelQuestion(opts) : pickQuestion(opts));
    let id = pick();
    if (id == null) { this.used.clear(); id = pick(); } // played the whole bank: start over
    this.used.add(id);
    this.question = getQuestion(id);
    const options = [...this.question.valid];
    this.bomb = this.duel ? options[Math.floor(this.rng() * options.length)] : null;
    this.lastCat = this.question.cat || this.question.tag;
    this.answers = new Map();
    this.results = null;
    this.allowed = new Set();
    this.phase = 'question';
    const ms = roundSeconds(this.round) * 1000;
    this.duration = ms;
    this.deadline = this.now() + ms;
    this.clearTimer();
    this.timer = this.timers.setTimeout(() => this.resolve(), ms + GRACE_MS);
    this.emit();
  }

  submit(pid, text) {
    if (this.phase !== 'question') return;
    const p = this.player(pid);
    if (!p || p.spectator || p.lives <= 0 || this.answers.has(pid)) return;
    if (this.now() > this.deadline + GRACE_MS) return;
    this.answers.set(pid, String(text ?? '').slice(0, 60));
    this.emit();
    this.maybeResolveEarly();
  }

  maybeResolveEarly() {
    const waiting = this.alive().filter((p) => p.connected && !this.answers.has(p.pid));
    if (!waiting.length && this.answers.size) this.resolve();
  }

  clearTimer() { if (this.timer) this.timers.clearTimeout(this.timer); this.timer = null; }

  resolve() {
    if (this.phase !== 'question') return;
    this.clearTimer();
    const q = this.question;
    const judged = this.alive().map((p) => {
      const raw = this.answers.get(p.pid) ?? '';
      return { pid: p.pid, raw: raw.trim(), ...judge(q, raw) };
    });
    this.results = judged;
    this.phase = 'reveal';
    const given = new Set(judged.filter((j) => j.status === 'valid').map((j) => j.entry));
    if (this.duel) given.add(this.bomb); // the bomb gets its own reveal
    this.suggestions = sampleAnswers(q, given, 6, this.rng);
    this.emit();
  }

  /** Host override: count an invalid answer group as valid (lists aren't perfect). */
  toggleAllow(groupKey) {
    if (this.phase !== 'reveal') return;
    if (this.allowed.has(groupKey)) this.allowed.delete(groupKey); else this.allowed.add(groupKey);
    this.emit();
  }

  /** Group answers and work out who loses a life. Derived, so overrides just re-run it. */
  groups() {
    if (!this.results) return { groups: [], losses: {}, reprieve: false };
    const map = new Map();
    for (const j of this.results) {
      let key, label, status, reason = null;
      if (j.status === 'blank') { key = 'blank'; label = ''; status = 'blank'; }
      else if (j.status === 'valid') { key = 'e:' + j.entry; label = j.name; status = 'valid'; }
      else {
        // "Real but doesn't fit" groups by the thing it matched, so typos still clash.
        key = j.reason === 'nofit' ? 'n:' + j.entry : 'x:' + keyOf(j.raw); label = j.name || j.raw; status = 'invalid'; reason = j.reason;
        if (this.allowed.has(key)) status = 'valid';
      }
      if (!map.has(key)) map.set(key, { key, label, status, reason, allowed: this.allowed.has(key), pids: [], raws: [] });
      const g = map.get(key);
      g.pids.push(j.pid);
      if (!g.raws.includes(j.raw)) g.raws.push(j.raw);
    }
    const groups = [...map.values()];
    const losses = {};
    for (const g of groups) {
      if (this.duel) { if (g.key === 'e:' + this.bomb) g.status = 'bomb'; }
      else if (g.status === 'valid' && g.pids.length > 1) g.status = 'clash';
      if (g.status !== 'valid') for (const pid of g.pids) losses[pid] = 1;
    }
    const alive = this.alive();
    const reprieve = alive.length > 0 && alive.every((p) => losses[p.pid] && p.lives - 1 <= 0);
    const order = { blank: 0, invalid: 1, valid: 2, clash: 3, bomb: 3 };
    groups.sort((a, b) => order[a.status] - order[b.status] || a.pids.length - b.pids.length);
    return { groups, losses, reprieve };
  }

  next() {
    if (this.phase === 'reveal') {
      const { losses, reprieve } = this.groups();
      if (!reprieve) for (const p of this.alive()) {
        if (losses[p.pid]) { p.lives -= 1; if (p.lives <= 0) p.outRound = this.round; }
      }
      if (this.alive().length <= 1) { this.phase = 'over'; this.clearTimer(); this.emit(); return; }
      this.nextRound();
    }
  }

  backToLobby() {
    this.clearTimer();
    this.phase = 'lobby';
    this.round = 0;
    this.players = this.players.filter((p) => p.connected);
    for (const p of this.players) Object.assign(p, { lives: LIVES, spectator: false, outRound: null });
    this.emit();
  }

  standings() {
    return [...this.players].filter((p) => !p.spectator || p.outRound)
      .sort((a, b) => b.lives - a.lives || (b.outRound ?? 1e9) - (a.outRound ?? 1e9))
      .map((p) => p.pid);
  }

  /** What every peer is allowed to see. Answers stay secret until the reveal. */
  publicState() {
    const base = {
      code: this.code, phase: this.phase, round: this.round,
      players: this.players.map((p) => ({
        pid: p.pid, name: p.name, color: p.color, lives: p.lives, connected: p.connected,
        spectator: p.spectator, outRound: p.outRound, locked: this.phase === 'question' && this.answers.has(p.pid),
      })),
    };
    if (this.question && this.phase !== 'lobby') {
      base.question = { text: this.question.text, tag: this.question.tag, tier: this.question.tier, count: this.question.count, duel: !!this.duel };
    }
    if (this.phase === 'question') {
      base.endsIn = Math.max(0, this.deadline - this.now());
      base.duration = this.duration;
    }
    if (this.phase === 'reveal') {
      const { groups, losses, reprieve } = this.groups();
      base.reveal = { groups, losses, reprieve, suggestions: this.suggestions,
        bomb: this.duel ? this.question.index.entries[this.bomb].name : null };
    }
    if (this.phase === 'over') {
      base.standings = this.standings();
      base.winner = this.alive()[0]?.pid ?? null;
    }
    return base;
  }
}
