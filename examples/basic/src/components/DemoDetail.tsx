import { CodeBlock } from './CodeBlock'

interface DemoDetailProps {
    title: string
    concept: string
    description: string
    highlights: string[]
    code: string
}

export function DemoDetail({ title, concept, description, highlights, code }: DemoDetailProps) {
    return (
        <div className="demo-detail">
            <h2>{title}</h2>
            <span className="badge" style={{ marginBottom: '1rem', display: 'inline-block' }}>{concept}</span>
            <p className="detail-desc">{description}</p>
            <div className="detail-highlights">
                <h3>Key Points</h3>
                <ul>
                    {highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
            </div>
            <div className="detail-code">
                <h3>Source Code</h3>
                <CodeBlock code={code} />
            </div>
        </div>
    )
}

export const DEMO_DETAILS: Record<string, Omit<DemoDetailProps, 'title'> & { title: string }> = {
    counter: {
        title: 'Counter',
        concept: 'Direct Assignment',
        description: 'The simplest demo — shows that Mustard lets you mutate state directly. No setState, no dispatch, no action creators. Just assign.',
        highlights: [
            'state.count++ triggers re-render automatically',
            'Proxy intercepts the write and notifies subscribers',
            'Structural sharing: only changed paths create new references',
            'Render count badge proves only this component re-renders',
        ],
        code: `import { useMustard } from '@mustrd/react'

export function Counter() {
    const state = useMustard({ count: 0 })

    return (
        <div>
            <span>{state.count}</span>
            <button onClick={() => state.count--}>-</button>
            <button onClick={() => state.count = 0}>Reset</button>
            <button onClick={() => state.count++}>+</button>
        </div>
    )
}`,
    },
    todo: {
        title: 'Todo List',
        concept: 'Array Mutation',
        description: 'Demonstrates that you can use native array methods (push, splice, direct index mutation) on Mustard state — no immutable boilerplate.',
        highlights: [
            'state.todos.push() works — no spread operator needed',
            'state.todos[i].done = true mutates nested items directly',
            'state.todos.splice(i, 1) removes items in-place',
            'All mutations are intercepted by Proxy and trigger correct re-renders',
        ],
        code: `import { useMustard } from '@mustrd/react'

export function TodoList() {
    const state = useMustard({
        todos: [
            { id: 1, text: 'Try Mustard', done: true },
            { id: 2, text: 'Build something cool', done: false },
        ],
        nextId: 3,
    })

    const add = (text: string) => {
        state.todos.push({
            id: state.nextId,
            text,
            done: false,
        })
        state.nextId++
    }

    const toggle = (i: number) => {
        state.todos[i].done = !state.todos[i].done
    }

    const remove = (i: number) => {
        state.todos.splice(i, 1)
    }
}`,
    },
    form: {
        title: 'Form + Record',
        concept: 'Diff Tracking',
        description: 'The killer feature — record() automatically tracks which fields changed. Send only the diff to your API, like a PATCH request that writes itself.',
        highlights: [
            'record(state).data() returns only changed key-value pairs',
            'record(state).paths() lists changed field paths',
            'record(state).size() tells you how many fields changed',
            'record(state).clear() resets the diff after saving',
            'record(state).undoAll() reverts all changes — built-in discard',
        ],
        code: `import { createMustard, useMustard, record } from '@mustrd/react'

const store = createMustard({
    name: 'Wilson',
    email: 'wilson@example.com',
    role: 'engineer',
})

export function FormRecord() {
    const state = useMustard(store)
    const diff = record(state).data()
    const hasChanges = record(state).size() > 0

    const handleSave = () => {
        // diff = { name: 'New Name' }
        // Send only changed fields
        fetch('/api/user', {
            method: 'PATCH',
            body: JSON.stringify(diff),
        })
        record(state).clear()
    }
}`,
    },
    undo: {
        title: 'Undo',
        concept: 'Time Travel',
        description: 'Every mutation is recorded as a snapshot. Step back one at a time, jump to any point, or reset everything — all built into the record system.',
        highlights: [
            'record(state).undo() steps back one change',
            'record(state).undoTo(n) jumps to any snapshot',
            'record(state).undoAll() resets to original state',
            'Timeline branching: making a new change after undo discards the "future"',
            'History dots show the full timeline visually',
        ],
        code: `import { useMustard, record } from '@mustrd/react'

export function UndoDemo() {
    const state = useMustard({
        color: '#e2b714',
        size: 60,
        radius: 8,
    })

    // Each assignment is a recorded snapshot
    state.color = '#e74c3c'
    state.size = 100

    // Step back
    record(state).undo()     // size → 60
    record(state).undo()     // color → '#e2b714'

    // Jump to step 1
    record(state).undoTo(1)

    // Reset everything
    record(state).undoAll()`,
    },
    cascading: {
        title: 'Cascading Select',
        concept: 'Derived State',
        description: 'Shows how dependent state (city depends on country) works naturally with direct assignment — no useEffect chains, no reducers.',
        highlights: [
            'Changing country resets city in the same handler',
            'Cities list is derived directly from state.country',
            'No useEffect for synchronization — just imperative logic',
            'Selected result computed inline, no extra state',
        ],
        code: `import { useMustard } from '@mustrd/react'

const DATA = {
    Taiwan: ['Taipei', 'Kaohsiung', 'Taichung'],
    Japan: ['Tokyo', 'Osaka', 'Kyoto'],
}

export function CascadingSelect() {
    const state = useMustard({
        country: '',
        city: '',
    })

    const cities = state.country
        ? DATA[state.country] ?? []
        : []

    const handleCountry = (val: string) => {
        state.country = val
        state.city = '' // reset in same handler
    }
}`,
    },
    search: {
        title: 'Live Search',
        concept: 'Shared Store',
        description: 'Two components sharing one store — SearchInput writes, ResultList reads. No prop drilling, no context boilerplate. createMustard creates a singleton.',
        highlights: [
            'createMustard() outside components = shared singleton',
            'SearchInput writes state.query — only ResultList re-renders',
            'Auto-tracking: each component subscribes only to fields it reads',
            'Render counter proves surgical re-rendering',
        ],
        code: `import { createMustard, useMustard } from '@mustrd/react'

// Shared store — defined outside components
const searchStore = createMustard({ query: '' })

function SearchInput() {
    const state = useMustard(searchStore)
    return (
        <input
            value={state.query}
            onChange={e => state.query = e.target.value}
        />
    )
}

function ResultList() {
    const state = useMustard(searchStore)
    const filtered = ITEMS.filter(item =>
        item.name.includes(state.query)
    )
    // Only this component re-renders
}`,
    },
    table: {
        title: 'Selectable Table',
        concept: 'forEach Mutation',
        description: 'Select-all in one line with forEach — no map + spread. Mustard intercepts each mutation and batches the re-render.',
        highlights: [
            'state.rows.forEach(row => row.selected = true) — one line select all',
            'Compare: Redux needs map + spread for each row',
            'Row click toggles with direct index mutation',
            'Batch rendering: multiple mutations → single re-render',
        ],
        code: `import { useMustard } from '@mustrd/react'

export function SelectTable() {
    const state = useMustard({ rows: INITIAL_DATA })

    // Select all — one line!
    const toggleAll = (checked: boolean) => {
        state.rows.forEach(row => {
            row.selected = checked
        })
    }

    // Compare with Redux / Zustand:
    // setState(prev => ({
    //     rows: prev.rows.map(r => ({
    //         ...r,
    //         selected: checked
    //     }))
    // }))

    // Delete selected
    const deleteSelected = () => {
        const remaining = state.rows.filter(
            r => !r.selected
        )
        state.reset({ rows: remaining })
    }
}`,
    },
}
