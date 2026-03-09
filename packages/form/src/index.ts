/*
    Mustard Form — Proxy-based form state management

    Direct assignment, auto dirty tracking, validation, submit.
    Zero dependencies (besides @mustrd/core).

    Usage:
    const form = createForm({
        name: { value: '', required: true },
        email: { value: '', validate: v => v.includes('@') || 'Invalid email' },
    })

    form.name = 'Wilson'
    form.$dirty()     // { name: 'Wilson' }
    form.$errors()    // null
    form.$validate()  // true
    form.$reset()     // back to initial values
*/

import { createMustard, squeeze, record, type MustardStore } from "@mustrd/core";

// ==================== Types ====================

type ValidateFn = (value: any, allValues: any) => true | string;

export interface FieldConfig {
    value: any;
    required?: boolean | string;
    validate?: ValidateFn;
}

export type FormConfig = Record<string, FieldConfig | string | number | boolean | null>;

export interface FormApi {
    /** Get only changed fields (for PATCH requests) */
    $dirty: () => Record<string, any>;
    /** Get list of changed field names */
    $dirtyFields: () => string[];
    /** Check if any field has changed */
    $isDirty: () => boolean;
    /** Get all field values as plain object */
    $values: () => Record<string, any>;
    /** Validate all fields, returns true if valid */
    $validate: () => boolean;
    /** Get validation errors (null if valid) */
    $errors: () => Record<string, string> | null;
    /** Reset all fields to initial values */
    $reset: () => void;
    /** Clear dirty tracking (new baseline, keep current values) */
    $clear: () => void;
    /** Submit: validate then call handler with dirty fields */
    $submit: (handler: (dirty: Record<string, any>, values: Record<string, any>) => Promise<any> | any) => Promise<any>;
    /** Get the underlying mustard store */
    $store: MustardStore;
}

// ==================== Form Factory ====================

export const createForm = <T extends FormConfig>(config: T) => {
    // Parse config: separate field configs from plain values
    const fieldConfigs: Record<string, FieldConfig> = {};
    const initialValues: Record<string, any> = {};

    for (const key of Object.keys(config)) {
        const def = config[key];
        if (def && typeof def === 'object' && 'value' in def) {
            fieldConfigs[key] = def as FieldConfig;
            initialValues[key] = def.value;
        } else {
            fieldConfigs[key] = { value: def };
            initialValues[key] = def;
        }
    }

    // Create mustard store
    const store = createMustard(initialValues);

    // Validation
    const validateAll = (): Record<string, string> | null => {
        const state = store.getState();
        const errors: Record<string, string> = {};
        let hasErrors = false;

        for (const key of Object.keys(fieldConfigs)) {
            const cfg = fieldConfigs[key];
            const value = state[key];

            // Required check
            if (cfg.required) {
                const isEmpty = value === '' || value === null || value === undefined;
                if (isEmpty) {
                    const msg = typeof cfg.required === 'string' ? cfg.required : `${key} is required`;
                    errors[key] = msg;
                    hasErrors = true;
                    continue;
                }
            }

            // Custom validation
            if (cfg.validate) {
                const result = cfg.validate(value, state);
                if (result !== true) {
                    errors[key] = result;
                    hasErrors = true;
                }
            }
        }

        return hasErrors ? errors : null;
    };

    // Form API methods (prefixed with $ to avoid field name collisions)
    const formApi: FormApi = {
        $dirty: () => record(store.proxy).data(),
        $dirtyFields: () => record(store.proxy).paths(),
        $isDirty: () => record(store.proxy).size() > 0,
        $values: () => squeeze(store.getState()),
        $validate: () => validateAll() === null,
        $errors: () => validateAll(),
        $reset: () => {
            store.proxy.reset(initialValues);
            record(store.proxy).clear();
        },
        $clear: () => {
            record(store.proxy).clear();
        },
        $submit: async (handler) => {
            const errors = validateAll();
            if (errors) return { success: false, errors };

            const dirty = record(store.proxy).data();
            const values = squeeze(store.getState());

            const result = await handler(dirty, values);
            record(store.proxy).clear();
            return result;
        },
        $store: store,
    };

    // Create proxy that merges field access with form API
    const proxy = new Proxy({} as any, {
        get(_, key: string) {
            // $ methods
            if (key in formApi) return (formApi as any)[key];

            // Field access through store proxy
            return store.proxy[key];
        },

        set(_, key: string, value) {
            // Don't allow overwriting $ methods
            if (key.startsWith('$')) return true;

            // Set field value through store proxy
            store.proxy[key] = value;
            return true;
        },

        ownKeys() {
            return Object.keys(store.getState());
        },

        getOwnPropertyDescriptor(_, key: string | symbol) {
            const state = store.getState();
            if (typeof key === 'string' && key in state) {
                return { configurable: true, enumerable: true, writable: true, value: (state as any)[key] };
            }
            return undefined;
        },

        has(_, key) {
            return key in store.getState() || key in formApi;
        },
    });

    return proxy as { [K in keyof T]: T[K] extends FieldConfig ? T[K]['value'] : T[K] } & FormApi;
};
