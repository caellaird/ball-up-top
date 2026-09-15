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
const MIN_INTERVAL = 120; // ms between dispatched calls
const THROTTLED_METHODS = new Set(['filter', 'list', 'get', 'create', 'update', 'delete', 'bulkCreate', 'bulkUpdate', 'updateMany', 'deleteMany']);

let _queue = Promise.resolve();
let _lastDispatch = 0;

function throttled(fn) {
  return (...args) => {
    const run = () => {
      const wait = Math.max(0, _lastDispatch + MIN_INTERVAL - Date.now());
      return new Promise((resolve) => setTimeout(resolve, wait)).then(() => {
        _lastDispatch = Date.now();
        return fn(...args);
      });
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
            return throttled(fn.bind(t));
          }
          return fn;
        }
      }));
    }
    return _wrappedEntities.get(entityName);
  }
});

export { base44 };