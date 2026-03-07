/*
    Mustard — Proxy-based state management for React

    - Direct assignment (no setter functions)
    - Auto-tracking: only re-renders when accessed properties change
    - Record: tracks changed fields for partial updates
    - Undo: step-by-step state reversal
    - Structural sharing: efficient immutable updates
    - Zero dependencies (React only)

    Usage:

    // Inline store
    const state = useMustard({ name: '', count: 0 });
    state.name = 'foo';  // only re-renders components that read `name`

    // External store (shared across components)
    const store = createMustard({ name: '', count: 0 });
    const state = useMustard(store);

    // Record & Undo
    record(state).data()   // { name: 'foo' } — only changed fields
    record(state).undo()   // revert last change
    record(state).clear()  // clear history (new baseline)
*/

import {
    useRef,
    useEffect,
    useSyncExternalStore,
    createContext,
    useContext,
    createElement,
    type ReactNode,
} from "react";

// ==================== Types ====================

interface LooseObject { [key: string]: any }

interface RecordEntry {
    path: string;
    before: any;
    after: any;
}

export interface RecordApi {
    /** Changed fields as nested object (for partial updates) */
    data: () => any;
    /** List of changed paths (dot notation) */
    paths: () => string[];
    /** Revert last change */
    undo: () => void;
    /** Revert all changes */
    undoAll: () => void;
    /** Revert to specific history index (exclusive, keeps 0..index-1) */
    undoTo: (index: number) => void;
    /** Clear all records (new baseline) */
    clear: () => void;
    /** Number of recorded changes */
    size: () => number;
}

export interface MustardStore<T = any> {
    getState: () => T;
    getVersion: () => number;
    subscribe: (listener: () => void) => () => void;
    proxy: any;
}

// ==================== Constants ====================

const MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']);
const ITERATORS = new Set(['forEach', 'map', 'filter', 'find', 'findIndex', 'some', 'every', 'reduce', 'reduceRight', 'flatMap']);
const INTERNAL_KEYS = new Set(['_MST_STORE_', '_MST_SOURCE_', '_MST_RECORD_', '$', 'reset']);

// ==================== Utilities ====================

/** Unwrap proxy to get raw value */
export const unwrap = (obj: any): any => {
    if (obj != null && typeof obj === 'object') {
        const source = obj._MST_SOURCE_;
        if (source !== undefined) return source;
    }
    return obj;
};

/** Get record API from a mustard proxy */
export const record = (obj: any): RecordApi => obj._MST_RECORD_;

/** Deep clone (strips proxy references) */
export const squeeze = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
        const arr = [...obj];
        for (let i = 0, len = arr.length; i < len; i++) {
            if (typeof arr[i] === 'object' && arr[i] !== null) arr[i] = squeeze(arr[i]);
        }
        return arr;
    }
    const copy: LooseObject = { ...obj };
    const keys = Object.keys(copy);
    for (let i = 0, len = keys.length; i < len; i++) {
        if (typeof copy[keys[i]] === 'object' && copy[keys[i]] !== null) copy[keys[i]] = squeeze(copy[keys[i]]);
    }
    return copy;
};

/** Structural sharing: create new references along path */
const setPathValue = (curr: any, path: any[], callback: Function, depth = 0): any => {
    if (depth === path.length) {
        const next = Array.isArray(curr) ? [...curr] : { ...curr };
        const result = callback(next);
        return result !== undefined ? result : next;
    }
    const key = path[depth];
    const next = Array.isArray(curr) ? [...curr] : { ...curr };
    next[key] = setPathValue(curr[key], path, callback, depth + 1);
    return next;
};

/** Traverse state by path segments */
const getAtPath = (state: any, path: string[]): any => {
    let current = state;
    for (let i = 0; i < path.length; i++) {
        if (current == null) return undefined;
        current = current[path[i]];
    }
    return current;
};

/** Build nested object from flat record entries (aggregated) */
const buildNested = (entries: RecordEntry[]): any => {
    const result: LooseObject = {};
    for (const entry of entries) {
        const segs = entry.path.split('.');
        let current = result;
        for (let i = 0; i < segs.length - 1; i++) {
            if (current[segs[i]] == null) current[segs[i]] = {};
            current = current[segs[i]];
        }
        current[segs[segs.length - 1]] = entry.after;
    }
    return result;
};


// ==================== Store ====================

