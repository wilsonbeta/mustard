/*
    Mustard Form — Proxy-based form state management

    Direct assignment, auto dirty tracking, validation, error mirror.
    Zero dependencies (besides @mustrd/core).

    Usage:
    const [form, errors, edited] = createForm(
        { name: '', email: '' },
        { name: true, email: v => v.includes('@') || 'Invalid email' }
    )

    form.name = 'Wilson'
    errors.name             // null (valid)
    errors.email            // 'Invalid email'
    errors.$valid           // false
    edited.name             // true
    form.$dirty()           // { name: 'Wilson' }
*/

import { createMustard, squeeze, record, getAtPath, type MustardStore } from "@mustrd/core";

// ==================== Types ====================

type ValidateFn = (value: any, allValues: any) => true | string;

/** Rule: true = required, function = custom validator */
type Rule = true | ValidateFn;

/** Rules tree: mirrors data shape. Array wraps one rule for each item. */
type RuleNode = Rule | RuleMap | [RuleNode];
type RuleMap = { [key: string]: RuleNode };

interface ErrorEntry {
    path: string;
    message: string;
}

export interface FormApi {
    /** Get only changed fields (for PATCH requests). depth:1 lifts to first-level keys with complete values. */
    $dirty: (opts?: { depth?: number }) => Record<string, any>;
    /** Get list of changed field paths */
    $dirtyFields: () => string[];
    /** Check if any field has changed */
    $isDirty: () => boolean;
    /** Get all field values as plain object */
    $values: () => Record<string, any>;
    /** Reset all fields to initial values, clear dirty + edited */
    $reset: () => void;
    /** Clear dirty + edited tracking (new baseline, keep current values) */
    $clear: () => void;
    /** Get the underlying mustard store */
    $store: MustardStore;
}

// ==================== Validation Engine ====================

const isEmpty = (v: any) => v === '' || v === null || v === undefined;

const validateOne = (value: any, rule: Rule, allValues: any, path: string): string | null => {
    if (rule === true) {
        return isEmpty(value) ? `${path.split('.').pop()} is required` : null;
    }
    const result = rule(value, allValues);
    return result === true ? null : result;
};

const collectErrors = (state: any, rules: any, allValues: any, basePath: string = ''): ErrorEntry[] => {
    if (rules == null || typeof rules !== 'object') return [];

    const errors: ErrorEntry[] = [];

    // Array rule: [itemRule] — apply to each element
    if (Array.isArray(rules)) {
        if (rules.length === 1 && Array.isArray(state)) {
            const itemRule = rules[0];
            for (let i = 0; i < state.length; i++) {
                const itemPath = basePath ? `${basePath}.${i}` : `${i}`;
                if (itemRule === true || typeof itemRule === 'function') {
                    const msg = validateOne(state[i], itemRule, allValues, itemPath);
                    if (msg) errors.push({ path: itemPath, message: msg });
                } else if (typeof itemRule === 'object') {
                    errors.push(...collectErrors(state[i], itemRule, allValues, itemPath));
                }
            }
        }
        return errors;
    }

    // Object rules
    for (const key of Object.keys(rules)) {
        const rule = rules[key];
        const fullPath = basePath ? `${basePath}.${key}` : key;
        const value = state?.[key];

        if (rule === true || typeof rule === 'function') {
            const msg = validateOne(value, rule, allValues, fullPath);
            if (msg) errors.push({ path: fullPath, message: msg });
        } else if (typeof rule === 'object' && rule !== null) {
            errors.push(...collectErrors(value, rule, allValues, fullPath));
        }
    }

    return errors;
};

// ==================== Form Factory ====================

