// Screen templates. Pure functions: state in, HTML string out.
// Interactive elements use data-act="..." and are wired up in app.js.

import { TIER_NAMES } from './questions.js';
import { LIVES } from './game.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const CARD_STEP = 0.32; // seconds between reveal cards; keep in sync with CSS

export const avatar = (p, cls = '') =>
  `<span class="ava ${cls}" style="--c:${p.color}" aria-hidden="true">${esc([...p.name][0] || '?')}</span>`;

const HEART = '<path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/>';
export function hearts(lives, losing = 0, delay = 0) {
  let out = '';
  for (let i = 0; i < LIVES; i++) {
    const cls = i < lives - losing ? '' : i < lives ? 'losing' : 'empty';
    out += `<svg class="heart ${cls}" viewBox="0 0 24 24" style="--delay:${delay}s">${HEART}</svg>`;
  }
  return `<span class="hearts" aria-label="${lives} ${lives === 1 ? 'life' : 'lives'} left">${out}</span>`;
}

/** Make the interesting bits of a prompt pop: single capital letters, numbers, quoted endings. */
function promptHTML(text) {
  return esc(text)
    .replace(/&quot;(-?[a-z]+)&quot;/g, '<span class="hl">$1</span>')
    .replace(/\b([A-Z])\b(?!')/g, '<span class="hl">$1</span>')
    .replace(/(?<![#\w])(\d+)\b(?!;)/g, '<span class="hl">$1</span>');
}

const spinner = () => `<span class="spinner">${['var(--tomato)', 'var(--sun)', 'var(--mint)', 'var(--sky)']
  .map((c, i) => `<i style="--c:${c};--i:${i}"></i>`).join('')}</span>`;

// ───────────────────────── home ─────────────────────────
export function home({ name = '', code = '' } = {}) {
  const letters = [...'diverge'].map((ch, i) =>
    `<span class="${i === 4 ? 'odd' : ''}" style="--i:${i}">${ch}</span>`).join('');
  return `
  <section class="home">
    <h1 class="logo" aria-label="Diverge">${letters}</h1>
    <p class="tagline">Say the thing <strong>nobody else</strong> says.</p>
    <form class="card entry" data-form="enter" autocomplete="off">
      <div>
        <label class="label" for="name">Your name</label>
        <input class="field" id="name" name="name" maxlength="16" placeholder="e.g. Ziggy" value="${esc(name)}" required>
      </div>
      <button class="btn primary big" type="submit" data-act="host">Host a game</button>
      <div class="or">or join a friend</div>
      <div class="join-row">
        <input class="field code-input" id="code" name="code" maxlength="4" placeholder="CODE" value="${esc(code)}" inputmode="text" autocapitalize="characters" aria-label="Room code">
        <button class="btn" type="button" data-act="join">Join</button>
      </div>
    </form>
    <ol class="how">
      <li><b style="--c:var(--sun);--r:-5deg">1</b><p><strong>Everyone gets the same prompt.</strong> “Name a country with a Z.” Easy, right?</p></li>
      <li><b style="--c:var(--tomato);--r:4deg">2</b><p><strong>Say the same as anyone and you both lose a heart.</strong> Wrong or blank answers cost one too.</p></li>
      <li><b style="--c:var(--mint);--r:-2deg">3</b><p><strong>Prompts get stingier every round.</strong> Last one with a heart left wins.</p></li>
    </ol>
  </section>`;
}

export const connecting = (msg) => `
  <section class="status">${spinner()}<h2>${esc(msg)}</h2><p>Hang tight, this takes a second or two.</p></section>`;

export const lost = ({ title, msg, rejoin }) => `
  <section class="status">
    <div style="font-size:3rem" aria-hidden="true">🫠</div>
    <h2>${esc(title)}</h2><p>${esc(msg)}</p>
    <div class="row">
      ${rejoin ? '<button class="btn primary" data-act="rejoin">Try again</button>' : ''}
      <button class="btn" data-act="home">Back home</button>
    </div>
  </section>`;

// ───────────────────────── lobby ─────────────────────────
export function lobby(v, me, isHost) {
  const hostP = v.players[0];
  const ready = v.players.filter((p) => p.connected).length;
  const chips = v.players.map((p, i) => `
    <li>${avatar(p)}<span>${esc(p.name)}</span>
      ${i === 0 ? '<span class="crown" title="Host">👑</span>' : ''}
      ${p.pid === me ? '<span class="you">(you)</span>' : ''}</li>`).join('');
  return `
  <section class="lobby">
    <div class="card room-card">
      <span class="label">Room code</span>
      <div class="big-code" aria-label="Room code ${esc([...v.code].join(' '))}">${[...v.code].map((c) => `<span>${esc(c)}</span>`).join('')}</div>
      <button class="btn small" data-act="copy">Copy invite link</button>
    </div>
    <h2 class="section-h">Players <span class="n">${ready} in the room</span></h2>
    <ul class="roster" data-slot="roster">${chips}${ready < 2 ? '<li class="ghost">waiting for a friend…</li>' : ''}</ul>
    <div class="lobby-foot">
      ${isHost
        ? `<button class="btn go big" data-act="start" ${ready < 2 ? 'disabled' : ''}>Start game</button>
           <p class="hint">${ready < 2 ? 'Share the code. You need at least 2 players.' : `Everyone starts with ${LIVES} hearts. Good luck.`}</p>`
        : `<p class="waiting">Waiting for ${esc(hostP?.name || 'the host')} to start<span class="dots"></span></p>`}
    </div>
  </section>`;
}

// ───────────────────────── players strip ─────────────────────────
export function strip(v, me, { losses = null, delay = 0 } = {}) {
  const items = v.players.filter((p) => !p.spectator || p.outRound).map((p) => {
    const losing = losses && losses[p.pid] && !v.reveal?.reprieve ? 1 : 0;
    const out = p.lives <= 0;
    const cls = [out && 'out', !p.connected && 'away', p.pid === me && 'me'].filter(Boolean).join(' ');
    return `
    <li class="${cls}">
      ${avatar(p)}
      <span class="meta"><span class="nm">${esc(p.name)}</span>${out ? '<small>out</small>' : hearts(p.lives, losing, delay)}</span>
      ${p.locked ? '<span class="check" aria-label="locked in">✓</span>' : ''}
      ${losing ? `<span class="minus" style="--delay:${delay}s">−1</span>` : ''}
    </li>`;
  }).join('');
  return `<ul class="strip" data-slot="strip" aria-label="Players">${items}</ul>`;
}

// ───────────────────────── question ─────────────────────────
const heat = (t) => `<span class="heat" data-t="${t}" title="Difficulty">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= t ? 'on' : ''}"></i>`).join('')}${TIER_NAMES[t]}</span>`;

export function questionHead(v) {
  return `
    <div class="q-meta"><span class="round-no">Round ${v.round}</span>${heat(v.question.tier)}</div>`;
}

export const isPlaying = (v, me) => { const p = v.players.find((x) => x.pid === me); return !!p && !p.spectator && p.lives > 0; };

export function answerArea(v, me, myAnswer) {
  const p = v.players.find((x) => x.pid === me);
  if (!isPlaying(v, me)) return `<div class="watching">${p?.spectator && !p.outRound ? "You joined mid-game, so you're watching this one. You're in next game." : "You're out. Sit back and enjoy the carnage."}</div>`;
  if (p.locked || myAnswer != null) return `
    <div class="locked-in"><span class="seal">✓</span><span><small>Locked in</small><strong>${myAnswer == null ? '<em>your answer is in</em>' : myAnswer ? esc(myAnswer) : '<em>nothing…</em>'}</strong></span></div>`;
  return `
    <form class="answer" data-form="answer" autocomplete="off">
      <input class="field" id="ans" name="ans" maxlength="60" placeholder="Something nobody else will say…" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Your answer">
      <button class="btn primary" type="submit">Lock it in</button>
    </form>`;
}

export function question(v, me, myAnswer) {
  const action = answerArea(v, me, myAnswer);
  return `
  <section class="q">
    ${questionHead(v)}
    ${v.question.duel ? showdownBanner(v) : ''}
    <article class="card prompt ${v.question.duel ? 'duel' : ''}">
      <span class="tag-sticker">${esc(v.question.tag)}</span>
      <h2>${promptHTML(v.question.text)}</h2>
      ${v.question.duel ? `<p class="possible">Only ${v.question.count} answers on our list. One of them is the bomb.</p>` : ''}
    </article>
    <div class="timer" data-slot="timer" role="timer"><div class="fill"></div><span class="secs"></span></div>
    <div data-slot="action">${action}</div>
    ${strip(v, me)}
  </section>`;
}

// ───────────────────────── reveal ─────────────────────────
const STAMP = { valid: 'Safe', clash: 'Clash', invalid: 'Nope', blank: 'Too slow', bomb: 'Boom' };

function showdownBanner(v) {
  return `
    <div class="showdown" role="note">
      <span class="fuse" aria-hidden="true">💣</span>
      <span><strong>Showdown.</strong> One answer is secretly a bomb. Say it and lose a heart. Matching each other is fine now.</span>
    </div>`;
}
const names = (list) => list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;

function verdict(v, me, groups, delay) {
  const p = v.players.find((x) => x.pid === me);
  if (!p || p.spectator || p.lives <= 0 && !v.reveal.losses[me]) {
    const clashes = groups.filter((g) => g.status === 'clash').length;
    if (v.reveal.bomb) {
      const hit = groups.some((g) => g.status === 'bomb');
      return `<div class="verdict spectate" style="--delay:${delay}s"><strong>${hit ? 'Boom!' : 'Nobody blew up.'}</strong>The bomb was ${esc(v.reveal.bomb)}.</div>`;
    }
    return `<div class="verdict spectate" style="--delay:${delay}s"><strong>${clashes ? `${clashes} clash${clashes > 1 ? 'es' : ''}!` : 'Clean round.'}</strong>You're watching from the sidelines.</div>`;
  }
  const g = groups.find((x) => x.pids.includes(me));
  const lastHeart = v.reveal.losses[me] && !v.reveal.reprieve && p.lives === 1 ? ' That was your last heart.' : '';
  const label = esc(g?.label || '');
  const byPid = (pid) => v.players.find((x) => x.pid === pid)?.name || '?';
  if (!g || g.status === 'blank') return `<div class="verdict nope" style="--delay:${delay}s"><strong>Too slow!</strong>No answer, no heart.${lastHeart}</div>`;
  const bombNote = v.reveal.bomb ? ` The bomb was ${esc(v.reveal.bomb)}.` : '';
  if (g.status === 'bomb') return `<div class="verdict clash" style="--delay:${delay}s"><strong>Boom!</strong>${label} was the bomb.${lastHeart}</div>`;
  if (g.status === 'valid' && v.reveal.bomb) {
    const twin = g.pids.length > 1 ? ` You both said ${label}, which is fine in a showdown.` : '';
    return `<div class="verdict safe" style="--delay:${delay}s"><strong>Safe!</strong>${twin}${bombNote}</div>`;
  }
  if (g.status === 'valid') return `<div class="verdict safe" style="--delay:${delay}s"><strong>Safe!</strong>Nobody else said ${label}.${g.allowed ? ' (The host allowed it.)' : ''}</div>`;
  if (g.status === 'clash') {
    const others = g.pids.filter((x) => x !== me).map((x) => esc(byPid(x)));
    return `<div class="verdict clash" style="--delay:${delay}s"><strong>Clash!</strong>You and ${names(others)} both said ${label}.${lastHeart}</div>`;
  }
  const why = g.reason === 'nofit' ? `${label} is real, but it doesn't fit.` : `We don't know “${esc(g.raws[0])}”. Ask the host to allow it?`;
  return `<div class="verdict nope" style="--delay:${delay}s"><strong>Nope.</strong>${why}${lastHeart}${bombNote}</div>`;
}

export function revealCards(v, isHost, animate) {
  return v.reveal.groups.map((g, i) => {
    const who = g.pids.map((pid) => v.players.find((p) => p.pid === pid)).filter(Boolean)
      .map((p) => `<span class="who-chip">${avatar(p)}${esc(p.name)}</span>`).join('');
    const typed = g.status !== 'blank' && g.raws.some((r) => r.toLowerCase() !== g.label.toLowerCase())
      ? `<div class="typed">typed: ${g.raws.map(esc).join(', ')}</div>` : '';
    const why = g.status === 'invalid' ? `<div class="why">${g.reason === 'nofit' ? "real, but doesn't fit" : 'not on our list'}</div>` : '';
    const canAllow = isHost && (g.status === 'invalid' || g.allowed);
    return `
    <div class="ans-card s-${g.status} ${g.allowed ? 'allowed' : ''} ${animate ? '' : 'static'}" style="--i:${i}">
      <span class="stamp">${g.allowed && g.status === 'valid' ? 'Allowed' : v.reveal.bomb && g.status === 'valid' && g.pids.length > 1 ? 'Twins' : STAMP[g.status]}</span>
      <div class="ans ${g.status === 'blank' ? 'muted' : ''}">${g.status === 'blank' ? 'no answer' : esc(g.label)}</div>
      ${typed}${why}
      <div class="who">${who}</div>
      ${canAllow ? `<button class="btn small allow" data-act="allow" data-key="${esc(g.key)}">${g.allowed ? 'Undo allow' : '✓ Allow it'}</button>` : ''}
    </div>`;
  }).join('');
}

export function reveal(v, me, isHost, { animate = true } = {}) {
  const r = v.reveal;
  const after = animate ? r.groups.length * CARD_STEP + 0.5 : 0;
  const coulda = r.suggestions?.length
    ? `<p class="could" style="--delay:${after}s"><b>Could've said:</b> ${r.suggestions.map((s) => `<span class="pill">${esc(s)}</span>`).join(' ')} <span>· ${v.question.count} on our list</span></p>` : '';
  const willEnd = v.players.filter((p) => !p.spectator && p.lives - (r.reprieve ? 0 : (r.losses[p.pid] || 0)) > 0).length <= 1;
  return `
  <section class="reveal">
    ${questionHead(v)}
    <div class="mini-prompt"><small>${esc(v.question.tag)}</small>${promptHTML(v.question.text)}</div>
    <div data-slot="verdict">${verdict(v, me, r.groups, after)}</div>
    ${r.bomb && !r.groups.some((g) => g.status === 'bomb') ? `<div class="bomb-reveal" style="--delay:${after}s"><span aria-hidden="true">💣</span> The bomb was <strong>${esc(r.bomb)}</strong>. Nobody touched it.</div>` : ''}
    ${r.reprieve ? `<div class="reprieve" style="--delay:${after}s">${r.bomb ? "You'd both be out, so nobody loses a heart. Another showdown!" : "Everyone would've been knocked out, so nobody loses a heart. Phew."}</div>` : ''}
    <div class="cards" data-slot="cards">${revealCards(v, isHost, animate)}</div>
    ${coulda}
    <div data-slot="strip">${strip(v, me, { losses: r.losses, delay: animate ? after : 0 })}</div>
    <div class="foot">
      ${isHost
        ? `<button class="btn primary big" data-act="next">${willEnd ? 'See who won' : 'Next prompt'} →</button>`
        : `<p class="waiting">Waiting for the host<span class="dots"></span></p>`}
    </div>
  </section>`;
}

// ───────────────────────── game over ─────────────────────────
export function over(v, me, isHost) {
  const byPid = new Map(v.players.map((p) => [p.pid, p]));
  const w = byPid.get(v.winner);
  const rows = v.standings.map((pid, i) => {
    const p = byPid.get(pid);
    const sub = p.lives > 0 ? hearts(p.lives) : `<span class="sub">out in round ${p.outRound}</span>`;
    return `<li style="--i:${i}">${avatar(p)}<span class="nm">${esc(p.name)}${pid === me ? ' (you)' : ''}</span>${sub}</li>`;
  }).join('');
  const blurb = w?.pid === me ? 'Your brain is officially weird. Congrats.' : 'The most original mind in the room.';
  return `
  <section class="over">
    <div class="winner">
      <span class="crown-big" aria-hidden="true">👑</span>
      ${w ? avatar(w, 'lg') : ''}
      <h1>${w ? `${esc(w.name)} wins!` : 'Nobody wins?!'}</h1>
      <p>${blurb}</p>
    </div>
    <ol class="standings">${rows}</ol>
    <div class="foot">
      ${isHost
        ? '<button class="btn go big" data-act="again">Play again</button>'
        : '<p class="waiting">Waiting for the host to start another<span class="dots"></span></p>'}
    </div>
  </section>`;
}
