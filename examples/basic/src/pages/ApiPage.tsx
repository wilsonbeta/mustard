import { CodeBlock } from '../components/CodeBlock'

export function ApiPage() {
    return (
        <>
            <div className="page-header motion" style={{ '--i': 0 } as any}>
                <h1><span className="accent">API</span> Reference</h1>
                <p>Complete API documentation for @mustrd/react</p>
            </div>

            {/* ---- Core ---- */}
            <section className="doc-section motion" style={{ '--i': 1 } as any}>
                <h2>Core</h2>

                <h3>createMustard(initialState)</h3>
                <p>Create a shared store that lives outside React. Returns a <code>MustardStore</code> object.</p>
                <CodeBlock code={`import { createMustard } from '@mustrd/react'

const store = createMustard({ count: 0, name: '' })

// store.getState()   → current plain state
// store.getVersion() → version number (increments on mutation)
// store.subscribe(fn) → returns unsubscribe function
// store.proxy        → the reactive proxy`} />

                <h3>useMustard(input)</h3>
                <p>
                    Hook that returns a reactive proxy. Accepts either an initial state object
                    (inline store, scoped to the component) or a <code>MustardStore</code> (shared store).
                </p>
                <CodeBlock code={`import { useMustard } from '@mustrd/react'

// Inline store (component-scoped)
const state = useMustard({ count: 0 })

// Shared store
const state = useMustard(store)

// Direct assignment triggers re-render
state.count++
state.name = 'hello'`} />
            </section>

            {/* ---- Record ---- */}
            <section className="doc-section motion" style={{ '--i': 2 } as any}>
                <h2>Record</h2>

                <h3>record(state)</h3>
                <p>Access the record API for a proxy. Returns a <code>RecordApi</code> object.</p>

                <div className="api-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Returns</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>data()</code></td>
                                <td><code>object</code></td>
                                <td>Changed fields as a nested object. For same-path changes, keeps the latest value.</td>
                            </tr>
                            <tr>
                                <td><code>paths()</code></td>
                                <td><code>string[]</code></td>
                                <td>List of changed paths in dot notation. e.g. <code>['user.name', 'count']</code></td>
                            </tr>
                            <tr>
                                <td><code>size()</code></td>
                                <td><code>number</code></td>
                                <td>Number of recorded changes in history.</td>
                            </tr>
                            <tr>
                                <td><code>clear()</code></td>
                                <td><code>void</code></td>
                                <td>Clear all records. Use after saving to set a new baseline.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <CodeBlock code={`import { record } from '@mustrd/react'

state.name = 'new'
state.count = 5

record(state).data()   // { name: 'new', count: 5 }
record(state).paths()  // ['name', 'count']
record(state).size()   // 2
record(state).clear()  // reset — new baseline`} />
            </section>

            {/* ---- Undo ---- */}
            <section className="doc-section motion" style={{ '--i': 3 } as any}>
                <h2>Undo</h2>
                <p>Every mutation is recorded with before/after values. Undo methods are on the same <code>record(state)</code> API.</p>

                <div className="api-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>undo()</code></td>
                                <td>Revert the last change. No-op if history is empty.</td>
                            </tr>
                            <tr>
                                <td><code>undoAll()</code></td>
                                <td>Revert all changes back to the initial / cleared state.</td>
                            </tr>
                            <tr>
                                <td><code>undoTo(index)</code></td>
                                <td>Revert to a specific history index (exclusive — keeps entries 0 to index-1).</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <CodeBlock code={`state.count = 1  // history[0]
state.count = 2  // history[1]
state.count = 3  // history[2]

record(state).undo()     // count → 2
record(state).undoTo(1)  // count → 1
record(state).undoAll()  // count → 0 (initial)

// Timeline branching
state.count = 99  // new branch, old future is discarded`} />
            </section>

            {/* ---- Utilities ---- */}
            <section className="doc-section motion" style={{ '--i': 4 } as any}>
                <h2>Utilities</h2>

                <h3>unwrap(proxy)</h3>
                <p>Get the raw plain object from a proxy. Useful for passing to external libraries or <code>useEffect</code> dependencies.</p>
                <CodeBlock code={`import { unwrap } from '@mustrd/react'

const raw = unwrap(state)       // plain object, not a proxy
const raw = unwrap(state.user)  // works on nested proxies too`} />

                <h3>squeeze(obj)</h3>
                <p>Deep clone that strips all proxy references. Returns a plain JavaScript object.</p>
                <CodeBlock code={`import { squeeze } from '@mustrd/react'

const copy = squeeze(state.user)  // deep clone, no proxy
JSON.stringify(copy)              // safe to serialize`} />

                <h3>state.$</h3>
                <p>Shorthand to get the current raw state snapshot (same as <code>unwrap(state)</code>).</p>
                <CodeBlock code={`const snapshot = state.$
console.log(snapshot)  // { count: 1, name: 'hello' }`} />

                <h3>state.reset(data)</h3>
                <p>Replace the entire state. Accepts an object or a function that returns an object.</p>
                <CodeBlock code={`state.reset({ count: 0, name: '' })
state.reset(() => fetchDefaults())  // async-friendly`} />
            </section>

            {/* ---- Provider ---- */}
            <section className="doc-section motion" style={{ '--i': 5 } as any}>
                <h2>Provider</h2>

                <h3>MustardProvider</h3>
                <p>Context provider for multiple named stores. Enables <code>useStore</code> and <code>useStores</code> hooks.</p>
                <CodeBlock code={`import {
    createMustard,
    MustardProvider,
    useStore,
    useStores,
} from '@mustrd/react'

const stores = {
    user: createMustard({ name: '', role: 'guest' }),
    ui: createMustard({ theme: 'dark', sidebar: true }),
}

function App() {
    return (
        <MustardProvider store={stores}>
            <Page />
        </MustardProvider>
    )
}`} />

                <h3>useStore(key)</h3>
                <p>Get a single store from context with auto-tracking. Accepts a string key or selector function.</p>
                <CodeBlock code={`const user = useStore('user')
user.name = 'Wilson'  // reactive

// Or with a selector
const ui = useStore(stores => stores.ui)`} />

                <h3>useStores()</h3>
                <p>Get all stores from context (no subscription — for debugging or one-off reads).</p>
                <CodeBlock code={`const all = useStores()
console.log(all.user.getState())`} />
            </section>

            {/* ---- TypeScript ---- */}
            <section className="doc-section motion" style={{ '--i': 6 } as any}>
                <h2>TypeScript</h2>
                <p>Full type inference from initial state. Explicit generics available when needed.</p>
                <CodeBlock code={`// Inferred automatically
const state = useMustard({ count: 0, name: '' })
state.count  // number
state.name   // string

// Explicit type
interface User { name: string; role: 'admin' | 'user' }
const store = createMustard<User>({ name: '', role: 'user' })

// Record API is fully typed
import type { RecordApi, MustardStore } from '@mustrd/react'`} />
            </section>
        </>
    )
}
