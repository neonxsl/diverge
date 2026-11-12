# Diverge — design

A browser party game: everyone answers the same prompt ("Name a country containing T and U"); matching anyone else, giving an invalid answer, or leaving it blank costs a life. Last player standing wins. Questions get progressively harder (fewer valid answers), squeezing players together.

## Constraints
- Vanilla HTML/CSS/JS, ES modules, no build step. Served by any static server.
- Multiplayer is peer-to-peer WebRTC via PeerJS (CDN). The public PeerJS broker is used only for signaling; ICE uses STUN plus the user's TURN relay at `turn.neonxsl.dev` (TLS on 443, plus 3478), configured in `config.js`.
- The host's browser is authoritative. Answers are never sent to other peers before the reveal.

## Rules
- Host creates a 4-letter room; others join by code or `?room=` link. The host plays too. Need at least 2 players to start.
- 3 lives each. Per round: timer `max(15, 26 - round)` seconds; one locked answer per player (final). Typed-but-unlocked text auto-submits at zero.
- Reveal: valid answers grouped by canonical entry. Group size >1 = clash (-1 for each). Invalid (unknown, or a real item that doesn't fit) = -1. Blank = -1.
- The host can "allow" an invalid answer group during the reveal (the answer lists are incomplete); it then counts as a normal valid answer.
- Reprieve: if every alive player would hit 0 lives, nobody loses a life.
- Showdown: when exactly 2 players are alive, each round uses a question with 3–6 answers (widening to 12 if needed) and secretly picks one valid answer as the bomb. Saying the bomb, an invalid answer or a blank costs a life; matching each other does not. The bomb is revealed with the answers.
- Lives are committed when the host presses Next. When 1 or fewer players are alive, the game is over and standings are shown. Players who join mid-game spectate.

## Questions
- `js/data.js`: category lists (countries, cities, capitals, animals, fruits, vegetables, elements, sports, instruments, colours, body parts, jobs, dog breeds, clothing, foods, car brands, languages, flowers) with aliases; plus hand-written questions with explicit answer sets.
- `js/questions.js`: a generator crosses categories with constraints (starts/ends with, contains both X and Y, without letter, exact/min/max length, double letter, same first/last letter, vowel start/end, multi-word, 3+ of a letter, starts X ends Y, suffix). Keeps questions with ≥3 answers. Tier is set by answer count: T1 ≥40, T2 20–39, T3 11–19, T4 6–10, T5 3–5.
- Kinds: hand-written (~150), tag slices of categories (`js/data/tags.js`, e.g. "an African country"), tag + twist ("…starting with M"), and whole-category letter rules. Picks are weighted by kind (hand 50%, tag 20%, tag+twist 15%, rules 12%, bare category 3%), then by rule type.
- Round r draws from tier `min(5, 1 + floor((r-1)/2))`, picking a constraint type first and then a question (for variety). It prefers questions with more answers than there are alive players, never repeats a question, and avoids repeating the category.

## Matching (`js/match.js`)
- Normalize: strip accents, lowercase, `&`→and, drop punctuation and a leading the/a/an, `st`→saint; the key has no spaces.
- Order: exact (with plural variants) → fuzzy over the whole category (Damerau-Levenshtein ≤1 for 5–8 chars, ≤2 for 9+, unique best only) → judged against the question's qualifying set. Real-but-not-fitting gives `nofit`.

## Modules
`net.js` (PeerJS host/join), `game.js` (pure host engine, testable), `match.js`, `questions.js`, `data.js`, `ui.js` (rendering), `app.js` (wiring), `sound.js`, `config.js`.

## Look
Paper and stickers: warm off-white background, 3px ink outlines, hard offset shadows, Bricolage Grotesque, tomato/sunflower/mint/sky/pink accents, slight rotations. Reveal cards flip in with a stagger; clashes shake; hearts pop. Phone-first.

## Testing
`node --test`: normalization/matching, generator invariants (≥3 answers, valid tiers, unique ids), engine round resolution (clash, invalid, blank, reprieve, allow, winner). Manual multi-tab playtest.
