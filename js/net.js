// Thin PeerJS wrapper. Host = a peer whose id is derived from the room code.
// Messages are plain JSON objects.

import { ICE_SERVERS, PEER_PREFIX } from '../config.js';

const CODE_CHARS = 'BCDFGHJKLMNPQRSTVWXZ'; // no vowels → no accidental words
export const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

function iceServers() {
  // Browsers reject TURN entries without credentials, so drop them when unset.
  return ICE_SERVERS.filter((s) => {
    const isTurn = [].concat(s.urls).some((u) => u.startsWith('turn'));
    return !isTurn || (s.username && s.credential);
  });
}

function newPeer(id) {
  if (!window.Peer) throw new Error('Networking library failed to load. Check your connection.');
  return new window.Peer(id, { config: { iceServers: iceServers() }, debug: 1 });
}

const friendly = (err) => ({
  'peer-unavailable': "Couldn't find that room. Check the code?",
  'unavailable-id': 'That room code is taken.',
  'network': 'Lost connection to the matchmaking server.',
  'server-error': 'Matchmaking server is having a moment. Try again.',
  'browser-incompatible': "This browser can't do peer-to-peer. Try Chrome, Safari or Firefox.",
}[err?.type] || err?.message || 'Something went wrong connecting.');

/**
 * Open a room. Resolves once registered with the broker.
 * handlers: { onOpen(connId), onMessage(connId, msg), onClose(connId) }
 */
export function host(handlers, tries = 4) {
  return new Promise((resolve, reject) => {
    const code = makeCode();
    const peer = newPeer(PEER_PREFIX + code);
    const conns = new Map();
    let ready = false;
    peer.on('open', () => {
      ready = true;
      resolve({
        code,
        send(connId, msg) { const c = conns.get(connId); if (c?.open) c.send(msg); },
        close() { peer.destroy(); },
      });
    });
    peer.on('connection', (conn) => {
      conn.on('open', () => { conns.set(conn.connectionId, conn); handlers.onOpen?.(conn.connectionId); });
      conn.on('data', (msg) => handlers.onMessage?.(conn.connectionId, msg));
      const gone = () => { if (conns.delete(conn.connectionId)) handlers.onClose?.(conn.connectionId); };
      conn.on('close', gone);
      conn.on('error', gone);
    });
    peer.on('disconnected', () => { if (!peer.destroyed) peer.reconnect(); }); // keep the room findable
    peer.on('error', (err) => {
      if (!ready && err.type === 'unavailable-id' && tries > 0) { peer.destroy(); host(handlers, tries - 1).then(resolve, reject); return; }
      if (!ready) { peer.destroy(); reject(new Error(friendly(err))); return; }
      handlers.onError?.(friendly(err));
    });
  });
}

/**
 * Join a room by code. Resolves with { send, close } once the data channel is open.
 * handlers: { onMessage(msg), onClose() }
 */
export function join(code, handlers, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const peer = newPeer();
    let settled = false;
    const fail = (msg) => { if (settled) return; settled = true; peer.destroy(); reject(new Error(msg)); };
    const timer = setTimeout(() => fail("Couldn't reach the host. They may be on a strict network."), timeoutMs);
    peer.on('error', (err) => { if (!settled) { clearTimeout(timer); fail(friendly(err)); } else handlers.onError?.(friendly(err)); });
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' });
      conn.on('open', () => {
        clearTimeout(timer);
        settled = true;
        resolve({ send: (msg) => conn.open && conn.send(msg), close: () => peer.destroy() });
      });
      conn.on('data', (msg) => handlers.onMessage?.(msg));
      conn.on('close', () => { if (settled) handlers.onClose?.(); });
      conn.on('error', () => { if (settled) handlers.onClose?.(); });
    });
  });
}
