import { BasicForm } from '../demos/BasicForm'
import { NestedForm } from '../demos/NestedForm'
import { PatchPattern } from '../demos/PatchPattern'
import { CrossField } from '../demos/CrossField'
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
            <div className="page-header motion" style={{ '--i': 0 } as never}>
                <h1><span className="accent">@mustrd/form</span></h1>
                <p className="hero-tagline">Proxy-based form state — validation, dirty tracking, error mirror.<br/>Framework-agnostic. Zero dependencies besides <code>@mustrd/core</code>.</p>
            </div>
            <div className="demo-grid">
                <BasicForm mi={1} expand={<ExpandLink detailKey="basic" />} />
                <NestedForm mi={2} expand={<ExpandLink detailKey="nested" />} />
                <PatchPattern mi={3} expand={<ExpandLink detailKey="patch" />} />
                <CrossField mi={4} expand={<ExpandLink detailKey="crossfield" />} />
            </div>
        </>
    )
}
