import { createMustard, useMustard, record } from '@mustrd/react'
import { useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const store = createMustard({
    name: 'Wilson',
    email: 'wilson@example.com',
    role: 'engineer',
})

export function FormRecord({ mi = 0 }: { mi?: number }) {
    const state = useMustard(store)
    const [saved, setSaved] = useState(false)

    const diff = record(state).data()
    const paths = record(state).paths()
    const hasChanges = record(state).size() > 0

    const handleSave = () => {
        record(state).clear()
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="demo motion" style={{ '--i': mi } as any}>
            <div className="row-between">
                <h2>Form + Record</h2>
                {hasChanges && <span className="badge">{record(state).size()} changes</span>}
            </div>
            <p className="desc">Track changed fields — send only the diff to your API</p>
            <div className="stack" style={{ marginBottom: '0.75rem' }}>
                <div className="form-group">
                    <label>Name</label>
                    <input value={state.name} onChange={e => state.name = e.target.value} />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input value={state.email} onChange={e => state.email = e.target.value} />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <input value={state.role} onChange={e => state.role = e.target.value} />
                </div>
            </div>
            <div className="row">
                <button
                    className="primary"
                    onClick={handleSave}
                    disabled={!hasChanges}
                    style={{ opacity: hasChanges ? 1 : 0.4 }}
                >
                    {saved ? 'Saved!' : 'Save (PATCH)'}
                </button>
                {hasChanges && (
                    <button onClick={() => { record(state).undoAll(); }}>
                        Discard
                    </button>
                )}
            </div>
            {hasChanges && (
                <CodeBlock language="json" code={`// PATCH body (only changed fields)
${JSON.stringify(diff, null, 2)}

// paths: ${JSON.stringify(paths)}`} />
            )}
        </div>
    )
}
