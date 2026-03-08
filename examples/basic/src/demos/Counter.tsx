import { useMustard } from '@mustrd/react'
import { useRef } from 'react'

export function Counter() {
    const state = useMustard({ count: 0 })
    const renders = useRef(0)
    renders.current++

    return (
        <div className="demo">
            <div className="row-between">
                <h2>Counter</h2>
                <span className="badge">renders: {renders.current}</span>
            </div>
            <p className="desc">Direct assignment — no setState, no dispatch</p>
            <div className="counter-display">{state.count}</div>
            <div className="row" style={{ justifyContent: 'center' }}>
                <button onClick={() => state.count--}>-</button>
                <button onClick={() => state.count = 0}>Reset</button>
                <button onClick={() => state.count++}>+</button>
            </div>
            <div className="code">
                {`// Just assign directly\nstate.count++\nstate.count = 0`}
            </div>
        </div>
    )
}
