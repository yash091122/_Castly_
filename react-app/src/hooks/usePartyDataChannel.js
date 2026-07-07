/**
 * usePartyDataChannel
 * ───────────────────
 * Opens a WebRTC DataChannel named "castly-party" on every SimplePeer
 * connection in the room.  Once established, all real-time in-room events
 * (sync:play/pause/seek, chat:message, media:status, etc.) flow through
 * DataChannels instead of Socket.io.
 *
 * WHY THIS MATTERS
 * ────────────────
 * Browsers give WebRTC connections (ICE keepalives) "media" priority and
 * never throttle them when the tab is backgrounded.  A Socket.io WebSocket,
 * on the other hand, is a normal HTTP upgrade and gets frozen or killed when
 * Chrome/Firefox/Safari decide to save CPU.  Moving signaling onto
 * DataChannels means tab-switches never break the party.
 *
 * DESIGN
 * ──────
 * • Every peer gets a DataChannel called "castly-party".
 * • Messages are JSON: { type: string, payload: object }
 * • The hook returns a `dcSend(type, payload)` function that fans out to all
 *   open channels simultaneously (broadcast).
 * • It also returns `dcOn(type, handler)` / `dcOff(type, handler)` for
 *   subscribing to incoming messages — same API as socket.on/off.
 * • If a DataChannel isn't open yet (peer still connecting), messages are
 *   queued per-peer and flushed once the channel opens.
 * • Fallback: if ALL channels are closed (e.g. only 1 participant), callers
 *   can detect this via `dcReady` and fall back to Socket.io themselves.
 */

import { useRef, useCallback, useEffect } from 'react';

const CHANNEL_NAME = 'castly-party';
const MAX_QUEUE = 50; // max queued messages per peer before dropping old ones

