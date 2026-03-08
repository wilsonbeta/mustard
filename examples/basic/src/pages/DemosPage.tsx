import { Counter } from '../demos/Counter'
import { TodoList } from '../demos/TodoList'
import { FormRecord } from '../demos/FormRecord'
import { UndoDemo } from '../demos/UndoDemo'
import { CascadingSelect } from '../demos/CascadingSelect'
import { LiveSearch } from '../demos/LiveSearch'
import { SelectTable } from '../demos/SelectTable'

export function DemosPage() {
    return (
        <>
            <div className="page-header motion" style={{ '--i': 0 } as any}>
                <h1><span className="accent">Mustard</span></h1>
                <p className="hero-tagline">Proxy-based state management for React.<br/>Direct assignment, auto-tracking, record diff, undo — zero dependencies.</p>
            </div>
            <div className="demo-grid">
                <Counter mi={1} />
                <TodoList mi={2} />
                <FormRecord mi={3} />
                <UndoDemo mi={4} />
                <CascadingSelect mi={5} />
                <LiveSearch mi={6} />
                <SelectTable mi={7} />
            </div>
        </>
    )
}
