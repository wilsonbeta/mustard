import { useMustard } from '@mustrd/react'
import { useRef } from 'react'
import { CodeBlock } from '../components/CodeBlock'

export function Counter({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    const state = useMustard({ count: 0 })
    const renders = useRef(0)
    renders.current++

    return (
        <div className="demo motion" style={{ '--i': mi } as any}>
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
            <CodeBlock code={`// Just assign directly
state.count++
state.count = 0`} />
            {expand}
        </div>
    )
}