export function usePartyDataChannel(peersRef) {
  // Map<socketId, RTCDataChannel>
  const channelsRef = useRef(new Map());
  // Map<socketId, Array<string>> — outbound queue while channel is connecting
  const queuesRef = useRef(new Map());
  // Map<type, Set<handler>>
  const listenersRef = useRef(new Map());

  // ── internal: dispatch an incoming message to registered handlers ──────
  const dispatch = useCallback((type, payload) => {
    const handlers = listenersRef.current.get(type);
    if (handlers) {
      handlers.forEach(h => {
        try { h(payload); } catch (e) { console.error('[DC] handler error', type, e); }
      });
    }
    // Also dispatch to '*' wildcard listeners
    const wildcards = listenersRef.current.get('*');
    if (wildcards) {
      wildcards.forEach(h => {
        try { h(type, payload); } catch (e) { console.error('[DC] wildcard error', e); }
      });
    }
  }, []);

  // ── wire up a DataChannel (called for both sides of the peer) ──────────
  const wireChannel = useCallback((socketId, channel) => {
    console.log(`[DC] Wiring channel for peer ${socketId}, state: ${channel.readyState}`);

    channelsRef.current.set(socketId, channel);

    channel.onopen = () => {
      console.log(`[DC] ✅ Channel open with ${socketId}`);
      // Flush any queued messages
      const queue = queuesRef.current.get(socketId) || [];
      queue.forEach(msg => {
        try { channel.send(msg); } catch (e) {
          console.warn('[DC] flush send error', e);
        }
      });
      queuesRef.current.delete(socketId);
    };

    channel.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        dispatch(type, payload);
      } catch (e) {
        console.warn('[DC] bad message', event.data, e);
      }
    };

    channel.onerror = (e) => {
      console.warn(`[DC] Channel error with ${socketId}:`, e);
    };

    channel.onclose = () => {
      console.log(`[DC] Channel closed with ${socketId}`);
      channelsRef.current.delete(socketId);
      queuesRef.current.delete(socketId);
    };
  }, [dispatch]);

  // ── attach to a new SimplePeer ──────────────────────────────────────────
  // Call this right after createPeer() / addPeer().
  // For the INITIATOR: create the DataChannel on the peer connection.
  // For the RECEIVER:  listen for the ondatachannel event.
  const attachToPeer = useCallback((socketId, peer, isInitiator) => {
    if (!peer || peer.destroyed) return;

    // Wait until the RTCPeerConnection exists (it's created async inside SimplePeer)
    const tryAttach = () => {
      const pc = peer._pc;
      if (!pc) {
        // Not ready yet – retry shortly
        setTimeout(tryAttach, 50);
        return;
      }

      if (isInitiator) {
        // Create the channel from our side
        try {
          const ch = pc.createDataChannel(CHANNEL_NAME, {
            ordered: true,         // guaranteed delivery order
            maxRetransmits: 3      // give up after 3 retransmits (low-latency trade-off)
          });
          wireChannel(socketId, ch);
        } catch (e) {
          console.warn('[DC] createDataChannel failed:', e);
        }
      } else {
        // Wait for the remote side to create it
        pc.ondatachannel = (event) => {
          if (event.channel.label === CHANNEL_NAME) {
            wireChannel(socketId, event.channel);
          }
        };
      }
    };

    tryAttach();
  }, [wireChannel]);

  // ── broadcast a message to all open channels ───────────────────────────
  // Falls back to queuing for channels that are still connecting.
  const dcSend = useCallback((type, payload) => {
    const msg = JSON.stringify({ type, payload });

    channelsRef.current.forEach((channel, socketId) => {
      if (channel.readyState === 'open') {
        try {
          channel.send(msg);
        } catch (e) {
          console.warn(`[DC] send error to ${socketId}:`, e);
        }
      } else if (channel.readyState === 'connecting') {
        // Queue it
        if (!queuesRef.current.has(socketId)) {
          queuesRef.current.set(socketId, []);
        }
        const q = queuesRef.current.get(socketId);
        q.push(msg);
        // Drop oldest if queue is too long
        if (q.length > MAX_QUEUE) q.shift();
      }
      // 'closing' / 'closed' → drop silently (caller should fall back to socket)
    });
  }, []);

  // ── send to a specific peer only (for point-to-point messages) ─────────
  const dcSendTo = useCallback((socketId, type, payload) => {
    const msg = JSON.stringify({ type, payload });
    const channel = channelsRef.current.get(socketId);
    if (!channel) return false;

    if (channel.readyState === 'open') {
      try { channel.send(msg); return true; } catch (e) { return false; }
    } else if (channel.readyState === 'connecting') {
      if (!queuesRef.current.has(socketId)) queuesRef.current.set(socketId, []);
      queuesRef.current.get(socketId).push(msg);
      return true;
    }
    return false;
  }, []);

  // ── subscribe / unsubscribe ────────────────────────────────────────────
  const dcOn = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(handler);
  }, []);

  const dcOff = useCallback((type, handler) => {
    listenersRef.current.get(type)?.delete(handler);
  }, []);

  // ── remove a peer's channel when it leaves ────────────────────────────
  const removePeer = useCallback((socketId) => {
    const ch = channelsRef.current.get(socketId);
    if (ch) {
      try { ch.close(); } catch (e) {}
      channelsRef.current.delete(socketId);
    }
    queuesRef.current.delete(socketId);
  }, []);

  // ── how many channels are currently open ──────────────────────────────
  const openCount = useCallback(() => {
    let n = 0;
    channelsRef.current.forEach(ch => { if (ch.readyState === 'open') n++; });
    return n;
  }, []);

  // ── cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(ch => { try { ch.close(); } catch (e) {} });
      channelsRef.current.clear();
      queuesRef.current.clear();
      listenersRef.current.clear();
    };
  }, []);

  return {
    attachToPeer,   // call after every createPeer() / addPeer()
    dcSend,         // broadcast to all peers
    dcSendTo,       // send to one peer
    dcOn,           // subscribe to incoming messages
    dcOff,          // unsubscribe
    removePeer,     // clean up when a peer leaves
    openCount,      // number of open channels right now
    channelsRef     // raw ref, for debugging
  };
}