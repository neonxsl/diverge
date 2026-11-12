// Connection settings. This is the only file you should need to touch.
//
// TURN relays traffic when two players can't connect directly (strict Wi-Fi,
// phone hotspots, school/work networks). Same relay + login as Embervale.

export const TURN_HOST = 'turn.neonxsl.dev';
export const TURN_USERNAME = 'embervale';
export const TURN_PASSWORD = '640bed7b5eca1953d9f201c893e030ec';

export const ICE_SERVERS = [
  { urls: [`stun:${TURN_HOST}:3478`, 'stun:stun.l.google.com:19302'] },
  {
    urls: [
      `turns:${TURN_HOST}:443?transport=tcp`,
      `turn:${TURN_HOST}:3478?transport=udp`,
      `turn:${TURN_HOST}:3478?transport=tcp`,
    ],
    username: TURN_USERNAME,
    credential: TURN_PASSWORD,
  },
  // Fallback: PeerJS's free public relay, in case ours is down.
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
];

// Prefix for PeerJS ids so our room codes don't collide with other apps on the public broker.
export const PEER_PREFIX = 'diverge-v1-';
