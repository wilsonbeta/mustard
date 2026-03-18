import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React from 'react';
import {
    useMustard,
    createMustard,
    record,
    unwrap,
    MustardProvider,
    useStore,
    useStores,
    type MustardStore,
} from './index';

afterEach(cleanup);

// ==================== useMustard — inline state ====================

describe('useMustard (inline state)', () => {
    it('renders initial values', () => {
        const App = () => {
            const state = useMustard({ count: 0, name: 'hello' });
            return <div data-testid="out">{state.name}:{state.count}</div>;
        };
        render(<App />);
        expect(screen.getByTestId('out').textContent).toBe('hello:0');
    });

    it('assignment triggers re-render', async () => {
        const App = () => {
            const state = useMustard({ count: 0 });
            return (
                <div>
                    <span data-testid="count">{state.count}</span>
                    <button onClick={() => { state.count++; }}>inc</button>
                </div>
            );
        };
        render(<App />);
        expect(screen.getByTestId('count').textContent).toBe('0');

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(screen.getByTestId('count').textContent).toBe('1');
    });

    it('preserves store across re-renders', async () => {
        let storeRef: any = null;
        const App = () => {
            const state = useMustard({ count: 0 });
            storeRef = (state as any)[Symbol.for('mustard.store')];
            return <button onClick={() => { state.count++; }}>inc</button>;
        };
        render(<App />);
        const first = storeRef;

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(storeRef).toBe(first); // same store instance
    });
});

// ==================== useMustard — external store ====================

describe('useMustard (external store)', () => {
    it('connects to an external store', () => {
        const store = createMustard({ name: 'external' });
        const App = () => {
            const state = useMustard(store);
            return <div data-testid="out">{state.name}</div>;
        };
        render(<App />);
        expect(screen.getByTestId('out').textContent).toBe('external');
    });

    it('multiple components share the same store', async () => {
        const store = createMustard({ count: 0 });

        const Display = () => {
            const state = useMustard(store);
            return <span data-testid="display">{state.count}</span>;
        };
        const Button = () => {
            const state = useMustard(store);
            return <button onClick={() => { state.count++; }}>inc</button>;
        };
        render(<><Display /><Button /></>);

        expect(screen.getByTestId('display').textContent).toBe('0');

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(screen.getByTestId('display').textContent).toBe('1');
    });
});

// ==================== Auto-tracking ====================

describe('auto-tracking', () => {
    it('only re-renders when read fields change', async () => {
        const store = createMustard({ a: 0, b: 0 });
        let renderCount = 0;

        const OnlyReadsA = () => {
            const state = useMustard(store);
            renderCount++;
            return <span data-testid="a">{state.a}</span>;
        };
        render(<OnlyReadsA />);
        renderCount = 0; // reset after initial render

        // Change b — OnlyReadsA should NOT re-render
        await act(async () => {
            store.proxy.b = 99;
            await Promise.resolve();
        });
        expect(renderCount).toBe(0);

        // Change a — OnlyReadsA SHOULD re-render
        await act(async () => {
            store.proxy.a = 1;
            await Promise.resolve();
        });
        expect(renderCount).toBe(1);
        expect(screen.getByTestId('a').textContent).toBe('1');
    });

    it('tracks nested object access and re-renders on deep changes', async () => {
        const store = createMustard({ user: { name: 'a' }, settings: { theme: 'dark' } });
        let renderCount = 0;

        const NameOnly = () => {
            const state = useMustard(store);
            renderCount++;
            return <span data-testid="name">{state.user.name}</span>;
        };
        render(<NameOnly />);
        renderCount = 0;

        // Change settings (sibling, not read) — should NOT re-render
        await act(async () => {
            store.proxy.settings.theme = 'light';
            await Promise.resolve();
        });
        expect(renderCount).toBe(0);

        // Change user.name (read path) — SHOULD re-render
        await act(async () => {
            store.proxy.user.name = 'b';
            await Promise.resolve();
        });
        expect(renderCount).toBe(1);
        expect(screen.getByTestId('name').textContent).toBe('b');
    });
});

// ==================== Batch rendering ====================

describe('batch rendering', () => {
    it('multiple sync writes cause only one re-render', async () => {
        const store = createMustard({ a: 0, b: 0, c: 0 });
        let renderCount = 0;

        const App = () => {
            const state = useMustard(store);
            renderCount++;
            return <div>{state.a},{state.b},{state.c}</div>;
        };
        render(<App />);
        renderCount = 0;

        await act(async () => {
            store.proxy.a = 1;
            store.proxy.b = 2;
            store.proxy.c = 3;
            await Promise.resolve();
        });
        expect(renderCount).toBe(1);
    });
});

// ==================== Array mutators ====================

describe('array mutators via hook', () => {
    it('push triggers re-render', async () => {
        const store = createMustard({ items: ['a'] });
        const App = () => {
            const state = useMustard(store);
            return (
                <div>
                    <span data-testid="len">{state.items.length}</span>
                    <button onClick={() => state.items.push('b')}>add</button>
                </div>
            );
        };
        render(<App />);
        expect(screen.getByTestId('len').textContent).toBe('1');

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(screen.getByTestId('len').textContent).toBe('2');
    });
});

