import { describe, it, expect } from 'vitest';
import { createForm } from './index';

describe('createForm', () => {
    it('creates form with initial values', () => {
        const form = createForm({
            name: { value: 'Wilson' },
            email: { value: 'w@example.com' },
        });
        expect(form.name).toBe('Wilson');
        expect(form.email).toBe('w@example.com');
    });

    it('supports shorthand (plain values)', () => {
        const form = createForm({
            name: { value: '' },
            count: { value: 0 },
        });
        expect(form.name).toBe('');
        expect(form.count).toBe(0);
    });

    it('direct assignment updates value', () => {
        const form = createForm({
            name: { value: '' },
        });
        form.name = 'Wilson';
        expect(form.name).toBe('Wilson');
    });
});

describe('$dirty', () => {
    it('returns empty object when no changes', () => {
        const form = createForm({
            name: { value: 'Wilson' },
        });
        expect(form.$dirty()).toEqual({});
    });

    it('returns only changed fields', () => {
        const form = createForm({
            name: { value: 'Wilson' },
            email: { value: 'w@example.com' },
            role: { value: 'engineer' },
        });
        form.name = 'Bob';
        expect(form.$dirty()).toEqual({ name: 'Bob' });
    });

    it('tracks multiple changes', () => {
        const form = createForm({
            name: { value: '' },
            email: { value: '' },
        });
        form.name = 'Wilson';
        form.email = 'w@example.com';
        expect(form.$dirty()).toEqual({ name: 'Wilson', email: 'w@example.com' });
    });
});

describe('$dirtyFields', () => {
    it('returns list of changed field names', () => {
        const form = createForm({
            name: { value: '' },
            email: { value: '' },
            role: { value: '' },
        });
        form.name = 'Wilson';
        form.role = 'engineer';
        expect(form.$dirtyFields()).toEqual(['name', 'role']);
    });
});

describe('$isDirty', () => {
    it('returns false when clean', () => {
        const form = createForm({ name: { value: '' } });
        expect(form.$isDirty()).toBe(false);
    });

    it('returns true after change', () => {
        const form = createForm({ name: { value: '' } });
        form.name = 'Wilson';
        expect(form.$isDirty()).toBe(true);
    });
});

describe('$values', () => {
    it('returns all current values', () => {
        const form = createForm({
            name: { value: 'Wilson' },
            email: { value: 'w@example.com' },
        });
        form.name = 'Bob';
        expect(form.$values()).toEqual({ name: 'Bob', email: 'w@example.com' });
    });
});

describe('$validate', () => {
    it('passes when no rules', () => {
        const form = createForm({ name: { value: '' } });
        expect(form.$validate()).toBe(true);
    });

    it('fails required check on empty string', () => {
        const form = createForm({
            name: { value: '', required: true },
        });
        expect(form.$validate()).toBe(false);
    });

    it('passes required check with value', () => {
        const form = createForm({
            name: { value: '', required: true },
        });
        form.name = 'Wilson';
        expect(form.$validate()).toBe(true);
    });

    it('fails custom validation', () => {
        const form = createForm({
            email: { value: 'bad', validate: (v: string) => v.includes('@') || 'Invalid email' },
        });
        expect(form.$validate()).toBe(false);
    });

    it('passes custom validation', () => {
        const form = createForm({
            email: { value: '', validate: (v: string) => v.includes('@') || 'Invalid email' },
        });
        form.email = 'w@example.com';
        expect(form.$validate()).toBe(true);
    });
});

describe('$errors', () => {
    it('returns null when valid', () => {
        const form = createForm({ name: { value: 'Wilson' } });
        expect(form.$errors()).toBeNull();
    });

    it('returns error messages', () => {
        const form = createForm({
            name: { value: '', required: 'Name is required' },
            email: { value: 'bad', validate: (v: string) => v.includes('@') || 'Invalid email' },
        });
        expect(form.$errors()).toEqual({
            name: 'Name is required',
            email: 'Invalid email',
        });
    });
});

describe('$reset', () => {
    it('reverts to initial values', () => {
        const form = createForm({
            name: { value: 'Wilson' },
            email: { value: 'w@example.com' },
        });
        form.name = 'Bob';
        form.email = 'bob@example.com';
        form.$reset();
        expect(form.name).toBe('Wilson');
        expect(form.email).toBe('w@example.com');
        expect(form.$isDirty()).toBe(false);
    });
});

describe('$clear', () => {
    it('clears dirty tracking but keeps values', () => {
        const form = createForm({
            name: { value: '' },
        });
        form.name = 'Wilson';
        expect(form.$isDirty()).toBe(true);
        form.$clear();
        expect(form.$isDirty()).toBe(false);
        expect(form.name).toBe('Wilson');
    });
});

describe('$submit', () => {
    it('calls handler with dirty fields when valid', async () => {
        const form = createForm({
            name: { value: '', required: true },
            email: { value: '' },
        });
        form.name = 'Wilson';
        form.email = 'w@example.com';

        let received: any;
        await form.$submit(async (dirty, values) => {
            received = { dirty, values };
            return { success: true };
        });

        expect(received.dirty).toEqual({ name: 'Wilson', email: 'w@example.com' });
        expect(received.values).toEqual({ name: 'Wilson', email: 'w@example.com' });
        // After submit, dirty should be cleared
        expect(form.$isDirty()).toBe(false);
    });

    it('returns errors when validation fails', async () => {
        const form = createForm({
            name: { value: '', required: true },
        });

        const result = await form.$submit(async () => ({ success: true }));
        expect(result).toEqual({
            success: false,
            errors: { name: 'name is required' },
        });
    });
});
