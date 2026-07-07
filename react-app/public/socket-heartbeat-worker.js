/**
 * socket-heartbeat-worker.js
 * ──────────────────────────
 * Web Workers run in a separate OS thread.
 * The browser NEVER throttles or freezes Web Worker timers,
 * even when the tab is backgrounded, minimized, or switched away from.
 * 
 * This worker sends a tick message to the main thread every 10 seconds.
 * The main thread uses that tick to send a heartbeat to the server,
 * keeping the WebSocket alive regardless of tab visibility.
 */

let interval = null;

self.onmessage = (e) => {
  if (e.data === 'start') {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      self.postMessage('tick');
    }, 10000); // every 10 seconds — well within any server timeout
  }

  if (e.data === 'stop') {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
};