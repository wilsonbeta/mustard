import { describe, it, expect } from 'vitest';
import { createForm } from './index';

// ==================== createForm basics ====================

describe('createForm', () => {
    it('returns [form, errors, edited] tuple', () => {
        const result = createForm({ name: '' });
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);
    });

    it('form reads initial values', () => {
        const [form] = createForm({
            name: 'Wilson',
            email: 'w@example.com',
            age: 30,
        });
        expect(form.name).toBe('Wilson');
        expect(form.email).toBe('w@example.com');
        expect(form.age).toBe(30);
    });

    it('form accepts nested objects and arrays', () => {
        const [form] = createForm({
            addr: { city: 'Taipei', zip: '12345' },
            friends: [{ name: 'John' }, { name: 'Jane' }],
        });
        expect(form.addr.city).toBe('Taipei');
        expect(form.friends[0].name).toBe('John');
        expect(form.friends[1].name).toBe('Jane');
    });

    it('direct assignment updates value', () => {
        const [form] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(form.name).toBe('Wilson');
    });

    it('nested assignment updates value', () => {
        const [form] = createForm({ addr: { city: '' } });
        form.addr.city = 'Taipei';
        expect(form.addr.city).toBe('Taipei');
    });

    it('array item assignment updates value', () => {
        const [form] = createForm({ friends: [{ name: 'John' }] });
        form.friends[0].name = 'Bob';
        expect(form.friends[0].name).toBe('Bob');
    });
});

// ==================== $dirty ====================

describe('$dirty', () => {
    it('returns empty object when no changes', () => {
        const [form] = createForm({ name: 'Wilson' });
        expect(form.$dirty()).toEqual({});
    });

    it('returns only changed fields', () => {
        const [form] = createForm({ name: 'Wilson', email: 'w@example.com' });
        form.name = 'Bob';
        expect(form.$dirty()).toEqual({ name: 'Bob' });
    });

    it('tracks multiple changes', () => {
        const [form] = createForm({ name: '', email: '' });
        form.name = 'Wilson';
        form.email = 'w@example.com';
        expect(form.$dirty()).toEqual({ name: 'Wilson', email: 'w@example.com' });
    });

    it('depth:1 lifts nested changes to first-level key with complete value', () => {
        const [form] = createForm({
            name: 'Wilson',
            friends: [
                { name: 'John', age: 20 },
                { name: 'Jane', age: 21 },
            ],
        });
        form.friends[1].name = 'Bob';
        const dirty = form.$dirty({ depth: 1 });
        // Should include the entire friends array, not just the diff
        expect(dirty.friends).toEqual([
            { name: 'John', age: 20 },
            { name: 'Bob', age: 21 },
        ]);
        // Should not include unchanged top-level keys
        expect(dirty.name).toBeUndefined();
    });
});

// ==================== $dirtyFields / $isDirty ====================

describe('$dirtyFields', () => {
    it('returns list of changed field paths', () => {
        const [form] = createForm({ name: '', email: '', role: '' });
        form.name = 'Wilson';
        form.role = 'engineer';
        expect(form.$dirtyFields()).toEqual(['name', 'role']);
    });
});

describe('$isDirty', () => {
    it('returns false when clean', () => {
        const [form] = createForm({ name: '' });
        expect(form.$isDirty()).toBe(false);
    });

    it('returns true after change', () => {
        const [form] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(form.$isDirty()).toBe(true);
    });
});

// ==================== $values ====================

describe('$values', () => {
    it('returns all current values', () => {
        const [form] = createForm({ name: 'Wilson', email: 'w@example.com' });
        form.name = 'Bob';
        expect(form.$values()).toEqual({ name: 'Bob', email: 'w@example.com' });
    });
});

// ==================== $reset ====================

