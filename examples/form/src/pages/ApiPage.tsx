import { CodeBlock } from '../components/CodeBlock'

export function ApiPage() {
    return (
        <>
            <div className="page-header motion" style={{ '--i': 0 } as never}>
                <h1>API Reference</h1>
                <p>Complete reference for <code>@mustrd/form</code></p>
            </div>

            <div className="doc-section motion" style={{ '--i': 1 } as never}>
                <h2>Installation</h2>
                <div className="install-block">
                    <span className="prompt">$</span>
                    npm install @mustrd/form
                </div>
                <CodeBlock code={`import { createForm } from '@mustrd/form'`} />
            </div>

            <div className="doc-section motion" style={{ '--i': 2 } as never}>
                <h2>createForm(data, rules?)</h2>
                <p>Creates a form instance. Returns a tuple of three same-shape proxies.</p>
                <CodeBlock code={`const [form, errors, edited] = createForm(
    { name: '', email: '', addr: { city: '' } },
    { name: true, email: v => v.includes('@') || 'Invalid email', addr: { city: true } },
)`} />

                <h3>Parameters</h3>
                <div className="api-table">
                    <table>
                        <thead><tr><th>Param</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>data</code></td><td><code>object</code></td><td>Initial form values — any shape, including nested objects and arrays</td></tr>
                            <tr><td><code>rules</code></td><td><code>RuleMap</code></td><td>Optional validation rules — must mirror data shape</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3>Rules</h3>
                <div className="api-table">
                    <table>
                        <thead><tr><th>Rule Type</th><th>Example</th><th>Meaning</th></tr></thead>
                        <tbody>
                            <tr><td><code>true</code></td><td><code>{'{ name: true }'}</code></td><td>Required — empty string, null, undefined are errors</td></tr>
                            <tr><td><code>function</code></td><td><code>{'{ email: v => ... }'}</code></td><td>Custom — return <code>true</code> or error string</td></tr>
                            <tr><td><code>object</code></td><td><code>{'{ addr: { city: true } }'}</code></td><td>Nested — rules for nested object fields</td></tr>
                            <tr><td><code>[rule]</code></td><td><code>{'{ friends: [{ name: true }] }'}</code></td><td>Array — one rule applied to every array item</td></tr>
                        </tbody>
                    </table>
                </div>
                <p>Validator functions receive <code>(value, allValues)</code> for cross-field checks.</p>
            </div>

            <div className="doc-section motion" style={{ '--i': 3 } as never}>
                <h2>form</h2>
                <p>Read and write values with direct assignment. Also exposes form API methods.</p>

                <div className="api-table">
                    <table>
                        <thead><tr><th>Method</th><th>Returns</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>form.$dirty()</code></td><td><code>object</code></td><td>Only changed fields (for PATCH)</td></tr>
                            <tr><td><code>form.$dirty({'{ depth: 1 }'})</code></td><td><code>object</code></td><td>Changed first-level keys with complete values</td></tr>
                            <tr><td><code>form.$dirtyFields()</code></td><td><code>string[]</code></td><td>List of changed field paths</td></tr>
                            <tr><td><code>form.$isDirty()</code></td><td><code>boolean</code></td><td>Whether any field changed</td></tr>
                            <tr><td><code>form.$values()</code></td><td><code>object</code></td><td>All current values as plain object</td></tr>
                            <tr><td><code>form.$reset()</code></td><td><code>void</code></td><td>Revert to initial values, clear dirty + edited</td></tr>
                            <tr><td><code>form.$clear()</code></td><td><code>void</code></td><td>Clear dirty + edited (keep current values as new baseline)</td></tr>
                            <tr><td><code>form.$store</code></td><td><code>MustardStore</code></td><td>Underlying store (for framework integration)</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="doc-section motion" style={{ '--i': 4 } as never}>
                <h2>errors</h2>
                <p>Same shape as form. Every leaf returns error message (string) or <code>null</code>.</p>

                <div className="api-table">
                    <table>
                        <thead><tr><th>Property</th><th>Returns</th><th>Description</th></tr></thead>
                        <tbody>
                            <tr><td><code>errors.name</code></td><td><code>string | null</code></td><td>Error message for the field, or null if valid</td></tr>
                            <tr><td><code>errors.addr.city</code></td><td><code>string | null</code></td><td>Works with nested paths</td></tr>
                            <tr><td><code>errors.friends[0].name</code></td><td><code>string | null</code></td><td>Works with array items</td></tr>
                            <tr><td><code>errors.$valid</code></td><td><code>boolean</code></td><td>True if no errors anywhere</td></tr>
                            <tr><td><code>errors.$all</code></td><td><code>ErrorEntry[]</code></td><td>All errors as {'[{ path, message }]'}</td></tr>
                            <tr><td><code>errors.$first</code></td><td><code>ErrorEntry | null</code></td><td>First error, or null</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="doc-section motion" style={{ '--i': 5 } as never}>
                <h2>edited</h2>
                <p>Same shape as form. Every leaf returns <code>boolean</code> — whether the field was written to.</p>

                <CodeBlock code={`const [form, errors, edited] = createForm(
    { name: '', email: '' },
    { name: true },
)

edited.name   // false
form.name = 'Wilson'
edited.name   // true

// Show error only after user has edited the field
{edited.name && errors.name && <span>{errors.name}</span>}

// $reset() and $clear() both clear edited state
form.$reset()
edited.name   // false`} />
            </div>

            <div className="doc-section motion" style={{ '--i': 6 } as never}>
                <h2>Framework Integration</h2>
                <p><code>@mustrd/form</code> is framework-agnostic. The core is pure JavaScript — you just need one line of glue for your framework.</p>

                <h3>React</h3>
                <CodeBlock code={`import { useSyncExternalStore } from 'react'
import { createForm } from '@mustrd/form'

const [form, errors, edited] = createForm(data, rules)

function useFormSync() {
    useSyncExternalStore(
        form.$store.subscribe,
        () => form.$store.getVersion(),
        () => form.$store.getVersion(),
    )
}

function MyForm() {
    useFormSync()
    // form, errors, edited are now reactive
}`} />

                <h3>Vue (Composition API)</h3>
                <CodeBlock code={`import { ref, watchEffect } from 'vue'
import { createForm } from '@mustrd/form'

const [form, errors, edited] = createForm(data, rules)
const ver = ref(0)
form.$store.subscribe(() => ver.value++)`} />

                <h3>Vanilla JS</h3>
                <CodeBlock code={`import { createForm } from '@mustrd/form'

const [form, errors] = createForm(data, rules)
form.$store.subscribe(() => render())`} />
            </div>
        </>
    )
}
