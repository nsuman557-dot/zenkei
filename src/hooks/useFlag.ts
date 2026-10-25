import { useState } from 'react'

/** A boolean stored in localStorage ('1' / '0'); works without storage too. */
export function useFlag(key: string, initial: boolean) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : raw === '1'
    } catch {
      return initial
    }
  })
  return [
    v,
    (n: boolean) => {
      setV(n)
      try {
        localStorage.setItem(key, n ? '1' : '0')
      } catch {
        /* ignore */
      }
    },
  ] as const
}