describe('$reset', () => {
    it('reverts to initial values and clears dirty', () => {
        const [form] = createForm({ name: 'Wilson', email: 'w@example.com' });
        form.name = 'Bob';
        form.email = 'bob@example.com';
        form.$reset();
        expect(form.name).toBe('Wilson');
        expect(form.email).toBe('w@example.com');
        expect(form.$isDirty()).toBe(false);
    });

    it('clears edited state', () => {
        const [form, , edited] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(edited.name).toBe(true);
        form.$reset();
        expect(edited.name).toBe(false);
    });
});

// ==================== $clear ====================

describe('$clear', () => {
    it('clears dirty tracking but keeps values', () => {
        const [form] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(form.$isDirty()).toBe(true);
        form.$clear();
        expect(form.$isDirty()).toBe(false);
        expect(form.name).toBe('Wilson');
    });

    it('clears edited state', () => {
        const [form, , edited] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(edited.name).toBe(true);
        form.$clear();
        expect(edited.name).toBe(false);
    });
});

// ==================== Errors — flat fields ====================

describe('errors (flat)', () => {
    it('returns null for valid field', () => {
        const [form, errors] = createForm(
            { name: 'Wilson' },
            { name: true },
        );
        expect(errors.name).toBeNull();
    });

    it('returns error message for required empty field', () => {
        const [, errors] = createForm(
            { name: '' },
            { name: true },
        );
        expect(errors.name).toBe('name is required');
    });

    it('returns custom error message from validate function', () => {
        const [, errors] = createForm(
            { email: 'bad' },
            { email: (v: string) => v.includes('@') || 'Invalid email' },
        );
        expect(errors.email).toBe('Invalid email');
    });

    it('returns null when validate passes', () => {
        const [, errors] = createForm(
            { email: 'w@example.com' },
            { email: (v: string) => v.includes('@') || 'Invalid email' },
        );
        expect(errors.email).toBeNull();
    });

    it('errors update reactively after value change', () => {
        const [form, errors] = createForm(
            { name: '' },
            { name: true },
        );
        expect(errors.name).toBe('name is required');
        form.name = 'Wilson';
        expect(errors.name).toBeNull();
    });

    it('field without rule has no error', () => {
        const [, errors] = createForm(
            { name: '', role: '' },
            { name: true },
        );
        expect(errors.role).toBeNull();
    });
});

// ==================== Errors — nested objects ====================

describe('errors (nested)', () => {
    it('validates nested object fields', () => {
        const [, errors] = createForm(
            { addr: { city: '', zip: '123' } },
            { addr: { city: true, zip: (v: string) => /^\d{5}$/.test(v) || 'Invalid zip' } },
        );
        expect(errors.addr.city).toBe('city is required');
        expect(errors.addr.zip).toBe('Invalid zip');
    });

    it('nested errors update after change', () => {
        const [form, errors] = createForm(
            { addr: { city: '' } },
            { addr: { city: true } },
        );
        expect(errors.addr.city).toBe('city is required');
        form.addr.city = 'Taipei';
        expect(errors.addr.city).toBeNull();
    });
});

// ==================== Errors — arrays ====================

describe('errors (arrays)', () => {
    it('validates each array item with object rule', () => {
        const [, errors] = createForm(
            { friends: [{ name: 'John', age: -1 }, { name: '', age: 25 }] },
            { friends: [{ name: true, age: (v: number) => v > 0 || 'Invalid age' }] },
        );
        expect(errors.friends[0].name).toBeNull();
        expect(errors.friends[0].age).toBe('Invalid age');
        expect(errors.friends[1].name).toBe('name is required');
        expect(errors.friends[1].age).toBeNull();
    });

    it('validates array of primitives with function rule', () => {
        const [, errors] = createForm(
            { devices: ['iPhone', 'Unknown'] },
            { devices: [(v: string) => ['iPhone', 'MacBook', 'iPad'].includes(v) || 'Invalid device'] },
        );
        expect(errors.devices[0]).toBeNull();
        expect(errors.devices[1]).toBe('Invalid device');
    });

    it('array errors update after item change', () => {
        const [form, errors] = createForm(
            { friends: [{ name: '' }] },
            { friends: [{ name: true }] },
        );
        expect(errors.friends[0].name).toBe('name is required');
        form.friends[0].name = 'John';
        expect(errors.friends[0].name).toBeNull();
    });
});

