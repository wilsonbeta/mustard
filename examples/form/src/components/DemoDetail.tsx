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

export const DEMO_DETAILS: Record<string, DemoDetailProps> = {
    basic: {
        title: 'Three Mirrors',
        concept: 'form + errors + edited',
        description: 'createForm returns three proxies with the same data shape. form reads/writes values, errors returns validation messages at each leaf, edited tracks which fields were touched.',
        highlights: [
            'const [form, errors, edited] = createForm(data, rules)',
            'form.name = "Wilson" — direct assignment, no setState',
            'errors.name returns string (error) or null — same path as form.name',
            'edited.name returns boolean — true after any write to that field',
            'Errors show only after edited — no annoying flash on first render',
            'form.$dirty() returns only changed fields for PATCH requests',
        ],
        code: `import { createForm } from '@mustrd/form'

const [form, errors, edited] = createForm(
    { name: '', email: '', role: 'engineer' },
    {
        name: true,  // required
        email: v => v.includes('@') || 'Invalid email',
        role: true,
    },
)

// Direct assignment
form.name = 'Wilson'

// Three mirrors — same shape, different return types
form.name        // 'Wilson'       (value)
errors.name      // null           (no error — field is filled)
edited.name      // true           (was written to)

// Submit pattern
if (errors.$valid) {
    await save(form.$dirty())
    form.$clear()
}`,
    },
    nested: {
        title: 'Nested & Arrays',
        concept: 'Same-shape Rules',
        description: 'Validation rules mirror the exact data structure. Nested objects nest rules. Arrays use [rule] — one rule applied to every item. Each array item validates independently.',
        highlights: [
            'Rules mirror data: { company: { name: true } } validates form.company.name',
            'Array rule [{ name: true }] validates every item in members[]',
            'errors.members[1].email returns that specific item\'s error',
            'edited.company.taxId tracks nested field independently',
            '$dirty({ depth: 1 }) lifts nested changes to first-level keys',
            'Supports unlimited nesting depth',
        ],
        code: `import { createForm } from '@mustrd/form'

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
            taxId: v => /^\\d{8}$/.test(v) || '8-digit tax ID required',
        },
        members: [{
            name: true,
            email: v => v.includes('@') || 'Invalid email',
        }],
    },
)

// Nested access — same path everywhere
form.company.name           // ''
errors.company.name         // 'name is required'
edited.company.name         // false

// Array items
form.members[1].email       // ''
errors.members[1].email     // 'Invalid email'

// Depth-1 dirty for batch updates
form.company.name = 'Acme Inc.'
form.$dirty({ depth: 1 })
// { company: { name: 'Acme Inc.', taxId: '' } }`,
    },
    patch: {
        title: 'PATCH Pattern',
        concept: 'Dirty Tracking',
        description: 'form.$dirty() returns only the fields that changed — perfect for PATCH requests. $clear() sets a new baseline after saving, so the next $dirty() starts fresh.',
        highlights: [
            '$dirty() returns only changed key-value pairs',
            '$dirtyFields() lists changed field paths as strings',
            '$isDirty() returns boolean — quick check for unsaved changes',
            '$clear() resets tracking (keeps current values as new baseline)',
            '$reset() reverts to initial values and clears all tracking',
            'Combined with errors.$valid for safe submit',
        ],
        code: `import { createForm } from '@mustrd/form'

const [form, errors] = createForm(
    { name: 'Wilson', email: 'wilson@example.com', bio: '' },
    { name: true, email: v => v.includes('@') || 'Invalid email' },
)

form.name = 'Bob'
form.bio = 'Developer'

form.$dirty()
// { name: 'Bob', bio: 'Developer' }

form.$dirtyFields()
// ['name', 'bio']

form.$isDirty()  // true

// Save pattern
if (errors.$valid) {
    await fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify(form.$dirty()),
    })
    form.$clear()  // new baseline
}

// Discard pattern
form.$reset()  // back to initial values`,
    },
    crossfield: {
        title: 'Cross-field Validation',
        concept: 'allValues',
        description: 'Every validator receives (value, allValues) — the second argument gives you access to the entire form state for cross-field checks like password confirmation.',
        highlights: [
            'Validator signature: (value, allValues) => true | string',
            'allValues is the full form state — access any field',
            'errors update reactively when either field changes',
            'Works with nested fields too — allValues reflects full structure',
            'No special API needed — just a function parameter',
        ],
        code: `import { createForm } from '@mustrd/form'

const [form, errors] = createForm(
    { password: '', confirm: '' },
    {
        password: v => v.length >= 6 || 'Min 6 characters',
        confirm: (v, all) =>
            v === all.password || 'Passwords must match',
    },
)

form.password = 'secret123'
form.confirm = 'secret456'
errors.confirm  // 'Passwords must match'

form.confirm = 'secret123'
errors.confirm  // null`,
    },
}
