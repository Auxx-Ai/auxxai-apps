// src/graphql/pushdown.ts

import {
  type ConnectorRecordFilterCondition,
  EXTERNAL_ID_FIELD,
  UnpushableFilterError,
} from '@auxx/sdk/data-connectors'

/** Projected key → operator → search term, or undefined when it cannot be expressed exactly. */
export type Pushdown = Record<string, Record<string, (value: unknown) => string | undefined>>

const MAX_IDS = 50

/**
 * `{ from?, to? }` as the engine sends it: UTC ISO, at least one end. From inclusive, to
 * exclusive; quoted, since unquoted the ISO colon breaks parsing.
 */
function createdAtBetween(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { from, to } = value as { from?: unknown; to?: unknown }
  if ([from, to].some((bound) => bound !== undefined && typeof bound !== 'string')) return undefined
  return [from && `created_at:>='${from}'`, to && `created_at:<'${to}'`].filter(Boolean).join(' AND ')
}

/** 1–50 legacy numeric ids; a GID is rejected by Shopify's `id:` search. Digits only, so nothing injects. */
function idIn(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_IDS) return undefined
  if (!value.every((id) => typeof id === 'string' && /^\d+$/.test(id))) return undefined
  return `(${value.map((id) => `id:${id}`).join(' OR ')})`
}

const byExternalId = { [EXTERNAL_ID_FIELD]: { in: idIn } }

export const ORDER_PUSHDOWN: Pushdown = {
  ...byExternalId,
  createdAt: { between: createdAtBetween },
}
export const CUSTOMER_PUSHDOWN: Pushdown = byExternalId
export const PRODUCT_PUSHDOWN: Pushdown = byExternalId

/**
 * Translate `recordFilter` into extra search terms. Throws for an `exact` clause the table
 * cannot express, so call it before any upstream request.
 */
export function pushdownTerms(
  streamKey: string,
  table: Pushdown,
  recordFilter: readonly ConnectorRecordFilterCondition[] | undefined
): { terms: string[]; narrowed: boolean } {
  const terms: string[] = []
  let narrowed = false
  for (const clause of recordFilter ?? []) {
    const translate = table[clause.fieldId]?.[clause.operator]
    const term = translate?.(clause.value)
    if (clause.exact) {
      if (!translate) throw new UnpushableFilterError(streamKey, clause, 'no search equivalent')
      if (term === undefined) throw new UnpushableFilterError(streamKey, clause, 'invalid value')
      narrowed = true
    }
    // A non-exact clause is a hint: pushed when expressible (over-fetching is harmless).
    if (term !== undefined) terms.push(term)
  }
  return { terms, narrowed }
}