// ==================== Errors — $valid, $all, $first ====================

describe('errors.$valid / $all / $first', () => {
    it('$valid returns true when no errors', () => {
        const [, errors] = createForm(
            { name: 'Wilson' },
            { name: true },
        );
        expect(errors.$valid).toBe(true);
    });

    it('$valid returns false when has errors', () => {
        const [, errors] = createForm(
            { name: '' },
            { name: true },
        );
        expect(errors.$valid).toBe(false);
    });

    it('$all returns all error entries', () => {
        const [, errors] = createForm(
            { name: '', email: 'bad' },
            { name: true, email: (v: string) => v.includes('@') || 'Invalid email' },
        );
        expect(errors.$all).toEqual([
            { path: 'name', message: 'name is required' },
            { path: 'email', message: 'Invalid email' },
        ]);
    });

    it('$all returns empty array when valid', () => {
        const [, errors] = createForm(
            { name: 'Wilson' },
            { name: true },
        );
        expect(errors.$all).toEqual([]);
    });

    it('$first returns first error', () => {
        const [, errors] = createForm(
            { name: '', email: 'bad' },
            { name: true, email: (v: string) => v.includes('@') || 'Invalid email' },
        );
        expect(errors.$first).toEqual({ path: 'name', message: 'name is required' });
    });

    it('$first returns null when valid', () => {
        const [, errors] = createForm(
            { name: 'Wilson' },
            { name: true },
        );
        expect(errors.$first).toBeNull();
    });

    it('$valid updates reactively', () => {
        const [form, errors] = createForm(
            { name: '' },
            { name: true },
        );
        expect(errors.$valid).toBe(false);
        form.name = 'Wilson';
        expect(errors.$valid).toBe(true);
    });
});

// ==================== Edited ====================

describe('edited', () => {
    it('returns false for untouched field', () => {
        const [, , edited] = createForm({ name: '', email: '' });
        expect(edited.name).toBe(false);
        expect(edited.email).toBe(false);
    });

    it('returns true after field is written', () => {
        const [form, , edited] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(edited.name).toBe(true);
    });

    it('tracks nested field edits', () => {
        const [form, , edited] = createForm({ addr: { city: '', zip: '' } });
        form.addr.city = 'Taipei';
        expect(edited.addr.city).toBe(true);
        expect(edited.addr.zip).toBe(false);
    });

    it('tracks array item edits', () => {
        const [form, , edited] = createForm({
            friends: [{ name: 'John' }, { name: 'Jane' }],
        });
        form.friends[1].name = 'Bob';
        expect(edited.friends[0].name).toBe(false);
        expect(edited.friends[1].name).toBe(true);
    });

    it('reset clears edited', () => {
        const [form, , edited] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(edited.name).toBe(true);
        form.$reset();
        expect(edited.name).toBe(false);
    });

    it('clear clears edited', () => {
        const [form, , edited] = createForm({ name: '' });
        form.name = 'Wilson';
        expect(edited.name).toBe(true);
        form.$clear();
        expect(edited.name).toBe(false);
    });
});

// ==================== No rules ====================

describe('no rules', () => {
    it('works without rules — errors always valid', () => {
        const [form, errors] = createForm({ name: '', email: '' });
        expect(errors.$valid).toBe(true);
        expect(errors.$all).toEqual([]);
        expect(errors.name).toBeNull();
        form.name = 'Wilson';
        expect(errors.$valid).toBe(true);
    });
});

// ==================== Validate function receives allValues ====================

describe('cross-field validation', () => {
    it('validate function receives all values as second argument', () => {
        const [form, errors] = createForm(
            { password: '123', confirm: '' },
            { confirm: (v: string, all: any) => v === all.password || 'Passwords must match' },
        );
        form.confirm = '456';
        expect(errors.confirm).toBe('Passwords must match');
        form.confirm = '123';
        expect(errors.confirm).toBeNull();
    });
});
