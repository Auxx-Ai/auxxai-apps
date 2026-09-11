// src/blocks/shipstation/shared/use-capabilities.ts

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (cached) return
    let active = true
    inFlight ??= loadCapabilities().then((result) => {
      cached = result
      return result
    })
    inFlight
      .then((result) => {
        if (active) setCapabilities(result)
      })
      .catch(() => {
        // Leave the read-only surface in place; the executor is the real guard.
        inFlight = null
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { capabilities, loading }
}
