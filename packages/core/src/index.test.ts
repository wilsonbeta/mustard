import { describe, it, expect, vi } from 'vitest';
import { createMustard, record, unwrap, squeeze } from './index';

// ==================== squeeze ====================

describe('squeeze', () => {
    it('deep clones plain objects', () => {
        const src = { a: 1, b: { c: 2 } };
        const copy = squeeze(src);
        expect(copy).toEqual(src);
        expect(copy).not.toBe(src);
        expect(copy.b).not.toBe(src.b);
    });

    it('deep clones arrays', () => {
        const src = [{ id: 1 }, { id: 2 }];
        const copy = squeeze(src);
        expect(copy).toEqual(src);
        expect(copy[0]).not.toBe(src[0]);
    });

    it('returns primitives as-is', () => {
        expect(squeeze(1)).toBe(1);
        expect(squeeze('str')).toBe('str');
        expect(squeeze(null)).toBe(null);
        expect(squeeze(undefined)).toBe(undefined);
        expect(squeeze(true)).toBe(true);
    });
});

// ==================== createMustard ====================

describe('createMustard', () => {
    it('creates a store with initial state', () => {
        const store = createMustard({ count: 0, name: 'test' });
        expect(store.getState()).toEqual({ count: 0, name: 'test' });
        expect(store.getVersion()).toBe(0);
    });

    it('deep clones initial state (no shared references)', () => {
        const init = { nested: { x: 1 } };
        const store = createMustard(init);
        init.nested.x = 999;
        expect(store.getState().nested.x).toBe(1);
    });
});

// ==================== Proxy read/write ====================

describe('proxy read/write', () => {
    it('reads values through proxy', () => {
        const store = createMustard({ count: 0, name: 'hello' });
        const p = store.proxy;
        expect(p.count).toBe(0);
        expect(p.name).toBe('hello');
    });

    it('writes values through proxy', () => {
        const store = createMustard({ count: 0 });
        store.proxy.count = 5;
        expect(store.getState().count).toBe(5);
    });

    it('increments version on write', () => {
        const store = createMustard({ count: 0 });
        store.proxy.count = 1;
        expect(store.getVersion()).toBe(1);
    });

    it('skips write when value is the same', () => {
        const store = createMustard({ count: 0 });
        store.proxy.count = 0; // same value
        expect(store.getVersion()).toBe(0);
    });

    it('reads nested objects as proxies', () => {
        const store = createMustard({ user: { name: 'test', address: { city: 'Taipei' } } });
        const p = store.proxy;
        expect(p.user.name).toBe('test');
        expect(p.user.address.city).toBe('Taipei');
    });

    it('writes to nested objects', () => {
        const store = createMustard({ user: { name: 'test' } });
        store.proxy.user.name = 'changed';
        expect(store.getState().user.name).toBe('changed');
    });
});

// ==================== Structural sharing ====================

describe('structural sharing', () => {
    it('only creates new references along the changed path', () => {
        const store = createMustard({
            a: { x: 1 },
            b: { y: 2 },
        });
        const before = store.getState();
        store.proxy.a.x = 10;
        const after = store.getState();

        expect(after).not.toBe(before);
        expect(after.a).not.toBe(before.a); // changed path
        expect(after.b).toBe(before.b);      // untouched — same reference
    });

    it('preserves references for deeply nested sibling paths', () => {
        const store = createMustard({
            user: { name: 'a', address: { city: 'Taipei' } },
            settings: { theme: 'dark' },
        });
        const before = store.getState();
        store.proxy.user.name = 'b';
        const after = store.getState();

        expect(after.settings).toBe(before.settings);
        expect(after.user.address).toBe(before.user.address);
    });
});

// ==================== unwrap ====================

describe('unwrap', () => {
    it('returns raw state from proxy', () => {
        const store = createMustard({ count: 0 });
        const raw = unwrap(store.proxy);
        expect(raw).toBe(store.getState());
    });

    it('returns the value itself for non-proxy', () => {
        expect(unwrap(42)).toBe(42);
        expect(unwrap('str')).toBe('str');
        expect(unwrap(null)).toBe(null);
    });
});

