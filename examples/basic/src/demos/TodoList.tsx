import { useMustard } from '@mustrd/react'
import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'

interface Todo {
    id: number;
    text: string;
    done: boolean;
}

export function TodoList({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    const state = useMustard<{ todos: Todo[], nextId: number }>({
        todos: [
            { id: 1, text: 'Try Mustard', done: true },
            { id: 2, text: 'Build something cool', done: false },
        ],
        nextId: 3,
    })
    const [input, setInput] = useState('')

    const add = () => {
        if (!input.trim()) return
        state.todos.push({ id: state.nextId, text: input.trim(), done: false })
        state.nextId++
        setInput('')
    }

    return (
        <div className="demo motion" style={{ '--i': mi } as any}>
            <h2>Todo List</h2>
            <p className="desc">Array methods — push, splice, direct item mutation</p>
            <div className="row" style={{ marginBottom: '0.75rem' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                    placeholder="Add a todo..."
                />
                <button className="primary" onClick={add}>Add</button>
            </div>
            <div className="todo-list">
                {state.todos.map((todo, i) => (
                    <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
                        <input
                            type="checkbox"
                            checked={todo.done}
                            onChange={() => state.todos[i].done = !state.todos[i].done}
                        />
                        <span>{todo.text}</span>
                        <button
                            className="delete-btn"
                            onClick={() => state.todos.splice(i, 1)}
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {state.todos.length === 0 && (
                    <p style={{ opacity: 0.4, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                        No todos yet
                    </p>
                )}
            </div>
            <CodeBlock code={`// Push, mutate, splice
state.todos.push({ id: 3, text: 'New' })
state.todos[0].done = true
state.todos.splice(i, 1)`} />
            {expand}
        </div>
    )
}