// ==================== Unmount cleanup ====================

describe('unmount cleanup', () => {
    it('unsubscribes on unmount', async () => {
        const store = createMustard({ count: 0 });
        const subscribeSpy = vi.spyOn(store, 'subscribe');

        const App = () => {
            const state = useMustard(store);
            return <span>{state.count}</span>;
        };
        const { unmount } = render(<App />);

        // subscribe was called
        expect(subscribeSpy.mock.calls.length).toBeGreaterThan(0);

        // Get the unsubscribe function returned by subscribe
        const unsubFn = subscribeSpy.mock.results[0].value;
        expect(typeof unsubFn).toBe('function');

        unmount();

        // After unmount, changing state should not cause errors
        await act(async () => {
            store.proxy.count = 99;
            await Promise.resolve();
        });
        // If we get here without error, cleanup worked
    });
});

// ==================== Record & unwrap via hook ====================

describe('record & unwrap via hook', () => {
    it('record API accessible through proxy', async () => {
        const store = createMustard({ count: 0 });
        let recordSize = -1;

        const App = () => {
            const state = useMustard(store);
            return (
                <div>
                    <span data-testid="count">{state.count}</span>
                    <button onClick={() => {
                        state.count = 5;
                    }}>set</button>
                    <button data-testid="check" onClick={() => {
                        recordSize = record(state).size();
                    }}>check</button>
                </div>
            );
        };
        render(<App />);

        await act(async () => {
            screen.getByText('set').click();
            await Promise.resolve();
        });

        screen.getByTestId('check').click();
        expect(recordSize).toBe(1);
    });

    it('$ snapshot returns current raw state', async () => {
        const store = createMustard({ count: 0 });
        let snapshot: any = null;

        const App = () => {
            const state = useMustard(store);
            return (
                <button onClick={() => {
                    snapshot = (state as any).$;
                }}>snap</button>
            );
        };
        render(<App />);

        await act(async () => {
            store.proxy.count = 42;
            await Promise.resolve();
        });

        screen.getByRole('button').click();
        expect(snapshot).toEqual({ count: 42 });
    });

    it('reset replaces state and re-renders', async () => {
        const store = createMustard({ count: 0 });
        const App = () => {
            const state = useMustard(store);
            return (
                <div>
                    <span data-testid="count">{state.count}</span>
                    <button onClick={() => (state as any).reset({ count: 100 })}>reset</button>
                </div>
            );
        };
        render(<App />);
        expect(screen.getByTestId('count').textContent).toBe('0');

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(screen.getByTestId('count').textContent).toBe('100');
    });
});

// ==================== MustardProvider + useStore ====================

describe('MustardProvider + useStore', () => {
    it('useStore(key) accesses store by string key', async () => {
        const counterStore = createMustard({ count: 0 });
        const stores = { counter: counterStore };

        const Counter = () => {
            const state = useStore('counter');
            return (
                <div>
                    <span data-testid="count">{state.count}</span>
                    <button onClick={() => { state.count++; }}>inc</button>
                </div>
            );
        };
        render(
            <MustardProvider store={stores}>
                <Counter />
            </MustardProvider>
        );
        expect(screen.getByTestId('count').textContent).toBe('0');

        await act(async () => {
            screen.getByRole('button').click();
            await Promise.resolve();
        });
        expect(screen.getByTestId('count').textContent).toBe('1');
    });

    it('useStore(fn) accesses store by selector', async () => {
        const userStore = createMustard({ name: 'Wilson' });
        const stores = { user: userStore };

        const Name = () => {
            const state = useStore((s) => s.user);
            return <span data-testid="name">{state.name}</span>;
        };
        render(
            <MustardProvider store={stores}>
                <Name />
            </MustardProvider>
        );
        expect(screen.getByTestId('name').textContent).toBe('Wilson');
    });

    it('useStores returns all stores', () => {
        const storeA = createMustard({ a: 1 });
        const storeB = createMustard({ b: 2 });
        const stores = { a: storeA, b: storeB };

        let received: any = null;
        const App = () => {
            received = useStores();
            return null;
        };
        render(
            <MustardProvider store={stores}>
                <App />
            </MustardProvider>
        );
        expect(received).toBe(stores);
    });

    it('multiple stores update independently', async () => {
        const counterStore = createMustard({ count: 0 });
        const nameStore = createMustard({ name: 'a' });
        const stores = { counter: counterStore, name: nameStore };

        let counterRenders = 0;
        let nameRenders = 0;

        const Counter = () => {
            const state = useStore('counter');
            counterRenders++;
            return <span data-testid="count">{state.count}</span>;
        };
        const Name = () => {
            const state = useStore('name');
            nameRenders++;
            return <span data-testid="name">{state.name}</span>;
        };

        render(
            <MustardProvider store={stores}>
                <Counter />
                <Name />
            </MustardProvider>
        );
        counterRenders = 0;
        nameRenders = 0;

        // Update only counter
        await act(async () => {
            counterStore.proxy.count = 1;
            await Promise.resolve();
        });
        expect(counterRenders).toBe(1);
        expect(nameRenders).toBe(0); // name store untouched
        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByTestId('name').textContent).toBe('a');
    });
});
