// src/blocks/affirm/affirm-tool-map.ts

/**
 * Dispatch table: `${resource}.${operation}` from the block schema to the id of
 * the tool that executes it.
 *
 * ⚠️ These are the app's FOUR EXISTING READ TOOLS, not block-private copies of
 * them. ShipStation and Stripe register a parallel `block_*_*` tool per
 * operation because those blocks have 23 and 40 operations and a real agent cost
 * to declaring them; Affirm has four, all read-only, all already registered in
 * `src/app.tsx`, and all already in the `affirm.settlements` toolset. A second
 * set would be a second implementation of the same call — which build plan §8
 * rules out in as many words: *"they share fetch and projection code; they are
 * not a second implementation"*.
 *
 * Lives in a plain `.ts` (not the `.workflow.tsx`) so the server-side dispatcher
 * can import it without dragging in the React/client surface. The build
 * extractor reads this literal at compile time and projects it into the catalog
 * envelope, evaluating `computeOutputs` once per key, so the runtime can
 * validate dispatches and the canvas knows each operation's variables.
 *
 * 🛑 Every pair here is reachable by Kopilot WITHOUT the panel rendering. That is
 * safe HERE only because all four are reads. The moment a capture, refund or
 * void operation is added (build plan §7), this file stops being harmless and
 * `affirm.server.ts` needs a permission check as well as its structural one —
 * gating only the picker would leave the write callable by an agent.
 */

export const affirmToolMap = {
  // settlement — the deposits, and what is inside one
  'settlement.getMany': 'list_affirm_settlements',
  'settlement.getEvents': 'list_affirm_settlement_events',
  // charge — what a customer financed
  'charge.getMany': 'list_affirm_charges',
  'charge.get': 'get_affirm_charge',
} as const

export type AffirmToolMap = typeof affirmToolMap
