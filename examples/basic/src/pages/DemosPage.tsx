import { Counter } from '../demos/Counter'
import { TodoList } from '../demos/TodoList'
import { FormRecord } from '../demos/FormRecord'
import { UndoDemo } from '../demos/UndoDemo'
import { CascadingSelect } from '../demos/CascadingSelect'
import { LiveSearch } from '../demos/LiveSearch'
import { SelectTable } from '../demos/SelectTable'
import { useSideModal } from '../components/SideModal'
import { DemoDetail, DEMO_DETAILS } from '../components/DemoDetail'

function ExpandLink({ detailKey }: { detailKey: string }) {
    const { open } = useSideModal()
    const detail = DEMO_DETAILS[detailKey]

    return (
        <div className="demo-expand-wrap">
            <button
                className="demo-expand-link"
                onClick={(e) => { e.stopPropagation(); open(<DemoDetail {...detail} />) }}
            >
                View source & details
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,3 11,8 6,13" />
                </svg>
            </button>
        </div>
    )
}

export function DemosPage() {
    return (
        <>
            <div className="page-header motion" style={{ '--i': 0 } as any}>
                <h1><span className="accent">Mustard</span></h1>
                <p className="hero-tagline">Proxy-based state management for React.<br/>Direct assignment, auto-tracking, record diff, undo — zero dependencies.</p>
            </div>
            <div className="demo-grid">
                <Counter mi={1} expand={<ExpandLink detailKey="counter" />} />
                <TodoList mi={2} expand={<ExpandLink detailKey="todo" />} />
                <FormRecord mi={3} expand={<ExpandLink detailKey="form" />} />
                <UndoDemo mi={4} expand={<ExpandLink detailKey="undo" />} />
                <CascadingSelect mi={5} expand={<ExpandLink detailKey="cascading" />} />
                <LiveSearch mi={6} expand={<ExpandLink detailKey="search" />} />
                <SelectTable mi={7} expand={<ExpandLink detailKey="table" />} />
            </div>
        </>
    )
}