export const createMustard = <T extends object>(initialState: T): MustardStore<T> => {
    let state = squeeze(initialState);
    let version = 0;
    const listeners = new Set<() => void>();
    let history: RecordEntry[] = [];
    let pendingNotify = false;

    const notify = () => {
        version++;
        if (!pendingNotify) {
            pendingNotify = true;
            Promise.resolve().then(() => {
                pendingNotify = false;
                listeners.forEach(l => l());
            });
        }
    };

    const pushRecord = (path: string[], key: string, before: any, after: any) => {
        const fullPath = [...path, key].join('.');
        history.push({
            path: fullPath,
            before: typeof before === 'object' && before !== null ? squeeze(before) : before,
            after: typeof after === 'object' && after !== null ? squeeze(after) : after,
        });
    };

    const applyUndo = (entry: RecordEntry) => {
        const segs = entry.path.split('.');
        const parentPath = segs.slice(0, -1);
        const key = segs[segs.length - 1];
        if (parentPath.length === 0) {
            state = { ...state, [key]: entry.before };
        } else {
            state = setPathValue(state, parentPath, (parent: any) => {
                parent[key] = entry.before;
            });
        }
    };

    // Record API
    const recordApi: RecordApi = {
        data: () => {
            // Same path: keep first `before`, latest `after`
            const latest = new Map<string, RecordEntry>();
            for (const entry of history) {
                const existing = latest.get(entry.path);
                if (existing) {
                    existing.after = entry.after;
                } else {
                    latest.set(entry.path, { ...entry });
                }
            }
            return buildNested(Array.from(latest.values()));
        },
        paths: () => [...new Set(history.map(e => e.path))],
        undo: () => {
            const entry = history.pop();
            if (!entry) return;
            applyUndo(entry);
            notify();
        },
        undoAll: () => {
            if (history.length === 0) return;
            while (history.length > 0) applyUndo(history.pop()!);
            notify();
        },
        undoTo: (index: number) => {
            if (index >= history.length) return;
            while (history.length > index) applyUndo(history.pop()!);
            notify();
        },
        clear: () => { history = []; },
        size: () => history.length,
    };

    // Sub-proxy cache
    const proxyCache = new Map<string, any>();

    const createProxy = (path: string[] = []): any => {
        const getCurrent = path.length === 0
            ? () => state
            : () => getAtPath(state, path);

        const curr = getCurrent();
        const target = Array.isArray(curr) ? [] : {};

        const proxy = new Proxy(target, {
            get: (_, key) => {
                // Symbol (iterator, toPrimitive, etc.)
                if (typeof key === 'symbol') {
                    const curr = getCurrent();
                    if (curr == null) return undefined;
                    const val = curr[key];
                    return typeof val === 'function' ? val.bind(curr) : val;
                }

                // Internal properties
                if (key === '_MST_STORE_') return store;
                if (key === '_MST_SOURCE_') return getCurrent();
                if (key === '_MST_RECORD_') return recordApi;
                if (key === '$') return getCurrent();

                // reset: replace entire state
                if (key === 'reset') return (data: any) => {
                    state = typeof data === 'function' ? squeeze(data()) : squeeze(data);
                    notify();
                };

                const curr = getCurrent();
                if (curr == null) return undefined;
                const value = curr[key];

                // Mutating array methods
                if (Array.isArray(curr) && typeof value === 'function' && MUTATORS.has(key)) {
                    return (...args: any[]) => {
                        const cleanArgs = args.map(a => typeof a === 'object' && a !== null ? squeeze(a) : a);
                        const beforeArr = squeeze(curr);

                        let result: any;
                        state = setPathValue(state, path, (arr: any[]) => {
                            result = (arr as any)[key](...cleanArgs);
                            return arr;
                        });

                        const afterArr = squeeze(getAtPath(state, path));
                        const fullPath = path.join('.');
                        history.push({
                            path: fullPath,
                            before: beforeArr,
                            after: afterArr,
                        });

                        notify();
                        return result;
                    };
                }

                // Iterator methods: bind to proxy so callback items are proxied
                if (Array.isArray(curr) && typeof value === 'function' && ITERATORS.has(key)) {
                    return value.bind(proxy);
                }

                if (typeof value === 'function') return value.bind(curr);
                if (typeof value === 'object' && value !== null) {
                    const cacheKey = path.length === 0 ? (key as string) : path.join('\0') + '\0' + key;
                    let child = proxyCache.get(cacheKey);
                    if (!child) {
                        child = createProxy([...path, key as string]);
                        proxyCache.set(cacheKey, child);
                    }
                    return child;
                }
                return value;
            },

            set: (_, key: string, val) => {
                const curr = getCurrent();
                if (curr == null) return true;
                if (curr[key] === val) return true;

                const before = curr[key];
                if (typeof val === 'object' && val !== null) val = squeeze(val);

                state = setPathValue(state, path, (parent: any) => {
                    parent[key] = val;
                });

                pushRecord(path, key, before, val);
                notify();
                return true;
            },

            ownKeys: () => {
                const curr = getCurrent();
                return curr ? Reflect.ownKeys(curr) : [];
            },

            getOwnPropertyDescriptor: (_, key) => {
                const curr = getCurrent();
                if (curr != null && key in curr) {
                    if (key === 'length' && Array.isArray(curr)) {
                        return { configurable: false, enumerable: false, writable: true, value: curr.length };
                    }
                    return { configurable: true, enumerable: true, writable: true, value: curr[key] };
                }
                return undefined;
            },

            deleteProperty: (_, key: string) => {
                const curr = getCurrent();
                if (curr == null || !(key in curr)) return true;

                const before = curr[key];

                state = setPathValue(state, path, (parent: any) => {
                    delete parent[key];
                });

                pushRecord(path, key, before, undefined);
                notify();
                return true;
            },

            has: (_, key) => {
                const curr = getCurrent();
                return curr != null && key in curr;
            },
        });
        return proxy;
    };

    const proxy = createProxy();

    const store: MustardStore<T> = {
        getState: () => state,
        getVersion: () => version,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        proxy,
    };

    return store;
};