// ==================== $ (snapshot) ====================

describe('$ snapshot', () => {
    it('returns current raw state', () => {
        const store = createMustard({ count: 0 });
        expect(store.proxy.$).toEqual({ count: 0 });
        store.proxy.count = 5;
        expect(store.proxy.$).toEqual({ count: 5 });
    });
});

// ==================== reset ====================

describe('reset', () => {
    it('replaces entire state with a new object', () => {
        const store = createMustard({ count: 0, name: 'old' });
        store.proxy.reset({ count: 99, name: 'new' });
        expect(store.getState()).toEqual({ count: 99, name: 'new' });
    });

    it('accepts a function', () => {
        const store = createMustard({ count: 0 });
        store.proxy.reset(() => ({ count: 42 }));
        expect(store.getState()).toEqual({ count: 42 });
    });

    it('deep clones the reset value', () => {
        const newState = { nested: { x: 1 } };
        const store = createMustard({ nested: { x: 0 } });
        store.proxy.reset(newState);
        newState.nested.x = 999;
        expect(store.getState().nested.x).toBe(1);
    });
});

// ==================== deleteProperty ====================

describe('deleteProperty', () => {
    it('deletes a property from state', () => {
        const store = createMustard<any>({ a: 1, b: 2 });
        delete store.proxy.a;
        expect(store.getState()).toEqual({ b: 2 });
        expect('a' in store.proxy).toBe(false);
    });

    it('records the deletion', () => {
        const store = createMustard<any>({ a: 1 });
        delete store.proxy.a;
        expect(record(store.proxy).size()).toBe(1);
        expect(record(store.proxy).paths()).toEqual(['a']);
    });
});

// ==================== has ====================

describe('has (in operator)', () => {
    it('returns true for existing keys', () => {
        const store = createMustard({ a: 1 });
        expect('a' in store.proxy).toBe(true);
    });

    it('returns false for missing keys', () => {
        const store = createMustard({ a: 1 });
        expect('b' in store.proxy).toBe(false);
    });
});

// ==================== ownKeys ====================

describe('ownKeys', () => {
    it('returns state keys', () => {
        const store = createMustard({ a: 1, b: 2, c: 3 });
        expect(Object.keys(store.proxy)).toEqual(['a', 'b', 'c']);
    });
});

// ==================== Record ====================

describe('record', () => {
    it('tracks changed fields', () => {
        const store = createMustard({ name: 'old', count: 0 });
        const p = store.proxy;
        p.name = 'new';
        expect(record(p).size()).toBe(1);
        expect(record(p).paths()).toEqual(['name']);
        expect(record(p).data()).toEqual({ name: 'new' });
    });

    it('tracks multiple changes', () => {
        const store = createMustard({ name: 'old', count: 0 });
        const p = store.proxy;
        p.name = 'new';
        p.count = 5;
        expect(record(p).size()).toBe(2);
        expect(record(p).paths()).toEqual(['name', 'count']);
        expect(record(p).data()).toEqual({ name: 'new', count: 5 });
    });

    it('data() aggregates same-path changes (keeps latest after)', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 1;
        p.count = 2;
        p.count = 3;
        expect(record(p).size()).toBe(3);
        expect(record(p).data()).toEqual({ count: 3 });
    });

    it('tracks nested changes', () => {
        const store = createMustard({ user: { name: 'a', address: { city: 'Taipei' } } });
        const p = store.proxy;
        p.user.address.city = 'Tokyo';
        expect(record(p).paths()).toEqual(['user.address.city']);
        expect(record(p).data()).toEqual({ user: { address: { city: 'Tokyo' } } });
    });

    it('clear() resets history', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 1;
        p.count = 2;
        record(p).clear();
        expect(record(p).size()).toBe(0);
        expect(record(p).paths()).toEqual([]);
        expect(record(p).data()).toEqual({});
    });
});

// ==================== Undo ====================

