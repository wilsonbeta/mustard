import { useMustard } from '@mustrd/react'
import { CodeBlock } from '../components/CodeBlock'

const DATA: Record<string, string[]> = {
    Taiwan: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan'],
    Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka'],
    USA: ['New York', 'San Francisco', 'Los Angeles', 'Seattle'],
}

const COUNTRIES = Object.keys(DATA)

export function CascadingSelect({ mi = 0 }: { mi?: number }) {
    const state = useMustard({
        country: '',
        city: '',
    })

    const cities = state.country ? DATA[state.country] ?? [] : []

    const handleCountry = (val: string) => {
        state.country = val
        state.city = '' // reset city when country changes
    }

    return (
        <div className="demo motion" style={{ '--i': mi } as any}>
            <h2>Cascading Select</h2>
            <p className="desc">Derived state — changing country resets and updates city options</p>
            <div className="stack" style={{ marginBottom: '0.75rem' }}>
                <div className="form-group">
                    <label>Country</label>
                    <select
                        value={state.country}
                        onChange={e => handleCountry(e.target.value)}
                    >
                        <option value="">Select a country...</option>
                        {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>City</label>
                    <select
                        value={state.city}
                        onChange={e => state.city = e.target.value}
                        disabled={!state.country}
                    >
                        <option value="">
                            {state.country ? 'Select a city...' : 'Pick a country first'}
                        </option>
                        {cities.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
            {state.country && state.city && (
                <div style={{
                    padding: '0.6rem 0.75rem',
                    background: 'var(--accent-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
                }}>
                    Selected: <strong style={{ color: 'var(--accent)' }}>{state.city}, {state.country}</strong>
                </div>
            )}
            <CodeBlock code={`// Direct assignment — no reducers
state.country = 'Japan'
state.city = ''  // auto-reset

// Cities derived from state
const cities = DATA[state.country] ?? []`} />
        </div>
    )
}
