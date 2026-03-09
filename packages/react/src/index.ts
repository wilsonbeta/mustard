/*
    Mustard React — React bindings for Mustard core

    Usage:
    const state = useMustard({ name: '', count: 0 });
    state.name = 'foo';  // only re-renders components that read `name`
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

import {
    createMustard,
    INTERNAL_KEYS,
    type MustardStore,
} from "@mustrd/core";

// Re-export everything from core
export { createMustard, record, unwrap, squeeze } from "@mustrd/core";
export type { RecordApi, MustardStore } from "@mustrd/core";


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
            if (typeof key === 'symbol' || INTERNAL_KEYS.has(key as string)) return source[key];

            const value = source[key];
            if (typeof value === 'function' || value == null) return value;

            const childPath = [...path, key as string];
            const childKey = childPath.join('\0');

            if (typeof value === 'object') {
                pending.current.set(childKey, value._MST_SOURCE_);
                return createAutoProxy(value, pending, childPath, cache);
            }

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

    const tracked = useRef<Map<string, any>>(new Map());
    const pending = useRef<Map<string, any>>(new Map());
    const stableVer = useRef(-1);

    pending.current = new Map();

    useSyncExternalStore(
        store.subscribe,
        () => {
            if (tracked.current.size === 0) return store.getVersion();

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
            return stableVer.current;
        },
        () => store.getVersion()
    );

    useEffect(() => {
        if (pending.current.size > 0) tracked.current = pending.current;
        stableVer.current = store.getVersion();
    });

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

export const useStores = () => useContext(Context);

export const useStore = (key: string | ((stores: any) => any)) => {
    const stores: any = useContext(Context);
    const store = typeof key === 'function' ? key(stores) : stores[key];
    return useMustard(store);
};