describe('undo', () => {
    it('reverts last change', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 1;
        p.count = 2;
        record(p).undo();
        expect(store.getState().count).toBe(1);
        expect(record(p).size()).toBe(1);
    });

    it('undoAll reverts all changes', () => {
        const store = createMustard({ count: 0, name: 'a' });
        const p = store.proxy;
        p.count = 1;
        p.name = 'b';
        p.count = 2;
        record(p).undoAll();
        expect(store.getState()).toEqual({ count: 0, name: 'a' });
        expect(record(p).size()).toBe(0);
    });

    it('undoTo reverts to specific index', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 1; // index 0
        p.count = 2; // index 1
        p.count = 3; // index 2
        record(p).undoTo(1); // keep index 0 only
        expect(store.getState().count).toBe(1);
        expect(record(p).size()).toBe(1);
    });

    it('undo on empty history is a no-op', () => {
        const store = createMustard({ count: 0 });
        const v = store.getVersion();
        record(store.proxy).undo();
        expect(store.getVersion()).toBe(v); // no version bump
    });

    it('undoAll on empty history is a no-op', () => {
        const store = createMustard({ count: 0 });
        const v = store.getVersion();
        record(store.proxy).undoAll();
        expect(store.getVersion()).toBe(v);
    });

    it('undo nested changes', () => {
        const store = createMustard({ user: { name: 'a' } });
        const p = store.proxy;
        p.user.name = 'b';
        p.user.name = 'c';
        record(p).undo();
        expect(store.getState().user.name).toBe('b');
        record(p).undo();
        expect(store.getState().user.name).toBe('a');
    });

    it('timeline branching: new changes after undo start fresh', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 1;
        p.count = 2;
        p.count = 3;
        record(p).undo(); // count → 2
        record(p).undo(); // count → 1
        // Now set a new value — old history entries (2, 3) are gone
        p.count = 99;
        expect(store.getState().count).toBe(99);
        expect(record(p).size()).toBe(2); // [0→1, 1→99]
    });
});

// ==================== Array mutators ====================

describe('array mutators', () => {
    it('push adds items', () => {
        const store = createMustard({ items: [1, 2] });
        store.proxy.items.push(3);
        expect(store.getState().items).toEqual([1, 2, 3]);
    });

    it('pop removes last item', () => {
        const store = createMustard({ items: [1, 2, 3] });
        const popped = store.proxy.items.pop();
        expect(popped).toBe(3);
        expect(store.getState().items).toEqual([1, 2]);
    });

    it('splice removes and inserts', () => {
        const store = createMustard({ items: ['a', 'b', 'c'] });
        store.proxy.items.splice(1, 1, 'x', 'y');
        expect(store.getState().items).toEqual(['a', 'x', 'y', 'c']);
    });

    it('unshift prepends items', () => {
        const store = createMustard({ items: [2, 3] });
        store.proxy.items.unshift(0, 1);
        expect(store.getState().items).toEqual([0, 1, 2, 3]);
    });

    it('shift removes first item', () => {
        const store = createMustard({ items: [1, 2, 3] });
        const shifted = store.proxy.items.shift();
        expect(shifted).toBe(1);
        expect(store.getState().items).toEqual([2, 3]);
    });

    it('reverse reverses in place', () => {
        const store = createMustard({ items: [1, 2, 3] });
        store.proxy.items.reverse();
        expect(store.getState().items).toEqual([3, 2, 1]);
    });

    it('sort sorts in place', () => {
        const store = createMustard({ items: [3, 1, 2] });
        store.proxy.items.sort();
        expect(store.getState().items).toEqual([1, 2, 3]);
    });

    it('push records the mutation', () => {
        const store = createMustard({ items: ['a'] });
        store.proxy.items.push('b');
        expect(record(store.proxy).size()).toBe(1);
        expect(record(store.proxy).paths()).toEqual(['items']);
    });

    it('push with objects deep clones args', () => {
        const obj = { id: 1, label: 'test' };
        const store = createMustard({ items: [] as any[] });
        store.proxy.items.push(obj);
        obj.label = 'mutated';
        expect(store.getState().items[0].label).toBe('test');
    });

    it('array mutator undo restores previous array', () => {
        const store = createMustard({ items: [1, 2] });
        store.proxy.items.push(3);
        record(store.proxy).undo();
        expect(store.getState().items).toEqual([1, 2]);
    });
});

