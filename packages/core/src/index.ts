/*
    Mustard Core — Proxy-based state engine

    Pure JavaScript. No framework dependency.
    Provides: createMustard, record, unwrap, squeeze
*/

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
    /**
     * Reactive proxy. Reads/writes trigger notifications.
     * Reserved string properties: `$` (snapshot), `reset(data)` (replace state).
     * For type-safe access, use `useMustard(store)` which returns `T`.
     */
    proxy: any;
}

// ==================== Constants ====================

export const MST_STORE = Symbol.for('mustard.store');
export const MST_SOURCE = Symbol.for('mustard.source');
export const MST_RECORD = Symbol.for('mustard.record');

export const MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']);
export const ITERATORS = new Set(['forEach', 'map', 'filter', 'find', 'findIndex', 'some', 'every', 'reduce', 'reduceRight', 'flatMap']);
/** Reserved string keys on the proxy: `$` returns snapshot, `reset` returns reset function */
export const INTERNAL_KEYS = new Set(['$', 'reset']);

// ==================== Utilities ====================

/** Unwrap proxy to get raw value */
export const unwrap = (obj: any): any => {
    if (obj != null && typeof obj === 'object') {
        const source = obj[MST_SOURCE];
        if (source !== undefined) return source;
    }
    return obj;
};

/** Get record API from a mustard proxy */
export const record = (obj: any): RecordApi => obj[MST_RECORD];

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
export const setPathValue = (curr: any, path: any[], callback: Function, depth = 0): any => {
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
export const getAtPath = (state: any, path: string[]): any => {
    let current = state;
    for (let i = 0; i < path.length; i++) {
        if (current == null) return undefined;
        current = current[path[i]];
    }
    return current;
};

/** Build nested object from flat record entries (aggregated) */
export const buildNested = (entries: RecordEntry[]): any => {
    const result: LooseObject = {};
    for (const entry of entries) {
        const segs = entry.path.split('.');
        let current = result;
        for (let i = 0; i < segs.length - 1; i++) {
            const nextSeg = segs[i + 1];
            if (current[segs[i]] == null) {
                current[segs[i]] = /^\d+$/.test(nextSeg) ? [] : {};
            }
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
    // Synchronous notification — React 18 automatic batching handles coalescing
    const notify = () => {
        version++;
        listeners.forEach(l => l());
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
            if (index < 0 || index >= history.length) return;
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
                // Symbol keys: internal Mustard symbols + user symbols
                if (typeof key === 'symbol') {
                    if (key === MST_STORE) return store;
                    if (key === MST_SOURCE) return getCurrent();
                    if (key === MST_RECORD) return recordApi;
                    const curr = getCurrent();
                    if (curr == null) return undefined;
                    const val = curr[key];
                    return typeof val === 'function' ? val.bind(curr) : val;
                }

                if (key === '$') return getCurrent();

                if (key === 'reset') return (data: any) => {
                    state = typeof data === 'function' ? squeeze(data()) : squeeze(data);
                    notify();
                };

                const curr = getCurrent();
                if (curr == null) return undefined;
                const value = curr[key];

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
