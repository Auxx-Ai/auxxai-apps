import { useState, useEffect, useCallback } from 'react'

interface CacheEntry {
  data: { label: string; value: string }[]
  timestamp: number
  error: string | null
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<{ label: string; value: string }[]>>()
const CACHE_TTL = 5 * 60 * 1000

export function useGithubData(
  key: string,
  fetcher: () => Promise<{ label: string; value: string }[]>,
  { delay = 0, enabled = true }: { delay?: number; enabled?: boolean } = {}
) {
  const [data, setData] = useState<{ label: string; value: string }[]>(
    () => cache.get(key)?.data ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(() => cache.get(key)?.error ?? null)

  const load = useCallback(
    async (force = false) => {
      const cached = cache.get(key)
      if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL && !cached.error) {
        setData(cached.data)
        setError(null)
        return
      }

      if (!force && pending.has(key)) {
        try {
          const result = await pending.get(key)!
          setData(result)
        } catch (err: any) {
          setError(err.message ?? 'Failed to load')
        }
        return
      }

      setLoading(true)
      setError(null)

      const promise = fetcher()
      pending.set(key, promise)

      try {
        const result = await promise
        cache.set(key, { data: result, timestamp: Date.now(), error: null })
        setData(result)
      } catch (err: any) {
        const msg = err.message ?? 'Failed to load'
        cache.set(key, { data: [], timestamp: Date.now(), error: msg })
        setError(msg)
      } finally {
        pending.delete(key)
        setLoading(false)
      }
    },
    [key, fetcher]
  )

  useEffect(() => {
    if (!enabled) return

    if (delay <= 0) {
      load()
      return
    }
    const timer = setTimeout(() => {
      load()
    }, delay)
    return () => clearTimeout(timer)
  }, [load, delay, enabled])

  return { data, loading, error, refresh: () => load(true) }
}
