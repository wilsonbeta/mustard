import { useState, useEffect, useRef } from 'react'
import { DemosPage } from './pages/DemosPage'
import { GetStartedPage } from './pages/GetStartedPage'

const PAGES = [
    { key: 'demos', label: 'Demos', icon: '◆' },
    { key: 'start', label: 'Get Started', icon: '▶' },
] as const

type PageKey = typeof PAGES[number]['key']

export default function App() {
    const [page, setPage] = useState<PageKey>('demos')
    const [animClass, setAnimClass] = useState('page-enter')
    const pendingPage = useRef<PageKey | null>(null)

    const navigate = (target: PageKey) => {
        if (target === page) return
        pendingPage.current = target
        setAnimClass('page-exit')
    }

    const handleAnimEnd = () => {
        if (pendingPage.current !== null) {
            setPage(pendingPage.current)
            pendingPage.current = null
            setAnimClass('page-enter')
        }
    }

    useEffect(() => {
        setAnimClass('page-enter')
    }, [])

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">M</div>
                    <span className="logo-text">Mustard</span>
                    <span className="logo-version">v0.1.0</span>
                </div>
                <nav className="sidebar-nav">
                    {PAGES.map(p => (
                        <button
                            key={p.key}
                            className={`nav-item ${page === p.key ? 'active' : ''}`}
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
                <div
                    className={`page-container ${animClass}`}
                    onAnimationEnd={handleAnimEnd}
                >
                    {page === 'demos' && <DemosPage />}
                    {page === 'start' && <GetStartedPage />}
                </div>
            </main>
        </div>
    )
}
