// src/blocks/shipstation/shared/use-shipstation-data.ts

import { useCallback, useEffect, useState } from 'react'

type SelectOption = { label: string; value: string }

interface CacheEntry {
  data: SelectOption[]
  timestamp: number
  error: string | null
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<SelectOption[]>>()
const CACHE_TTL = 5 * 60 * 1000

/**
 * Lazily load panel picker options, deduped and cached across panel mounts.
 *
 * `enabled` keeps a loader from firing for an operation that does not use it:
 * a carrier list is pointless while the author is filling in a tracking lookup.
 */
export function useShipstationData(
  key: string,
  fetcher: () => Promise<SelectOption[]>,
  { delay = 0, enabled = true }: { delay?: number; enabled?: boolean } = {}
) {
  const [data, setData] = useState<SelectOption[]>(() => cache.get(key)?.data ?? [])
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
          const result = await pending.get(key)
          if (result) setData(result)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load')
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
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load'
        cache.set(key, { data: [], timestamp: Date.now(), error: message })
        setError(message)
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
