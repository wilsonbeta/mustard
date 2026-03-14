import { useMustard } from '@mustrd/react'
import { CodeBlock } from '../components/CodeBlock'

interface Row {
    id: number;
    name: string;
    role: string;
    status: string;
    selected: boolean;
}

const INITIAL_DATA: Row[] = [
    { id: 1, name: 'Alice Chen', role: 'Frontend', status: 'Active', selected: false },
    { id: 2, name: 'Bob Wang', role: 'Backend', status: 'Active', selected: false },
    { id: 3, name: 'Carol Liu', role: 'Design', status: 'Away', selected: false },
    { id: 4, name: 'David Lin', role: 'PM', status: 'Active', selected: false },
    { id: 5, name: 'Eve Wu', role: 'DevOps', status: 'Offline', selected: false },
]

const STATUS_COLOR: Record<string, string> = {
    Active: '#2ecc71',
    Away: '#e2b714',
    Offline: '#e74c3c',
}

export function SelectTable({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    const state = useMustard({ rows: INITIAL_DATA })

    const selectedCount = state.rows.filter((r: Row) => r.selected).length
    const allSelected = selectedCount === state.rows.length

    const toggleAll = (checked: boolean) => {
        state.rows.forEach((row: Row) => {
            row.selected = checked
        })
    }

    const deleteSelected = () => {
        const remaining = state.rows.filter((r: Row) => !r.selected)
        ;(state as any).reset({ rows: remaining })
    }

    return (
        <div className="demo motion" style={{ gridColumn: '1 / -1', '--i': mi } as any}>
            <div className="row-between">
                <h2>Selectable Table</h2>
                {selectedCount > 0 && (
                    <div className="row">
                        <span className="badge">{selectedCount} selected</span>
                        <button className="danger" onClick={deleteSelected} style={{ fontSize: '0.8rem' }}>
                            Delete Selected
                        </button>
                    </div>
                )}
            </div>
            <p className="desc">forEach mutation — select all in one line, no immutable boilerplate</p>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 40 }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected && state.rows.length > 0}
                                    onChange={e => toggleAll(e.target.checked)}
                                />
                            </th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.rows.map((row: Row, i: number) => (
                            <tr
                                key={row.id}
                                className={row.selected ? 'row-selected' : ''}
                                onClick={() => state.rows[i].selected = !state.rows[i].selected}
                            >
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={row.selected}
                                        onChange={() => state.rows[i].selected = !state.rows[i].selected}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </td>
                                <td style={{ fontWeight: 500 }}>{row.name}</td>
                                <td style={{ opacity: 0.6 }}>{row.role}</td>
                                <td>
                                    <span className="status-dot" style={{ background: STATUS_COLOR[row.status] }} />
                                    {row.status}
                                </td>
                            </tr>
                        ))}
                        {state.rows.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', opacity: 0.4, padding: '2rem' }}>
                                    No data — refresh to reset
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <CodeBlock code={`// Select all — one line, no spread, no map
state.rows.forEach(row => {
    row.selected = checked
})

// Compare with Redux / Zustand:
// setState(prev => ({
//     rows: prev.rows.map(r => ({ ...r, selected: checked }))
// }))`} />
            {expand}
        </div>
    )
}
