import { createForm } from '@mustrd/form'
import { useSyncExternalStore } from 'react'

const [form, errors, edited] = createForm(
    {
        password: '',
        confirm: '',
    },
    {
        password: (v: string) => v.length >= 6 || 'Min 6 characters',
        confirm: (v: string, all: { password: string }) =>
            v === all.password || 'Passwords must match',
    },
)

function useFormSync() {
    useSyncExternalStore(
        form.$store.subscribe,
        () => form.$store.getVersion(),
        () => form.$store.getVersion(),
    )
}

export function CrossField({ mi = 0, expand }: { mi?: number, expand?: React.ReactNode }) {
    useFormSync()

    return (
        <div className="demo motion" style={{ '--i': mi } as never}>
            <div className="row-between">
                <h2>Cross-field</h2>
                {errors.$valid
                    ? <span className="badge badge-success">valid</span>
                    : <span className="badge badge-error">{errors.$all.length} errors</span>
                }
            </div>
            <p className="desc">
                Validator receives <code>(value, allValues)</code> — access any field for cross-field checks.
            </p>
            <div className="stack">
                <div className="form-group">
                    <label>
                        Password
                        {edited.password && <span className="edited-dot" />}
                    </label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={e => form.password = e.target.value}
                        className={edited.password && errors.password ? 'input-error' : ''}
                        placeholder="Min 6 characters"
                    />
                    {edited.password && errors.password && <span className="field-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                    <label>
                        Confirm
                        {edited.confirm && <span className="edited-dot" />}
                    </label>
                    <input
                        type="password"
                        value={form.confirm}
                        onChange={e => form.confirm = e.target.value}
                        className={edited.confirm && errors.confirm ? 'input-error' : ''}
                        placeholder="Must match password"
                    />
                    {edited.confirm && errors.confirm && <span className="field-error">{errors.confirm}</span>}
                </div>
            </div>
            {errors.$valid && edited.password && edited.confirm && (
                <div className="success-msg">All checks passed</div>
            )}
            {expand}
        </div>
    )
}
