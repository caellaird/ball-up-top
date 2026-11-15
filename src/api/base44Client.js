import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Global request throttle: the Base44 API rate-limits concurrent calls.
// Pages that mount multiple effects (Profile, Home, Challenges) fire many
// entity calls at t=0 and trip 429s. This queue spaces every entity read/write
// call apart by a fixed interval so they never burst, regardless of how many
// components mount simultaneously. Semantics are unchanged — calls are just
// delayed, never dropped.
const MIN_INTERVAL = 150; // ms between dispatched calls
const THROTTLED_METHODS = new Set(['filter', 'list', 'get', 'create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'updateMany', 'deleteMany']);

let _queue = Promise.resolve();
let _lastDispatch = 0;

// Detect a rate-limit rejection (HTTP 429 or the SDK's "Rate limit exceeded"
// message) so a throttled call can transparently back off and retry instead of
// surfacing the error to the user.
function isRateLimitError(err) {
  if (!err) return false;
  const msg = String(err.message || err);
  if (/rate limit/i.test(msg)) return true;
  const status = err.status ?? err.statusCode ?? err.response?.status;
  return status === 429;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Sliding 60s window per method, kept just under the server's own allowance
// (list/filter/count and get are the ones profile and feed screens exhaust).
const WINDOW_MS = 60000;
const WINDOW_LIMITS = {
  list: 120, filter: 120, count: 120,
  get: 140,
  create: 70, update: 60, delete: 60,
  bulkCreate: 20, bulkUpdate: 20, updateMany: 20, deleteMany: 20,
};
const _windows = new Map(); // method -> timestamps of dispatched calls

async function waitForWindowSlot(method) {
  const limit = WINDOW_LIMITS[method];
  if (!limit) return;
  for (;;) {
    const now = Date.now();
    const stamps = (_windows.get(method) || []).filter((t) => now - t < WINDOW_MS);
    if (stamps.length < limit) {
      stamps.push(now);
      _windows.set(method, stamps);
      return;
    }
    // Wait for the oldest call in the window to age out, then try again.
    await sleep(WINDOW_MS - (now - stamps[0]) + 50);
  }
}

// Honour the server's "Retry after Ns" hint when it sends one, and back off
// long enough that a full 60s window can free up a slot.
const BACKOFFS = [1000, 3000, 6000, 10000, 15000];

function retryDelayMs(err, attempt) {
  const hint = String(err?.message || '').match(/retry after\s+(\d+(?:\.\d+)?)\s*s/i);
  const hintedMs = hint ? Math.ceil(parseFloat(hint[1]) * 1000) : 0;
  return Math.max(hintedMs, BACKOFFS[attempt] ?? 15000);
}

async function withRetry(fn) {
  let lastErr;
  for (let attempt = 0; attempt <= BACKOFFS.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRateLimitError(err) || attempt === BACKOFFS.length) break;
      await sleep(retryDelayMs(err, attempt));
    }
  }
  throw lastErr;
}

function throttled(fn, method) {
  return (...args) => {
    const run = async () => {
      const wait = Math.max(0, _lastDispatch + MIN_INTERVAL - Date.now());
      if (wait > 0) await sleep(wait);
      await waitForWindowSlot(method);
      _lastDispatch = Date.now();
      return withRetry(() => fn(...args));
    };
    _queue = _queue.then(run, run);
    return _queue;
  };
}

// Wrap entity methods lazily via Proxies so we don't depend on how the SDK
// enumerates entity names or places methods on prototypes vs. own props.
const _entities = base44.entities;
const _wrappedEntities = new Map();
base44.entities = new Proxy(_entities, {
  get(target, entityName) {
    const entity = target[entityName];
    if (!entity || typeof entity !== 'object') return entity;
    if (!_wrappedEntities.has(entityName)) {
      _wrappedEntities.set(entityName, new Proxy(entity, {
        get(t, methodName) {
          const fn = t[methodName];
          if (typeof fn === 'function' && THROTTLED_METHODS.has(methodName)) {
            return throttled(fn.bind(t), methodName);
          }
          return fn;
        }
      }));
    }
    return _wrappedEntities.get(entityName);
  }
});

export { base44 };