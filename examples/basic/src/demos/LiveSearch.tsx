import { createMustard, useMustard } from '@mustrd/react'
import { useRef } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const ITEMS = [
    { emoji: '🍋', name: 'Lemon', category: 'Fruit' },
    { emoji: '🥑', name: 'Avocado', category: 'Fruit' },
    { emoji: '🍕', name: 'Pizza', category: 'Food' },
    { emoji: '🍔', name: 'Burger', category: 'Food' },
    { emoji: '🍣', name: 'Sushi', category: 'Food' },
    { emoji: '☕', name: 'Coffee', category: 'Drink' },
    { emoji: '🧃', name: 'Juice', category: 'Drink' },
    { emoji: '🍺', name: 'Beer', category: 'Drink' },
]

// Shared store — both components subscribe to the same state
const searchStore = createMustard({ query: '' })

function SearchInput() {
    const state = useMustard(searchStore)
    return (
        <input
            value={state.query}
            onChange={e => state.query = e.target.value}
            placeholder="Search items..."
            style={{ marginBottom: '0.5rem' }}
        />
    )
}

function ResultList() {
    const state = useMustard(searchStore)
    const renders = useRef(0)
    renders.current++

    const q = state.query.toLowerCase()
    const filtered = q
        ? ITEMS.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
        : ITEMS

    return (
        <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {filtered.length} results · renders: {renders.current}
            </div>
            <div className="todo-list">
                {filtered.map(item => (
                    <div key={item.name} className="todo-item">
                        <span style={{ fontSize: '1.1rem', width: 28, flexShrink: 0 }}>{item.emoji}</span>
                        <span>{item.name}</span>
                        <span className="badge">{item.category}</span>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p style={{ opacity: 0.4, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                        No matches
                    </p>
                )}
            </div>
        </div>
    )
}

export function LiveSearch({ mi = 0 }: { mi?: number }) {
    return (
        <div className="demo motion" style={{ '--i': mi } as any}>
            <h2>Live Search</h2>
            <p className="desc">Shared store — two components, one state, zero prop drilling</p>
            <SearchInput />
            <ResultList />
            <CodeBlock code={`// Shared store (outside components)
const store = createMustard({ query: '' })

// Component A writes
state.query = e.target.value

// Component B reads (auto-tracks)
const filtered = ITEMS.filter(...)
// Only ResultList re-renders on query change`} />
        </div>
    )
}
