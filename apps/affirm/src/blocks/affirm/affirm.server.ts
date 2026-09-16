// src/blocks/affirm/affirm.server.ts

/**
 * Dispatcher for the `affirm` workflow block.
 *
 * Routes the author's (resource, operation) pair through the tool map and
 * delegates to the matching read tool via `ctx.runTool`. It calls Affirm
 * nowhere: every request, every page and every projection of Affirm's JSON is
 * the tool's, which is the tool the agent surface already uses.
 *
 * It does three things and nothing else:
 *
 *  1. STRUCTURAL check, from `VALID_OPERATIONS`. Does this pair exist at all?
 *  2. INPUT projection. The block's flat schema namespaces its inputs
 *     (`settlementGetEventsDepositId`), the tools take the bare names
 *     (`depositId`), so each op is mapped explicitly. Blank strings and
 *     unparseable limits are dropped rather than forwarded: a `limit` of `''`
 *     survives the tool's `?? 250` default and then falls out of the query
 *     string, leaving Affirm's own page default of **5** — a silently short page.
 *  3. OUTPUT shaping. Counts for the list ops, and an explicit nesting for
 *     `charge.get`.
 *
 * There is no permission check, because all four operations are reads and this
 * app has no write surface. Add one the day build plan §7 does — the tool map is
 * reachable by Kopilot without the panel ever rendering.
 *
 * ## Why `charge.get` is projected field-by-field and the list ops are not
 *
 * `get_affirm_charge` deliberately projects only `checkout.metadata` off an
 * expanded Affirm checkout, never `billing`, `shipping` or the customer — an
 * expanded checkout is full of them, and `tests/affirm-tools.test.ts` asserts it.
 * An allowlist here cannot widen that: if the tool ever grows a field, this
 * block does not surface it until someone adds it deliberately. Pass-through
 * would surface it the same day. The list ops return arrays of rows the tool has
 * already projected, whose schemas have no field that could hold a name or an
 * address, so re-mapping each row would only duplicate projection logic the
 * block is not allowed to own.
 */

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { type affirmSchema, VALID_OPERATIONS } from './affirm-schema'
import { affirmToolMap } from './affirm-tool-map'

/** A usable string, or `undefined` so the tool applies its own default. */
function text(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return value === undefined || value === null ? undefined : String(value)
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * A positive integer, or `undefined`.
 *
 * Bindable inputs arrive as whatever the upstream node produced, so a page size
 * can turn up as `'250'` or as `''`. Anything that is not a usable count becomes
 * `undefined` and the tool's own cap applies.
 */
function count(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.trunc(parsed)
}

/** The block's namespaced inputs, mapped onto the dispatched tool's flat ones. */
function projectInputs(key: string, input: Record<string, any>): Record<string, unknown> {
  switch (key) {
    case 'settlement.getMany':
      return {
        after: text(input.settlementGetManyAfter),
        before: text(input.settlementGetManyBefore),
        limit: count(input.settlementGetManyLimit),
        cursor: text(input.settlementGetManyCursor),
      }
    case 'settlement.getEvents':
      return {
        after: text(input.settlementGetEventsAfter),
        before: text(input.settlementGetEventsBefore),
        depositId: text(input.settlementGetEventsDepositId),
        limit: count(input.settlementGetEventsLimit),
        cursor: text(input.settlementGetEventsCursor),
      }
    case 'charge.getMany':
      return {
        after: text(input.chargeGetManyAfter),
        before: text(input.chargeGetManyBefore),
        orderId: text(input.chargeGetManyOrderId),
        limit: count(input.chargeGetManyLimit),
      }
    case 'charge.get':
      return { chargeId: text(input.chargeId) }
    default:
      throw new Error(`No input projection for ${key}`)
  }
}

/** The tool's output, shaped into the variables `affirmComputeOutputs` declares. */
function projectOutput(key: string, output: Record<string, any>): Record<string, unknown> {
  switch (key) {
    case 'settlement.getMany':
      return { ...output, settlementCount: (output.settlements ?? []).length }
    case 'settlement.getEvents':
      return { ...output, eventCount: (output.events ?? []).length }
    case 'charge.getMany':
      return { ...output, chargeCount: (output.charges ?? []).length }
    case 'charge.get':
      return {
        // Lifted to the top level because binding it is the whole point of the
        // operation: it is `checkout.metadata.transaction_id` verbatim, the
        // Shopify PaymentSession gid, and the way an Affirm charge is tied back
        // to its Shopify order (build plan §6 rule 4).
        shopifyPaymentSessionId: output.shopifyPaymentSessionId ?? null,
        orderId: output.orderId ?? null,
        summary: output.summary ?? '',
        charge: {
          id: output.id ?? null,
          orderId: output.orderId ?? null,
          status: output.status ?? null,
          amount: output.amount ?? null,
          amountRefunded: output.amountRefunded ?? null,
          currency: output.currency ?? null,
          created: output.created ?? null,
          authorizationExpiration: output.authorizationExpiration ?? null,
          checkoutId: output.checkoutId ?? null,
          eventCount: output.eventCount ?? 0,
          platformType: output.platformType ?? null,
          // Should equal `orderId`. A mismatch is a finding worth surfacing, not
          // smoothing over — the tool's `summary` says so in words.
          checkoutOrderId: output.checkoutOrderId ?? null,
        },
        events: output.events ?? [],
      }
    default:
      throw new Error(`No output projection for ${key}`)
  }
}

const execute: WorkflowExecuteFunction<typeof affirmSchema> = async (input, ctx) => {
  const flat = input as unknown as Record<string, any>
  const resource = String(flat.resource ?? '')
  const operation = String(flat.operation ?? '')

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  const key = `${resource}.${operation}`
  const toolId = (affirmToolMap as Record<string, string>)[key]
  if (!toolId) throw new Error(`No tool mapped for ${key}`)

  const result = await ctx.runTool<Record<string, unknown>, Record<string, any>>(
    toolId,
    projectInputs(key, flat)
  )
  return projectOutput(key, result ?? {}) as any
}

export default execute
