import { CodeBlock } from '../components/CodeBlock'

export function GetStartedPage() {
    return (
        <>
            <div className="page-header motion" style={{ '--i': 0 } as any}>
                <h1>Get <span className="accent">Started</span></h1>
                <p>Up and running in under a minute</p>
            </div>

            <section className="doc-section motion" style={{ '--i': 1 } as any}>
                <h2>Install</h2>
                <div className="install-block">
                    <span className="prompt">$</span>
                    npm install @mustrd/react
                </div>
            </section>

            <section className="doc-section motion" style={{ '--i': 2 } as any}>
                <h2>Quick Example</h2>
                <p>No boilerplate, no actions, no reducers. Just assign values like normal JavaScript.</p>
                <CodeBlock code={`import { useMustard } from '@mustrd/react'

function Counter() {
    const state = useMustard({ count: 0 })

    return (
        <button onClick={() => state.count++}>
            {state.count}
        </button>
    )
}`} />
            </section>

            <section className="doc-section motion" style={{ '--i': 3 } as any}>
                <h2>Shared Store</h2>
                <p>Create a store outside the component to share state across your app.</p>
                <CodeBlock code={`import { createMustard, useMustard } from '@mustrd/react'

// Shared store — lives outside React
const store = createMustard({ user: '', count: 0 })

function Display() {
    const state = useMustard(store)
    return <p>{state.user}: {state.count}</p>
}

function Controls() {
    const state = useMustard(store)
    return <button onClick={() => state.count++}>+</button>
}

// Only Display re-renders when count changes
// Components that don't read count are unaffected`} />
            </section>

            <section className="doc-section motion" style={{ '--i': 4 } as any}>
                <h2>Record (Diff Tracking)</h2>
                <p>Track which fields changed — perfect for PATCH requests that only send modified data.</p>
                <CodeBlock code={`import { useMustard, record } from '@mustrd/react'

const store = createMustard({
    name: 'Wilson',
    email: 'wilson@example.com',
    role: 'engineer',
})

function EditForm() {
    const state = useMustard(store)

    const handleSave = async () => {
        const diff = record(state).data()
        // diff = { name: 'New Name' } — only changed fields

        await fetch('/api/user', {
            method: 'PATCH',
            body: JSON.stringify(diff),
        })

        record(state).clear() // new baseline
    }
}`} />
            </section>

            <section className="doc-section motion" style={{ '--i': 5 } as any}>
                <h2>Undo</h2>
                <p>Every change is recorded. Step back through history or jump to any point.</p>
                <CodeBlock code={`import { useMustard, record } from '@mustrd/react'

const state = useMustard({ color: '#e2b714', size: 60 })

state.color = '#e74c3c'  // history: [0]
state.size = 100          // history: [0, 1]

record(state).undo()      // size → 60
record(state).undo()      // color → '#e2b714'

// After undo, new changes start a new timeline
state.size = 80           // history: [0] ← fresh branch`} />
            </section>

            <section className="doc-section motion" style={{ '--i': 6 } as any}>
                <h2>Why Mustard?</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <div className="feature-title">Direct Assignment</div>
                        <div className="feature-desc">
                            No setState, no dispatch, no actions. Just state.value = newValue.
                        </div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-title">Auto-Tracking</div>
                        <div className="feature-desc">
                            Only re-renders when properties you actually read have changed.
                        </div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-title">Record & Undo</div>
                        <div className="feature-desc">
                            Built-in diff tracking and time travel. No addon needed.
                        </div>
                    </div>
                    <div className="feature-card">
                        <div className="feature-title">Zero Dependencies</div>
                        <div className="feature-desc">
                            Only React 18+. No proxy-compare, no immer, no middleware.
                        </div>
                    </div>
                </div>
            </section>

            <section className="doc-section motion" style={{ '--i': 7 } as any}>
                <h2>Comparison</h2>
                <CodeBlock code={`// Mustard — just JavaScript
state.rows.forEach(row => row.selected = true)

// Redux
dispatch(setRows(rows.map(r => ({ ...r, selected: true }))))

// Zustand
set(prev => ({
    rows: prev.rows.map(r => ({ ...r, selected: true }))
}))`} />
            </section>
        </>
    )
}
