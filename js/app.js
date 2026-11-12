// Wiring: networking ↔ game engine ↔ screens.
// The host runs the Game locally and broadcasts its public state; clients just render it.

import * as net from './net.js';
import * as ui from './ui.js';
import { Game } from './game.js';
import { sfx, confetti, isMuted, setMuted } from './fx.js';

const $ = (sel, root = document) => root.querySelector(sel);
const screen = $('#screen');

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

const freshId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
// Per tab, so two tabs = two players. The pid is public; the secret proves the seat is ours.
function tabId(key) {
  try {
    let v = sessionStorage.getItem(key);
    if (!v) { v = freshId(); sessionStorage.setItem(key, v); }
    return v;
  } catch { return freshId(); }
}

const app = {
  me: tabId('diverge:pid'),
  secret: tabId('diverge:secret'),
  role: null,        // 'host' | 'client' | null
  name: store.get('diverge:name') || '',
  code: '',
  game: null,        // host only
  hostNet: null,     // host only
  link: null,        // client only
  view: null,        // latest public state
  key: '',           // which screen is on show
  myAnswer: null,
  deadline: 0,
  duration: 1,
  raf: 0,
  lastSec: -1,
};

// ───────────────────────── chrome ─────────────────────────
function toast(msg, ms = 2600, kind = 'info') {
  if (kind === 'error') sfx.error();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => { el.classList.add('bye'); setTimeout(() => el.remove(), 260); }, ms);
}

const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
const darkNow = () => document.documentElement.dataset.theme
  ? document.documentElement.dataset.theme === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;
