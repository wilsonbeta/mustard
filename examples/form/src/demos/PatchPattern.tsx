import { createForm } from '@mustrd/form'
import { useSyncExternalStore, useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const [form, errors] = createForm(
    {
        name: 'Wilson',
        email: 'wilson@example.com',
        bio: 'Full-stack developer',
    },
    {
        name: true,
        email: (v: string) => v.includes('@') || 'Invalid email',
    },
)

function useFormSync() {
    useSyncExternalStore(
        form.$store.subscribe,
        () => form.$store.getVersion(),
        () => form.$store.getVersion(),
    )
}

export function PatchPattern({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    useFormSync()
    const [log, setLog] = useState<string[]>([])

    const dirty = form.$dirty()
    const hasChanges = form.$isDirty()

    const handleSave = () => {
        if (!errors.$valid) return
        const patch = form.$dirty()
        setLog(prev => [
            `PATCH /api/user  ${JSON.stringify(patch)}`,
            ...prev.slice(0, 4),
        ])
        form.$clear()
    }

    return (
        <div className="demo motion" style={{ '--i': mi } as never}>
            <div className="row-between">
                <h2>PATCH Pattern</h2>
                {hasChanges && <span className="badge">{form.$dirtyFields().length} changed</span>}
            </div>
            <p className="desc">
                <code>form.$dirty()</code> returns only changed fields — perfect for PATCH requests.
                <code>$clear()</code> sets a new baseline after save.
            </p>
            <div className="stack">
                <div className="form-group">
                    <label>Name</label>
                    <input
                        value={form.name}
                        onChange={e => form.name = e.target.value}
                        placeholder="Full name"
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        value={form.email}
                        onChange={e => form.email = e.target.value}
                        placeholder="you@company.com"
                    />
                </div>
                <div className="form-group">
                    <label>Bio</label>
                    <input
                        value={form.bio}
                        onChange={e => form.bio = e.target.value}
                        placeholder="A short introduction"
                    />
                </div>
            </div>
            <div className="row" style={{ marginTop: '0.75rem' }}>
                <button
                    className="primary"
                    onClick={handleSave}
                    disabled={!hasChanges || !errors.$valid}
                    style={{ opacity: hasChanges && errors.$valid ? 1 : 0.4 }}
                >
                    Save (PATCH)
                </button>
                {hasChanges && (
                    <button onClick={() => form.$reset()}>Discard</button>
                )}
            </div>
            {hasChanges && (
                <CodeBlock language="json" code={`// Only changed fields
${JSON.stringify(dirty, null, 2)}

// Changed paths: ${JSON.stringify(form.$dirtyFields())}`} />
            )}
            {log.length > 0 && (
                <div className="request-log">
                    <h3 className="section-label">Request Log</h3>
                    {log.map((entry, i) => (
                        <div key={i} className="log-entry">{entry}</div>
                    ))}
                </div>
            )}
            {expand}
        </div>
    )
}
