import { Counter } from '../demos/Counter'
import { TodoList } from '../demos/TodoList'
import { FormRecord } from '../demos/FormRecord'
import { UndoDemo } from '../demos/UndoDemo'
import { SelectTable } from '../demos/SelectTable'

export function DemosPage() {
    return (
        <>
            <div className="page-header">
                <h1><span className="accent">Mustard</span> Demos</h1>
                <p>Interactive examples — every demo uses @mustrd/react for state management</p>
            </div>
            <div className="demo-grid">
                <Counter />
                <TodoList />
                <FormRecord />
                <UndoDemo />
                <SelectTable />
            </div>
        </>
    )
}