// ==================== Array iterators ====================

describe('array iterators', () => {
    it('forEach iterates proxied items', () => {
        const store = createMustard({ items: [{ selected: false }, { selected: false }] });
        store.proxy.items.forEach((item: any) => {
            item.selected = true;
        });
        expect(store.getState().items[0].selected).toBe(true);
        expect(store.getState().items[1].selected).toBe(true);
    });

    it('map returns mapped values', () => {
        const store = createMustard({ items: [{ id: 1 }, { id: 2 }] });
        const ids = store.proxy.items.map((item: any) => item.id);
        expect(ids).toEqual([1, 2]);
    });

    it('filter returns filtered values', () => {
        const store = createMustard({ items: [1, 2, 3, 4] });
        const even = store.proxy.items.filter((n: number) => n % 2 === 0);
        expect(even).toEqual([2, 4]);
    });

    it('find returns matching item', () => {
        const store = createMustard({ items: [{ id: 1 }, { id: 2 }] });
        const found = store.proxy.items.find((item: any) => item.id === 2);
        expect(found.id).toBe(2);
    });

    it('some/every work correctly', () => {
        const store = createMustard({ items: [1, 2, 3] });
        expect(store.proxy.items.some((n: number) => n > 2)).toBe(true);
        expect(store.proxy.items.every((n: number) => n > 0)).toBe(true);
        expect(store.proxy.items.every((n: number) => n > 1)).toBe(false);
    });

    it('reduce works correctly', () => {
        const store = createMustard({ items: [1, 2, 3] });
        const sum = store.proxy.items.reduce((acc: number, n: number) => acc + n, 0);
        expect(sum).toBe(6);
    });
});

// ==================== Subscribe & batch ====================

describe('subscribe & batch notification', () => {
    it('notifies listeners via microtask', async () => {
        const store = createMustard({ count: 0 });
        const fn = vi.fn();
        store.subscribe(fn);

        store.proxy.count = 1;
        expect(fn).not.toHaveBeenCalled(); // not yet — microtask pending

        await Promise.resolve(); // flush microtask
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('batches multiple synchronous writes into one notification', async () => {
        const store = createMustard({ a: 0, b: 0, c: 0 });
        const fn = vi.fn();
        store.subscribe(fn);

        store.proxy.a = 1;
        store.proxy.b = 2;
        store.proxy.c = 3;

        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('unsubscribe stops notifications', async () => {
        const store = createMustard({ count: 0 });
        const fn = vi.fn();
        const unsub = store.subscribe(fn);

        store.proxy.count = 1;
        unsub();

        await Promise.resolve();
        expect(fn).not.toHaveBeenCalled();
    });
});

// ==================== Edge cases ====================

describe('edge cases', () => {
    it('handles null/undefined property reads', () => {
        const store = createMustard<any>({ a: null });
        expect(store.proxy.a).toBe(null);
    });

    it('object spread works on proxy', () => {
        const store = createMustard({ a: 1, b: 2 });
        const spread = { ...store.proxy };
        expect(spread).toEqual({ a: 1, b: 2 });
    });

    it('writing an object deep clones it (no shared refs)', () => {
        const store = createMustard<any>({ child: null });
        const obj = { x: 1 };
        store.proxy.child = obj;
        obj.x = 999;
        expect(store.getState().child.x).toBe(1);
    });

    it('record data() handles delete (after = undefined)', () => {
        const store = createMustard<any>({ a: 1, b: 2 });
        delete store.proxy.a;
        expect(record(store.proxy).data()).toEqual({ a: undefined });
    });

    it('multiple record operations in sequence', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;

        // Phase 1
        p.count = 1;
        p.count = 2;
        expect(record(p).data()).toEqual({ count: 2 });

        record(p).clear();

        // Phase 2
        p.count = 10;
        expect(record(p).data()).toEqual({ count: 10 });
        expect(record(p).size()).toBe(1);
    });

    it('undo after clear does nothing', () => {
        const store = createMustard({ count: 0 });
        const p = store.proxy;
        p.count = 5;
        record(p).clear();
        record(p).undo(); // no-op
        expect(store.getState().count).toBe(5);
    });
});
