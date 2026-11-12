// Sound effects (CC0 samples from OpenGameArt, see assets/sfx/CREDITS.md) + confetti.
// Samples are decoded into Web Audio buffers on the first user gesture, so they can
// overlap and play with no lag. If a file can't load, a tiny synth blip stands in.

let ctx = null;
let master = null;
const buffers = new Map();
let muted = (() => { try { return localStorage.getItem('diverge:muted') === '1'; } catch { return false; } })();

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('diverge:muted', m ? '1' : '0'); } catch {}
}

// name → [volume, synth fallback frequency]
const SOUNDS = {
  deal: [0.7, 520], flip: [0.45, 460], lock: [0.85, 700], pop: [0.6, 600], tick: [0.3, 1200],
  safe: [0.75, 880], clash: [0.9, 140], nope: [0.55, 240], bomb: [1, 90], join: [0.7, 500], win: [0.85, 1040],
  tap: [0.35, 800], hover: [0.12, 1400], key: [0.12, 1600], toggle: [0.45, 700], copied: [0.5, 1300],
  error: [0.45, 200], heart: [0.5, 300], out: [0.6, 180], start: [0.6, 660], gong: [0.55, 110], leave: [0.45, 260],
};

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    loadAll();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function loadAll() {
  for (const name of Object.keys(SOUNDS)) {
    fetch(`assets/sfx/${name}.m4a`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((data) => new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad)))
      .then((buf) => buffers.set(name, buf))
      .catch(() => {}); // fallback blip covers it
  }
}

function play(name, { at = 0, rate = 1, vol = 1 } = {}) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const [base, freq] = SOUNDS[name];
  const t = a.currentTime + at;
  const g = a.createGain();
  g.gain.value = base * vol;
  g.connect(master);
  const buf = buffers.get(name);
  if (buf) {
    const src = a.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.connect(g);
    src.start(t);
    return;
  }
  const o = a.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq * rate, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2 * base, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g);
  o.start(t); o.stop(t + 0.14);
}

const wobble = (spread) => 1 + (Math.random() - 0.5) * spread;

export const sfx = {
  unlock: () => ac(),
  deal: () => play('deal'),
  pop: () => play('pop', { rate: wobble(0.15) }),
  lock: () => play('lock'),
  tick: (urgent = false) => play('tick', { rate: urgent ? 1.25 : 1 }),
  flip: (at = 0) => play('flip', { at, rate: wobble(0.3) }),
  safe: (at = 0) => play('safe', { at }),
  clash: (at = 0) => play('clash', { at }),
  nope: (at = 0) => play('nope', { at }),
  bomb: (at = 0) => play('bomb', { at }),
  join: () => play('join', { rate: wobble(0.2) }),
  win: () => { play('win'); play('safe', { at: 0.45, rate: 1.5, vol: 0.6 }); },
  tap: () => play('tap', { rate: wobble(0.12) }),
  hover: () => throttled('hover', 90) && play('hover', { rate: wobble(0.2) }),
  key: () => throttled('key', 35) && play('key', { rate: wobble(0.35) }),
  toggle: () => play('toggle'),
  copied: () => play('copied'),
  error: () => play('error'),
  heart: (at = 0) => play('heart', { at }),
  out: (at = 0) => play('out', { at }),
  start: () => play('start'),
  gong: (at = 0) => play('gong', { at }),
  leave: () => play('leave'),
};

const lastAt = new Map();
function throttled(name, ms) {
  const now = performance.now();
  if (now - (lastAt.get(name) || 0) < ms) return false;
  lastAt.set(name, now);
  return true;
}

export function confetti(colors = ['#ff5a36', '#ffc533', '#33c48a', '#4b9dff', '#ff7cb8']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.getElementById('confetti');
  const g = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  g.scale(dpr, dpr);
  const bits = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 4,
    w: 7 + Math.random() * 7, h: 4 + Math.random() * 6,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  (function frame(now) {
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r);
      g.fillStyle = b.c; g.strokeStyle = '#1c1915'; g.lineWidth = 1.5;
      g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
      g.restore();
    }
    if (now - start < 4500) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight);
  })(start);
}
