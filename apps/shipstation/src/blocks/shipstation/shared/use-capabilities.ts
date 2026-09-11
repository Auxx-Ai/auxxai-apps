// src/blocks/shipstation/shared/use-capabilities.ts

import { onSettingsChanged } from '@auxx/sdk/client'
import { useCallback, useEffect, useState } from 'react'
import { deriveCapabilities } from '../resources/capabilities'
import loadCapabilities from './capabilities.server'

interface Capabilities {
  resources: string[]
  operations: Record<string, string[]>
}

/**
 * The surface shown while the real answer is loading.
 *
 * 🛑 This deliberately DIFFERS from the Shopify block, which falls back to its
 * full surface. There, every scope is usually granted, so the optimistic guess
 * is usually right. Here both write flags default to OFF, so a fresh
 * installation is read-only and the optimistic guess would be wrong most of the
 * time: the panel would offer "Purchase" and "Void", then take them away a beat
 * later, or let an author build a workflow the executor refuses at run time.
 *
 * The pessimistic fallback is the read surface, derived from empty settings, so
 * it can never drift from the real derivation.
 */
const READ_ONLY: Capabilities = (() => {
  const { resources, operations } = deriveCapabilities(undefined)
  return { resources, operations }
})()

/**
 * Last known answer. Module scope, so it is shared by every panel in this app
 * and survives a panel unmounting.
 *
 * 🛑 That lifetime is longer than it looks. The app runtime iframe is pooled
 * per installation in the host's `AppStore` and is only torn down with the
 * wrapper, so module state here outlives navigation around the host. A plain
 * `if (cached) return` therefore made the first answer permanent until a full
 * page reload: an admin who enabled `allowWrites` and walked back to the
 * workflow found the write operations still missing. `onSettingsChanged` is
 * what makes this cache honest.
 */
let cached: Capabilities | null = null
let inFlight: Promise<Capabilities> | null = null

/**
 * What this installation may do, from its app settings.
 *
 * Narrowing is a usability affordance, not the security boundary:
 * `shipstationExecute` refuses anything the installation cannot perform
 * regardless of what the panel offered, because Kopilot reaches the mapped
 * tools without the panel ever rendering.
 */
export function useCapabilities(): { capabilities: Capabilities; loading: boolean } {
  const [capabilities, setCapabilities] = useState<Capabilities>(cached ?? READ_ONLY)
  const [loading, setLoading] = useState(!cached)

  /** Fetch unless an identical request is already in the air. */
  const load = useCallback((isActive: () => boolean) => {
    inFlight ??= loadCapabilities().then((result) => {
      cached = result
      return result
    })
    const request = inFlight

    request
      .then((result) => {
        if (isActive()) setCapabilities(result)
      })
      .catch(() => {
        // Keep the last known answer; the executor is the real guard.
      })
      .finally(() => {
        // Never reuse a SETTLED promise, or an invalidation would be served the
        // stale result it was sent to replace.
        if (inFlight === request) inFlight = null
        if (isActive()) setLoading(false)
      })
  }, [])

  useEffect(() => {
    let active = true
    const isActive = () => active

    if (!cached) load(isActive)
    else setLoading(false)

    // The host pushes this when an admin saves this app's settings. Drop the
    // shared cache and re-read, so a panel that is already open corrects itself
    // without the user reloading.
    const unsubscribe = onSettingsChanged(() => {
      cached = null
      load(isActive)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [load])

  return { capabilities, loading }
}
