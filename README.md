# Diverge

A party game: everyone answers the same prompt. Say the same thing as anyone else, give a wrong answer, or run out the clock, and you lose a heart. Prompts get stingier every round. The last player with a heart wins.

- ~2,500 questions, generated from category lists × letter rules, plus hand-written ones
- Difficulty tiers by how many valid answers exist (mild → brutal)
- Forgiving matching: typos, accents, aliases ("USA"), plurals
- The host can "allow" an answer that's missing from the lists
- Showdown when two are left: one answer is a secret bomb
- Light and dark mode (follows your system, toggle in the top bar)
- Sound effects: CC0 samples from OpenGameArt, credited in `assets/sfx/CREDITS.md`

## Run it

Any static server works (ES modules don't load from `file://`):

```sh
python3 -m http.server 5173     # then open http://localhost:5173
# or: npm start   (uses npx serve)
```

Host a game, share the 4-letter code or the invite link, and play from phones or laptops.
To play with people outside your network, deploy the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages).

## Networking

Peer-to-peer WebRTC via PeerJS. The host's browser runs the game. The public PeerJS server is only used to introduce players (a few seconds per join), then all traffic goes player ↔ host directly, or through the TURN relay when a direct connection fails.

TURN settings live in `config.js`. If `turn.neonxsl.dev` needs a login, fill in `TURN_USERNAME` / `TURN_PASSWORD`. While they're empty, the TURN entry is skipped and only STUN is used, which works on most home Wi-Fi but can fail on strict networks.

## Code

| file | job |
| --- | --- |
| `js/data/*.js` | category lists and hand-written questions |
| `js/questions.js` | question generator, tiers, picking |
| `js/match.js` | normalising and fuzzy-matching answers |
| `js/game.js` | host-side game engine (pure, tested) |
| `js/net.js` | PeerJS host/join |
| `js/ui.js`, `js/app.js`, `js/fx.js` | screens, wiring, sounds and confetti |

Tests: `npm test` (Node 20+).
