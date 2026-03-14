import { Highlight, themes } from 'prism-react-renderer'

interface Props {
    code: string
    language?: string
}

export function CodeBlock({ code, language = 'tsx' }: Props) {
    return (
        <Highlight theme={themes.vsDark} code={code.trim()} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
                <pre className="code" style={{ ...style, background: 'transparent' }}>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                            ))}
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    )
}
