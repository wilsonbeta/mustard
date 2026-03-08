import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import { DemosPage } from './pages/DemosPage'
import { GetStartedPage } from './pages/GetStartedPage'
import { ApiPage } from './pages/ApiPage'

// SVG Icons (inline, no dependency)
const Icons = {
    demos: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
            <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
            <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
        </svg>
    ),
    start: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5,2.5 13,8 5,13.5" fill="currentColor" stroke="none" />
        </svg>
    ),
    api: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4.5,4.5 1.5,8 4.5,11.5" />
            <polyline points="11.5,4.5 14.5,8 11.5,11.5" />
            <line x1="9.5" y1="2.5" x2="6.5" y2="13.5" />
        </svg>
    ),
}

const PAGES = [
    { key: 'demos', label: 'Demos', icon: Icons.demos },
    { key: 'start', label: 'Get Started', icon: Icons.start },
    { key: 'api', label: 'API', icon: Icons.api },
] as const

type PageKey = typeof PAGES[number]['key']

const EXIT_MS = 300

export default function App() {
    const [page, setPage] = useState<PageKey>('demos')
    const [activeNav, setActiveNav] = useState<PageKey>('demos') // bar follows this immediately
    const [animClass, setAnimClass] = useState('page-enter')
    const isTransitioning = useRef(false)

    // Sliding bar — tracks activeNav (updates instantly on click)
    const navRefs = useRef<Record<string, HTMLButtonElement | null>>({})
    const [barStyle, setBarStyle] = useState({ top: 0, height: 0 })
    const navContainerRef = useRef<HTMLElement>(null)

    useLayoutEffect(() => {
        const el = navRefs.current[activeNav]
        const container = navContainerRef.current
        if (el && container) {
            const elRect = el.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            setBarStyle({
                top: elRect.top - containerRect.top,
                height: elRect.height,
            })
        }
    }, [activeNav])

    const navigate = useCallback((target: PageKey) => {
        if (target === page || isTransitioning.current) return
        isTransitioning.current = true
        setActiveNav(target) // bar moves immediately
        setAnimClass('page-exit')

        setTimeout(() => {
            setPage(target)
            setAnimClass('page-enter')
            setTimeout(() => { isTransitioning.current = false }, 400)
        }, EXIT_MS)
    }, [page])

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">M</div>
                    <span className="logo-text">Mustard</span>
                    <span className="logo-version">v0.1.1</span>
                </div>
                <nav className="sidebar-nav" ref={navContainerRef}>
                    <div
                        className="nav-indicator"
                        style={{
                            transform: `translateY(${barStyle.top}px)`,
                            height: barStyle.height,
                        }}
                    />
                    {PAGES.map(p => (
                        <button
                            key={p.key}
                            ref={el => { navRefs.current[p.key] = el }}
                            className={`nav-item ${activeNav === p.key ? 'active' : ''}`}
                            onClick={() => navigate(p.key)}
                        >
                            <span className="nav-icon">{p.icon}</span>
                            {p.label}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <a href="https://www.npmjs.com/package/@mustrd/react" target="_blank" rel="noreferrer">
                        <span className="nav-icon">↗</span>
                        npm
                    </a>
                    <a href="https://github.com/wilsonbeta/mustard" target="_blank" rel="noreferrer">
                        <span className="nav-icon">↗</span>
                        GitHub
                    </a>
                </div>
            </aside>
            <main className="main-content">
                <div className={`page-container ${animClass}`}>
                    {page === 'demos' && <DemosPage />}
                    {page === 'start' && <GetStartedPage />}
                    {page === 'api' && <ApiPage />}
                </div>
            </main>
        </div>
    )
}