export const createForm = <T extends object>(data: T, rules?: RuleMap) => {
    const store = createMustard(data);
    const initialValues = squeeze(data);

    // Error cache (invalidates when store version changes)
    let cachedErrorMap: Map<string, string> | null = null;
    let cachedErrorList: ErrorEntry[] | null = null;
    let cachedVersion = -1;

    const getErrors = () => {
        const version = store.getVersion();
        if (cachedVersion === version && cachedErrorMap && cachedErrorList) {
            return { map: cachedErrorMap, list: cachedErrorList };
        }
        const list = rules ? collectErrors(store.getState(), rules, store.getState()) : [];
        const map = new Map(list.map(e => [e.path, e.message]));
        cachedErrorMap = map;
        cachedErrorList = list;
        cachedVersion = version;
        return { map, list };
    };

    // ==================== Form Proxy ====================

    const formApi: FormApi = {
        $dirty: (opts?) => {
            const data = record(store.proxy).data();
            if (opts?.depth === 1) {
                const state = store.getState() as any;
                const result: any = {};
                for (const key of Object.keys(data)) {
                    result[key] = squeeze(state[key]);
                }
                return result;
            }
            return data;
        },
        $dirtyFields: () => record(store.proxy).paths(),
        $isDirty: () => record(store.proxy).size() > 0,
        $values: () => squeeze(store.getState()),
        $reset: () => {
            store.proxy.reset(initialValues);
            record(store.proxy).clear();
        },
        $clear: () => {
            record(store.proxy).clear();
        },
        $store: store,
    };

    const formProxy = new Proxy({} as any, {
        get(_, key: string) {
            if (key in formApi) return (formApi as any)[key];
            return store.proxy[key];
        },
        set(_, key: string, value) {
            if (key.startsWith('$')) return true;
            store.proxy[key] = value;
            return true;
        },
        ownKeys() {
            return Object.keys(store.getState());
        },
        getOwnPropertyDescriptor(_, key: string | symbol) {
            const state = store.getState();
            if (typeof key === 'string' && key in state) {
                return { configurable: true, enumerable: true, writable: true, value: store.proxy[key] };
            }
            return undefined;
        },
        has(_, key) {
            return key in store.getState() || key in formApi;
        },
    });

    // ==================== Errors Mirror Proxy ====================

    const errorsCache = new Map<string, any>();

    const createErrorsProxy = (basePath: string[] = []): any => {
        const cacheKey = basePath.join('\0');
        let cached = errorsCache.get(cacheKey);
        if (cached) return cached;

        cached = new Proxy({} as any, {
            get(_, key: string | symbol) {
                if (typeof key === 'symbol') return undefined;

                // Top-level $ helpers
                if (basePath.length === 0) {
                    if (key === '$valid') return getErrors().list.length === 0;
                    if (key === '$all') return getErrors().list;
                    if (key === '$first') {
                        const list = getErrors().list;
                        return list.length > 0 ? list[0] : null;
                    }
                }

                const fullPath = [...basePath, key];
                const pathStr = fullPath.join('.');

                // If value at path is object/array, return sub-proxy for deeper access
                const value = getAtPath(store.getState(), fullPath);
                if (typeof value === 'object' && value !== null) {
                    return createErrorsProxy(fullPath);
                }

                // Leaf: return error message or null
                return getErrors().map.get(pathStr) ?? null;
            },
        });

        errorsCache.set(cacheKey, cached);
        return cached;
    };

    // ==================== Edited Mirror Proxy ====================

    const editedCache = new Map<string, any>();

    const createEditedProxy = (basePath: string[] = []): any => {
        const cacheKey = basePath.join('\0');
        let cached = editedCache.get(cacheKey);
        if (cached) return cached;

        cached = new Proxy({} as any, {
            get(_, key: string | symbol) {
                if (typeof key === 'symbol') return undefined;

                const fullPath = [...basePath, key];
                const pathStr = fullPath.join('.');

                // If value at path is object/array, return sub-proxy for deeper access
                const value = getAtPath(store.getState(), fullPath);
                if (typeof value === 'object' && value !== null) {
                    return createEditedProxy(fullPath);
                }

                // Leaf: check if this path appears in record history
                const paths = record(store.proxy).paths();
                return paths.some(p => p === pathStr || p.startsWith(pathStr + '.'));
            },
        });

        editedCache.set(cacheKey, cached);
        return cached;
    };

    // ==================== Return Tuple ====================

    return [formProxy, createErrorsProxy(), createEditedProxy()] as [T & FormApi, any, any];
};
