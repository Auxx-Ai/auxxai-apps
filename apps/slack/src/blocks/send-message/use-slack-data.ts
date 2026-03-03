// src/blocks/send-message/use-slack-data.ts

/**
 * Module-level cache + React hook for loading Slack data (channels, users).
 *
 * Uses Option A from the plan: a module-level Map cache that persists as
 * long as the SDK iframe is alive (survives panel open/close). Entries
 * expire after 5 minutes.
 */

import { useState, useEffect, useCallback } from 'react'

type SelectOption = { label: string; value: string }

interface CacheEntry {
  data: SelectOption[]
  timestamp: number
  error: string | null
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<SelectOption[]>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useSlackData(
  key: string,
  fetcher: () => Promise<SelectOption[]>,
  { delay = 0 }: { delay?: number } = {},
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

      // Deduplicate in-flight requests
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
    [key, fetcher],
  )

  useEffect(() => {
    if (delay <= 0) {
      load()
      return
    }
    const timer = setTimeout(() => {
      load()
    }, delay)
    return () => clearTimeout(timer)
  }, [load, delay])

  return { data, loading, error, refresh: () => load(true) }
}