function paintTheme() {
  const dark = darkNow();
  $('#theme').innerHTML = dark ? ICON_SUN : ICON_MOON;
  $('#theme').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
function toggleTheme() {
  const next = darkNow() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('diverge:theme', next);
  paintTheme();
}

function paintMute() { $('#mute').innerHTML = isMuted() ? ICON_OFF : ICON_ON; $('#mute').setAttribute('aria-pressed', String(isMuted())); }

function chrome(inRoom) {
  $('#home-link').hidden = !inRoom;
  const chip = $('#room-chip');
  chip.hidden = !inRoom || !app.code;
  chip.textContent = app.code;
}

function show(html, { inRoom = !!app.role } = {}) {
  cancelAnimationFrame(app.raf);
  screen.innerHTML = html;
  chrome(inRoom);
  window.scrollTo({ top: 0 });
}

// ───────────────────────── home ─────────────────────────
function goHome(prefillCode = '') {
  leave();
  app.key = '';
  show(ui.home({ name: app.name, code: prefillCode }), { inRoom: false });
  const target = app.name ? (prefillCode ? null : $('#code')) : $('#name');
  if (prefillCode && app.name) $('[data-act="join"]').focus();
  else target?.focus({ preventScroll: true });
}

function leave() {
  try { app.hostNet?.close(); } catch {}
  try { app.link?.close(); } catch {}
  app.game?.clearTimer();
  Object.assign(app, { role: null, game: null, hostNet: null, link: null, view: null, key: '', code: '' });
}

function readEntry() {
  const name = $('#name').value.trim().slice(0, 16);
  if (!name) { toast('Pick a name first.', 2600, 'error'); $('#name').focus(); return null; }
  app.name = name;
  store.set('diverge:name', name);
  return name;
}

// ───────────────────────── hosting ─────────────────────────
async function startHosting() {
  show(ui.connecting('Opening a room…'), { inRoom: false });
  const conns = new Map(); // connectionId → pid
  const broadcast = (s) => { for (const cid of conns.keys()) app.hostNet?.send(cid, { t: 'state', s }); };
  try {
    const h = await net.host({
      onMessage(cid, msg) {
        if (!app.game || !msg || typeof msg !== 'object') return;
        if (msg.t === 'hello') {
          const pid = String(msg.pid || '');
          if (conns.has(cid) && conns.get(cid) !== pid) return; // one player per connection
          const res = app.game.join(pid, msg.name, String(msg.secret || ''));
          if (!res.ok) { h.send(cid, { t: 'reject', error: res.error }); return; }
          conns.set(cid, pid);
          h.send(cid, { t: 'state', s: app.game.publicState() });
          return;
        }
        const pid = conns.get(cid);
        if (pid && msg.t === 'answer') app.game.submit(pid, msg.text);
      },
      onClose(cid) {
        const pid = conns.get(cid);
        conns.delete(cid);
        if (pid && ![...conns.values()].includes(pid)) app.game?.setConnected(pid, false);
      },
      onError: (m) => toast(m, 3000, 'error'),
    });
    app.role = 'host';
    app.hostNet = h;
    app.code = h.code;
    app.game = new Game({
      code: h.code,
      onChange: (g) => { const s = g.publicState(); broadcast(s); receive(s); },
    });
    app.game.join(app.me, app.name, app.secret);
  } catch (e) {
    show(ui.lost({ title: "Couldn't open a room", msg: e.message, rejoin: false }), { inRoom: false });
  }
}

// ───────────────────────── joining ─────────────────────────
async function joinGame(code) {
  leave();
  app.code = code;
  show(ui.connecting(`Joining ${code}…`), { inRoom: false });
  try {
    const link = await net.join(code, {
      onMessage(msg) {
        if (msg?.t === 'state') receive(msg.s);
        else if (msg?.t === 'reject') { goHome(code); toast(msg.error, 3500, 'error'); }
      },
      onClose() {
        if (app.role !== 'client') return;
        app.role = null;
        show(ui.lost({ title: 'Lost the host', msg: 'The host left or their connection dropped. If they\'re still around you can hop back in.', rejoin: true }), { inRoom: false });
      },
      onError: (m) => toast(m, 3000, 'error'),
    });
    app.role = 'client';
    app.link = link;
    app.code = code;
    link.send({ t: 'hello', pid: app.me, secret: app.secret, name: app.name });
  } catch (e) {
    show(ui.lost({ title: 'No luck joining', msg: e.message, rejoin: true }), { inRoom: false });
  }
}

// ───────────────────────── rendering ─────────────────────────
function receive(s) {
  const prev = app.view;
  app.view = s;
  const isHost = app.role === 'host';
  const key = `${s.phase}:${s.round}`;
  const fresh = key !== app.key;
  app.key = key;

  if (prev && prev.phase !== 'lobby' && s.phase !== 'lobby') {
    const was = new Map(prev.players.map((p) => [p.pid, p.connected]));
    if (s.players.some((p) => was.get(p.pid) && !p.connected)) sfx.leave();
    else if (s.players.some((p) => was.get(p.pid) === false && p.connected)) sfx.join();
  }

  switch (s.phase) {
    case 'lobby':
      show(ui.lobby(s, app.me, isHost));
      if (prev && prev.phase === 'lobby' && s.players.length > prev.players.length) sfx.join();
      else if (prev && prev.phase === 'lobby' && s.players.length < prev.players.length) sfx.leave();
      break;

    case 'question': {
      const target = performance.now() + s.endsIn;
      if (fresh) {
        app.myAnswer = null;
        app.duration = s.duration;
        app.deadline = target;
        app.lastSec = -1;
        show(ui.question(s, app.me, app.myAnswer));
        if (s.round === 1) sfx.start();
        else if (s.question.duel && !prev?.question?.duel) sfx.gong(); // first showdown round
        else sfx.deal();
        const input = $('#ans');
        if (input && matchMedia('(hover: hover)').matches) input.focus({ preventScroll: true });
        runTimer();
      } else {
        if (Math.abs(target - app.deadline) > 400) app.deadline = target;
        const strip = $('[data-slot="strip"]');
        if (strip) strip.outerHTML = ui.strip(s, app.me);
        if (!$('#ans') && !ui.isPlaying(s, app.me)) $('[data-slot="action"]').innerHTML = ui.answerArea(s, app.me, app.myAnswer);
      }
      break;
    }

    case 'reveal':
      if (fresh) {
        show(ui.reveal(s, app.me, isHost, { animate: true }));
        playRevealSounds(s);
      } else {
        // Host toggled an "allow": update in place without replaying the show.
        const next = document.createElement('div');
        next.innerHTML = ui.reveal(s, app.me, isHost, { animate: false });
        for (const sel of ['[data-slot="verdict"]', '[data-slot="cards"]', '[data-slot="strip"]', '.foot']) {
          $(sel, screen).innerHTML = $(sel, next).innerHTML;
        }
        const rp = $('.reprieve', screen), rp2 = $('.reprieve', next);
        if (rp && !rp2) rp.remove();
        else if (!rp && rp2) $('[data-slot="verdict"]').after(rp2);
      }
      break;

    case 'over':
      if (fresh) {
        show(ui.over(s, app.me, isHost));
        setTimeout(() => { confetti(); sfx.win(); }, 350);
      }
      break;
  }
}

function playRevealSounds(s) {
  // Cards flip in every 0.32 s (see CARD_STEP in ui.js); clashes and the bomb land with their card.
  const groups = s.reveal.groups;
  groups.forEach((g, i) => {
    const at = i * 0.32;
    sfx.flip(at + 0.05);
    if (g.status === 'clash') sfx.clash(at + 0.55);
    if (g.status === 'bomb') sfx.bomb(at + 0.55);
  });
  const mine = groups.find((g) => g.pids.includes(app.me));
  const end = groups.length * 0.32 + 0.45;
  const { losses, reprieve } = s.reveal;
  if (!reprieve && Object.keys(losses).length) sfx.heart(end + 0.3); // hearts drain in the strip
  const me = s.players.find((p) => p.pid === app.me);
  if (!reprieve && losses[app.me] && me?.lives === 1) sfx.out(end + 0.7);
  if (!mine) return;
  if (mine.status === 'valid') sfx.safe(end);
  else if (mine.status === 'invalid' || mine.status === 'blank') sfx.nope(end);
}

function runTimer() {
  const timer = $('[data-slot="timer"]');
  if (!timer) return;
  const fill = $('.fill', timer), secs = $('.secs', timer);
  const step = () => {
    if (app.view?.phase !== 'question') return;
    const left = Math.max(0, app.deadline - performance.now());
    fill.style.transform = `scaleX(${left / app.duration})`;
    const sec = Math.ceil(left / 1000);
    if (sec !== app.lastSec) {
      app.lastSec = sec;
      secs.textContent = `${sec}s`;
      timer.classList.toggle('warn', sec <= 8 && sec > 4);
      timer.classList.toggle('panic', sec <= 4 && sec > 0);
      if (sec <= 5 && sec > 0 && $('#ans')) sfx.tick(sec <= 2);
    }
    if (left <= 0) {
      timer.classList.remove('panic');
      const input = $('#ans');
      if (input) submitAnswer(input.value); // whatever they typed counts
      return;
    }
    app.raf = requestAnimationFrame(step);
  };
  app.raf = requestAnimationFrame(step);
}

function submitAnswer(text) {
  if (app.myAnswer != null || app.view?.phase !== 'question') return;
  const clean = String(text ?? '').trim().slice(0, 60);
  app.myAnswer = clean;
  if (app.role === 'host') app.game.submit(app.me, clean);
  else app.link?.send({ t: 'answer', text: clean });
  sfx.lock();
  const slot = $('[data-slot="action"]');
  if (slot) slot.innerHTML = ui.answerArea(app.view, app.me, app.myAnswer);
}

// ───────────────────────── input ─────────────────────────
const actions = {
  host() { if (readEntry()) startHosting(); },
  join() {
    if (!readEntry()) return;
    const code = net.cleanCode($('#code').value);
    if (code.length !== 4) { toast('Room codes are 4 letters.', 2600, 'error'); $('#code').focus(); return; }
    joinGame(code);
  },
  start() { const r = app.game?.start(); if (r && !r.ok) toast(r.error, 2600, 'error'); },
  async copy() {
    const url = `${location.origin}${location.pathname}?room=${app.code}`;
    try { await navigator.clipboard.writeText(url); toast('Invite link copied. Send it to your friends.'); sfx.copied(); }
    catch { prompt('Copy this link:', url); }
  },
  allow(el) { app.game?.toggleAllow(el.dataset.key); sfx.pop(); },
  next() { app.game?.next(); },
  again() { app.game?.backToLobby(); },
  rejoin() { if (app.name && app.code) joinGame(app.code); else goHome(app.code); },
  home() { goHome(); },
};

// Little UI noises: every button taps, buttons hum on hover (mouse only), keys click.
document.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  const b = e.target.closest('button');
  if (b && !b.disabled) sfx.tap();
});
const canHover = matchMedia('(hover: hover)').matches;
document.addEventListener('pointerover', (e) => {
  if (!canHover || e.pointerType !== 'mouse') return;
  const b = e.target.closest('.btn, .icon-btn');
  if (b && !b.disabled && !b.contains(e.relatedTarget)) sfx.hover();
});
document.addEventListener('keydown', (e) => {
  if (e.target.matches?.('input') && (e.key.length === 1 || e.key === 'Backspace')) sfx.key();
});

