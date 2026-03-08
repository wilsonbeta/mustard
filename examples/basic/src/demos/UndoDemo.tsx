import { useMustard, record } from '@mustrd/react'

const COLORS = ['#e74c3c', '#e2b714', '#2ecc71', '#3498db', '#9b59b6', '#e67e22', '#1abc9c']

export function UndoDemo() {
    const state = useMustard({
        color: '#e2b714',
        size: 60,
        radius: 8,
    })

    const historySize = record(state).size()

    const randomColor = () => {
        state.color = COLORS[Math.floor(Math.random() * COLORS.length)]
    }

    const randomSize = () => {
        state.size = 30 + Math.floor(Math.random() * 80)
    }

    const randomRadius = () => {
        state.radius = Math.floor(Math.random() * 50)
    }

    return (
        <div className="demo">
            <div className="row-between">
                <h2>Undo</h2>
                <span className="badge">history: {historySize}</span>
            </div>
            <p className="desc">Time travel — step back through every change</p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                <div
                    style={{
                        width: state.size,
                        height: state.size,
                        backgroundColor: state.color,
                        borderRadius: state.radius,
                        transition: 'all 0.2s ease',
                    }}
                />
            </div>
            <div className="row" style={{ justifyContent: 'center', marginBottom: '0.75rem' }}>
                <button onClick={randomColor}>Color</button>
                <button onClick={randomSize}>Size</button>
                <button onClick={randomRadius}>Radius</button>
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
                <button
                    onClick={() => record(state).undo()}
                    disabled={historySize === 0}
                    style={{ opacity: historySize > 0 ? 1 : 0.4 }}
                >
                    ← Undo
                </button>
                <button
                    onClick={() => record(state).undoAll()}
                    disabled={historySize === 0}
                    style={{ opacity: historySize > 0 ? 1 : 0.4 }}
                >
                    Reset All
                </button>
            </div>
            {historySize > 0 && (
                <div className="history-bar" style={{ justifyContent: 'center' }}>
                    {Array.from({ length: historySize }, (_, i) => (
                        <div
                            key={i}
                            className={`history-dot ${i === historySize - 1 ? 'active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => record(state).undoTo(i)}
                            title={`Undo to step ${i}`}
                        />
                    ))}
                </div>
            )}
            <div className="code">
                {`// Undo last change\nrecord(state).undo()\n\n// Jump to step 2\nrecord(state).undoTo(2)\n\n// Reset everything\nrecord(state).undoAll()`}
            </div>
        </div>
    )
}
