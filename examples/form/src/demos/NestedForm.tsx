import { createForm } from '@mustrd/form'
import { useSyncExternalStore } from 'react'
import { CodeBlock } from '../components/CodeBlock'

const [form, errors, edited] = createForm(
    {
        company: { name: '', taxId: '' },
        members: [
            { name: 'Wilson', email: 'wilson@example.com' },
            { name: '', email: '' },
        ],
    },
    {
        company: {
            name: true,
            taxId: (v: string) => /^\d{8}$/.test(v) || '8-digit tax ID required',
        },
        members: [{
            name: true,
            email: (v: string) => v.includes('@') || 'Invalid email',
        }],
    },
)

function useFormSync() {
    useSyncExternalStore(
        form.$store.subscribe,
        () => form.$store.getVersion(),
        () => form.$store.getVersion(),
    )
}

export function NestedForm({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    useFormSync()

    return (
        <div className="demo motion" style={{ '--i': mi } as never}>
            <div className="row-between">
                <h2>Nested & Arrays</h2>
                {!errors.$valid && <span className="badge badge-error">{errors.$all.length} errors</span>}
            </div>
            <p className="desc">
                Rules mirror data shape — nested objects and <code>[rule]</code> for arrays.
                Each array item validates independently.
            </p>

            <h3 className="section-label">Company</h3>
            <div className="stack">
                <div className="form-group">
                    <label>
                        Name
                        {edited.company.name && <span className="edited-dot" />}
                    </label>
                    <input
                        value={form.company.name}
                        onChange={e => form.company.name = e.target.value}
                        className={edited.company.name && errors.company.name ? 'input-error' : ''}
                        placeholder="Required"
                    />
                    {edited.company.name && errors.company.name && <span className="field-error">{errors.company.name}</span>}
                </div>
                <div className="form-group">
                    <label>
                        Tax ID
                        {edited.company.taxId && <span className="edited-dot" />}
                    </label>
                    <input
                        value={form.company.taxId}
                        onChange={e => form.company.taxId = e.target.value}
                        className={edited.company.taxId && errors.company.taxId ? 'input-error' : ''}
                        placeholder="8 digits"
                    />
                    {edited.company.taxId && errors.company.taxId && <span className="field-error">{errors.company.taxId}</span>}
                </div>
            </div>

            <h3 className="section-label">Members</h3>
            {form.members.map((_: unknown, i: number) => (
                <div className="stack friend-row" key={i}>
                    <span className="friend-index">#{i + 1}</span>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            value={form.members[i].name}
                            onChange={e => form.members[i].name = e.target.value}
                            className={edited.members[i].name && errors.members[i].name ? 'input-error' : ''}
                            placeholder="Full name"
                        />
                        {edited.members[i].name && errors.members[i].name && <span className="field-error">{errors.members[i].name}</span>}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            value={form.members[i].email}
                            onChange={e => form.members[i].email = e.target.value}
                            className={edited.members[i].email && errors.members[i].email ? 'input-error' : ''}
                            placeholder="name@company.com"
                        />
                        {edited.members[i].email && errors.members[i].email && <span className="field-error">{errors.members[i].email}</span>}
                    </div>
                </div>
            ))}

            {form.$isDirty() && (
                <CodeBlock language="json" code={`// form.$dirty({ depth: 1 })
${JSON.stringify(form.$dirty({ depth: 1 }), null, 2)}`} />
            )}
            {expand}
        </div>
    )
}
