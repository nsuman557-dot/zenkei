import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

/**
 * Runs an async function whenever `deps` change and exposes
 * { data, error, loading, reload }.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ data: undefined, error: undefined, loading: true })
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, loading: false })
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({ data: undefined, error: e instanceof Error ? e : new Error(String(e)), loading: false })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