// ==================== Hook ====================

export const useMustard = <T extends object>(input: T | MustardStore<T>): T => {
    const storeRef = useRef<MustardStore | null>(null);

    let store: MustardStore;

    if (input && typeof (input as any).subscribe === 'function') {
        store = input as MustardStore;
    } else {
        if (storeRef.current === null) {
            storeRef.current = createMustard(input as T);
        }
        store = storeRef.current;
    }

    // Auto-tracking: track paths read during render, only re-render when they change
    const tracked = useRef<Map<string, any>>(new Map());
    const pending = useRef<Map<string, any>>(new Map());
    const stableVer = useRef(-1);

    // Reset tracked paths each render
    pending.current = new Map();

    useSyncExternalStore(
        store.subscribe,
        () => {
            // First render: no tracked paths, always re-render on change
            if (tracked.current.size === 0) return store.getVersion();

            // Compare tracked paths against current state
            const state = store.getState();
            for (const [pathKey, prevRef] of tracked.current) {
                let curr: any = state;
                const segs = pathKey.split('\0');
                for (let i = 0; i < segs.length; i++) {
                    if (curr == null) { curr = undefined; break; }
                    curr = curr[segs[i]];
                }
                if (curr !== prevRef) return store.getVersion();
            }
            // All tracked values unchanged — stable, skip re-render
            return stableVer.current;
        },
        () => store.getVersion()
    );

    // After render: snapshot tracked paths for next comparison
    useEffect(() => {
        if (pending.current.size > 0) tracked.current = pending.current;
        stableVer.current = store.getVersion();
    });

    // Per-component auto-tracking proxy
    const proxyRef = useRef<any>(null);
    const cacheRef = useRef(new Map<string, any>());
    const prevStoreRef = useRef<any>(null);
    if (!proxyRef.current || store !== prevStoreRef.current) {
        cacheRef.current = new Map();
        proxyRef.current = createAutoProxy(store.proxy, pending, [], cacheRef.current);
        prevStoreRef.current = store;
    }

    return proxyRef.current;
};


// ==================== Global State ====================

const Context = createContext<any>(null);

export const MustardProvider = ({ children, store }: { children: ReactNode; store: any }) =>
    createElement(Context.Provider, { value: store }, children);

/** Get all stores from context (no subscription) */
export const useStores = () => useContext(Context);

/** Get a single store from context (with auto-tracking) */
export const useStore = (key: string | ((stores: any) => any)) => {
    const stores: any = useContext(Context);
    const store = typeof key === 'function' ? key(stores) : stores[key];
    return useMustard(store);
};


// ==================== Auto-Tracking Proxy ====================

const createAutoProxy = (
    source: any,
    pending: { current: Map<string, any> },
    path: string[],
    cache: Map<string, any>,
): any => {
    const pathKey = path.join('\0');
    let proxy = cache.get(pathKey);
    if (proxy) return proxy;

    proxy = new Proxy(source, {
        get(_, key) {
            // Symbol and internal keys: forward without tracking
            if (typeof key === 'symbol' || INTERNAL_KEYS.has(key as string)) return source[key];

            const value = source[key];
            if (typeof value === 'function' || value == null) return value;

            const childPath = [...path, key as string];
            const childKey = childPath.join('\0');

            if (typeof value === 'object') {
                // Track object reference (structural sharing ensures changed objects have new refs)
                pending.current.set(childKey, value._MST_SOURCE_);
                return createAutoProxy(value, pending, childPath, cache);
            }

            // Track primitive value
            pending.current.set(childKey, value);
            return value;
        },
        set(_, key, val) { source[key] = val; return true; },
        deleteProperty(_, key: string) { delete source[key]; return true; },
        ownKeys() { return Reflect.ownKeys(source); },
        getOwnPropertyDescriptor(_, key) {
            const raw = source.$;
            if (raw != null && key in raw) {
                if (key === 'length' && Array.isArray(raw)) {
                    return { configurable: false, enumerable: false, writable: true, value: raw.length };
                }
                return { configurable: true, enumerable: true, writable: true, value: raw[key] };
            }
            return undefined;
        },
        has(_, key) { return key in source; },
    });

    cache.set(pathKey, proxy);
    return proxy;
};