screen.addEventListener('click', (e) => {
  sfx.unlock();
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  e.preventDefault();
  actions[el.dataset.act]?.(el);
});

screen.addEventListener('submit', (e) => {
  e.preventDefault();
  sfx.unlock();
  const form = e.target;
  if (form.dataset.form === 'answer') {
    const v = $('#ans').value;
    if (!v.trim()) { toast('Type something first! (or wait and get nothing)', 2600, 'error'); return; }
    submitAnswer(v);
  } else if (form.dataset.form === 'enter') {
    // Enter joins when there's a code (e.g. from an invite link); otherwise it hosts.
    if (document.activeElement?.id === 'code' || net.cleanCode($('#code').value).length === 4) actions.join();
    else actions.host();
  }
});

screen.addEventListener('input', (e) => {
  if (e.target.id === 'code') {
    const c = net.cleanCode(e.target.value);
    if (c !== e.target.value) e.target.value = c;
  }
});

$('#mute').addEventListener('click', () => { setMuted(!isMuted()); paintMute(); if (!isMuted()) sfx.toggle(); });
$('#home-link').addEventListener('click', () => {
  const midGame = app.role && app.view && app.view.phase !== 'lobby';
  const hosting = app.role === 'host' && app.view?.players.length > 1;
  if ((midGame || hosting) && !confirm(app.role === 'host' ? 'Leave? This ends the game for everyone.' : 'Leave this game?')) return;
  goHome();
});

window.addEventListener('beforeunload', (e) => {
  if (app.role === 'host' && app.view?.players.some((p) => p.pid !== app.me && p.connected)) { e.preventDefault(); e.returnValue = ''; }
});

// ───────────────────────── boot ─────────────────────────
paintMute();
paintTheme();
$('#theme').addEventListener('click', () => { toggleTheme(); sfx.toggle(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', paintTheme);
const params = new URLSearchParams(location.search);
goHome(net.cleanCode(params.get('room')));
