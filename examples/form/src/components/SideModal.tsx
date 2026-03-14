import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SideModalContextType {
    open: (content: ReactNode) => void
    close: () => void
}

const SideModalContext = createContext<SideModalContextType>({
    open: () => {},
    close: () => {},
})

export const useSideModal = () => useContext(SideModalContext)

export function SideModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState<ReactNode>(null)

    const open = useCallback((node: ReactNode) => {
        setContent(node)
        setIsOpen(true)
    }, [])

    const close = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <SideModalContext.Provider value={{ open, close }}>
            <div
                className={`side-modal-backdrop ${isOpen ? 'open' : ''}`}
                onClick={close}
            />
            <div className={`side-modal-body ${isOpen ? 'open' : ''}`}>
                {children}
            </div>
            <div className={`side-modal-panel ${isOpen ? 'open' : ''}`}>
                <div className="side-modal-inner">
                    <button className="side-modal-close" onClick={close}>✕</button>
                    <div className="side-modal-content">
                        {content}
                    </div>
                </div>
            </div>
        </SideModalContext.Provider>
    )
}
