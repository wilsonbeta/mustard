import { createForm } from '@mustrd/form'
import { useSyncExternalStore, useState } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const [form, errors, edited] = createForm(
    {
        name: '',
        email: '',
        role: '',
    },
    {
        name: true,
        email: (v: string) => v.includes('@') || 'Invalid email',
        role: true,
    },
)

function useFormSync() {
    useSyncExternalStore(
        form.$store.subscribe,
        () => form.$store.getVersion(),
        () => form.$store.getVersion(),
    )
}

export function BasicForm({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    useFormSync()
    const [saved, setSaved] = useState(false)

    const dirty = form.$dirty()
    const hasChanges = form.$isDirty()

    const handleSave = () => {
        if (!errors.$valid) return
        form.$clear()
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="demo motion" style={{ '--i': mi } as never}>
            <div className="row-between">
                <h2>Three Mirrors</h2>
                <div className="row" style={{ gap: '0.375rem' }}>
                    {!errors.$valid && <span className="badge badge-error">{errors.$all.length} errors</span>}
                    {hasChanges && <span className="badge">{form.$dirtyFields().length} dirty</span>}
                </div>
            </div>
            <p className="desc">
                <code>[form, errors, edited]</code> — same shape, different values at leaves.
                Errors show only after a field is edited.
            </p>
            <div className="stack">
                <div className="form-group">
                    <label>
                        Name
                        {edited.name && <span className="edited-dot" title="edited" />}
                    </label>
                    <input
                        value={form.name}
                        onChange={e => form.name = e.target.value}
                        className={edited.name && errors.name ? 'input-error' : ''}
                        placeholder="Required"
                    />
                    {edited.name && errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                    <label>
                        Email
                        {edited.email && <span className="edited-dot" title="edited" />}
                    </label>
                    <input
                        value={form.email}
                        onChange={e => form.email = e.target.value}
                        className={edited.email && errors.email ? 'input-error' : ''}
                        placeholder="you@company.com"
                    />
                    {edited.email && errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                    <label>
                        Role
                        {edited.role && <span className="edited-dot" title="edited" />}
                    </label>
                    <input
                        value={form.role}
                        onChange={e => form.role = e.target.value}
                        className={edited.role && errors.role ? 'input-error' : ''}
                        placeholder="e.g. Engineer"
                    />
                    {edited.role && errors.role && <span className="field-error">{errors.role}</span>}
                </div>
            </div>
            <div className="row" style={{ marginTop: '0.75rem' }}>
                <button
                    className="primary"
                    onClick={handleSave}
                    disabled={!hasChanges || !errors.$valid}
                    style={{ opacity: hasChanges && errors.$valid ? 1 : 0.4 }}
                >
                    {saved ? 'Saved!' : 'Save'}
                </button>
                {hasChanges && (
                    <button onClick={() => form.$reset()}>Reset</button>
                )}
            </div>
            {hasChanges && (
                <CodeBlock language="json" code={`// form.$dirty()
${JSON.stringify(dirty, null, 2)}

// errors.$valid: ${errors.$valid}`} />
            )}
            {expand}
        </div>
    )
}
