// src/blocks/shopify/shared/use-capabilities.ts

import { useEffect, useState } from 'react'
import { OPERATIONS_ALL, RESOURCES_ALL } from '../resources/constants'
import loadCapabilities from './capabilities.server'

interface Capabilities {
  resources: string[]
  operations: Record<string, string[]>
}

/** The full surface, used until the connection's real capabilities are known. */
const EVERYTHING: Capabilities = {
  resources: RESOURCES_ALL.map((r) => r.value),
  operations: Object.fromEntries(
    Object.entries(OPERATIONS_ALL).map(([resource, ops]) => [resource, ops.map((op) => op.value)])
  ),
}

let cached: Capabilities | null = null
let inFlight: Promise<Capabilities> | null = null

/**
 * What this connection may do, from the scopes its token was granted.
 *
 * Falls back to the full surface while loading and if the lookup fails — narrowing is a
 * usability affordance, not the security boundary. `shopifyExecute` refuses anything the
 * connection cannot perform regardless of what the panel offered.
 *
 * See auxxai repo: plans/connections/scope-derived-capabilities.md
 */
export function useCapabilities(): { capabilities: Capabilities; loading: boolean } {
  const [capabilities, setCapabilities] = useState<Capabilities>(cached ?? EVERYTHING)
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
        // Leave the full surface in place; the executor is the real guard.
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
