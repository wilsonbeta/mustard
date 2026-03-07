# Mustard

Proxy-based state management for React.

- **Direct assignment** — no setter functions, just `state.name = 'foo'`
- **Auto-tracking** — only re-renders when accessed properties change
- **Record** — tracks changed fields for partial updates (`PATCH` requests)
- **Undo** — step-by-step state reversal with timeline branching
- **Structural sharing** — efficient immutable updates under the hood
- **Zero dependencies** — React 18+ only

## Install

```bash
npm install @mustrd/react
```

## Quick Start

```tsx
import { useMustard } from '@mustrd/react';

function Counter() {
    const state = useMustard({ count: 0 });
    return <button onClick={() => state.count++}>{state.count}</button>;
}
```

Only components that **read** `count` will re-render when it changes.

## Shared Store

```tsx
import { createMustard, useMustard } from '@mustrd/react';

// Create outside component (shared across components)
const store = createMustard({ name: '', count: 0 });

function Display() {
    const state = useMustard(store);
    return <p>{state.name}: {state.count}</p>;
}

function Controls() {
    const state = useMustard(store);
    return (
        <div>
            <input onChange={e => state.name = e.target.value} />
            <button onClick={() => state.count++}>+</button>
        </div>
    );
}
```

`Display` only re-renders when `name` or `count` changes. If `Controls` only modifies `count`, components that only read `name` won't re-render.

## Record (Diff Tracking)

Track which fields changed — useful for sending only modified fields to the backend.

```tsx
import { useMustard, record } from '@mustrd/react';

function EditForm() {
    const state = useMustard(store);

    const handleSave = () => {
        const diff = record(state).data();
        // { name: 'bar' } — only changed fields, nested
        await fetch('/api/user', {
            method: 'PATCH',
            body: JSON.stringify(diff),
        });
        record(state).clear(); // new baseline
    };

    return (
        <div>
            <input
                value={state.name}
                onChange={e => state.name = e.target.value}
            />
            <button onClick={handleSave}>Save</button>
        </div>
    );
}
```

### Record API

```ts
record(state).data()        // changed fields as nested object
record(state).paths()       // ['name', 'child.count'] — changed paths
record(state).size()        // number of recorded changes
record(state).clear()       // clear history (new baseline after save)
```

## Undo

```tsx
const state = useMustard({ name: 'test', count: 0 });

state.name = 'foo';       // history: [0]
state.count = 1;          // history: [0, 1]
state.count = 2;          // history: [0, 1, 2]

record(state).undo();     // count → 1
record(state).undo();     // count → 0
record(state).undo();     // name → 'test'

// Timeline branching: after undo, new changes start a new timeline
state.count = 99;         // history: [0] ← new branch
```

### Undo API

```ts
record(state).undo()        // revert last change
record(state).undoAll()     // revert all changes
record(state).undoTo(2)     // revert to history index 2 (keeps 0, 1)
```

## Reset

Replace the entire state.

```ts
state.reset({ name: '', count: 0 });
state.reset(() => fetchDefaults()); // also accepts a function
```

## Nested State

```tsx
const state = useMustard({
    user: { name: 'test', address: { city: 'Taipei' } },
    items: [{ id: 1, label: 'A' }],
});

// Direct nested assignment
state.user.address.city = 'Tokyo';

// Array methods
state.items.push({ id: 2, label: 'B' });
state.items[0].label = 'Updated';

// Record tracks precise paths
record(state).data();
// { user: { address: { city: 'Tokyo' } }, items: { 0: { label: 'Updated' } } }

record(state).paths();
// ['user.address.city', 'items.0.label']
```

## Global Store (Provider)

```tsx
import { createMustard, MustardProvider, useStore, useStores } from '@mustrd/react';

const stores = {
    user: createMustard({ name: '', role: 'guest' }),
    ui: createMustard({ theme: 'dark', sidebar: true }),
};

function App() {
    return (
        <MustardProvider store={stores}>
            <Page />
        </MustardProvider>
    );
}

// Access a single store (auto-tracking)
function Header() {
    const user = useStore('user');
    return <span>{user.name}</span>;
}

// Access all stores (no subscription)
function Debug() {
    const all = useStores();
    console.log(all.user.getState());
}
```

## Utilities

```ts
import { unwrap, squeeze } from '@mustrd/react';

// Get raw value from proxy
const raw = unwrap(state);

// Deep clone (strips proxy references)
const copy = squeeze(state.user);

// Get raw snapshot via $
const snapshot = state.$;
```

## Comparison

| Feature | Mustard | Valtio | Zustand |
|---|---|---|---|
| Direct assignment | Yes | Yes | No |
| Auto-tracking | Yes | Yes | No |
| Reset | Yes | No | Yes |
| Record (diff) | Yes | No | No |
| Undo | Yes | Addon | No |
| Structural sharing | Yes | No | No |
| Zero dependencies | Yes | No | Yes |
| Bundle size | ~4 KB | ~6 KB | ~3 KB |

## How It Works

Mustard uses two layers of proxy:

1. **Store proxy** — handles reads/writes with structural sharing (like Redux + Immer, but automatic). Each mutation creates new references only along the changed path.

2. **Auto-tracking proxy** — wraps the store proxy per-component, records which paths are read during render. On state change, only re-renders if a read path's value changed.

Writes are batched via microtask — multiple synchronous assignments trigger only one re-render.

## License

MIT
