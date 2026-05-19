// src/tools/shared/properties-to-notion.ts

/**
 * Convert the tool surface's typed-discriminated property entries into
 * Notion's nested API shape. Kept separate from the workflow block's
 * `toNotionProperties` (which converts flat string KV pairs) — different LLM
 * vs builder ergonomics.
 *
 * See plans/kopilot/apps/notion-overhaul.md §4.9, §7, §10.
 */

import { BlockRuntimeError } from '@auxx/sdk/shared'

export type TypedPropertyEntry =
  | { name: string; type: 'title'; value: string }
  | { name: string; type: 'rich_text'; value: string }
  | { name: string; type: 'number'; value: number }
  | { name: string; type: 'select'; value: string }
  | { name: string; type: 'multi_select'; value: string[] }
  | { name: string; type: 'status'; value: string }
  | { name: string; type: 'date'; value: string }
  | { name: string; type: 'checkbox'; value: boolean }
  | { name: string; type: 'url'; value: string }
  | { name: string; type: 'email'; value: string }
  | { name: string; type: 'phone_number'; value: string }
  | { name: string; type: 'people'; value: string[] }
  | { name: string; type: 'relation'; value: string[] }
  | { name: string; type: 'files'; value: string[] }

interface DatabaseProperty {
  type: string
  options?: string[] | null
  writable: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatEntry(entry: TypedPropertyEntry): any {
  switch (entry.type) {
    case 'title':
      return { title: [{ text: { content: entry.value } }] }
    case 'rich_text':
      return { rich_text: [{ text: { content: entry.value } }] }
    case 'number':
      return { number: entry.value }
    case 'select':
      return { select: { name: entry.value } }
    case 'multi_select':
      return { multi_select: entry.value.map((name) => ({ name })) }
    case 'status':
      return { status: { name: entry.value } }
    case 'date':
      return { date: { start: entry.value } }
    case 'checkbox':
      return { checkbox: entry.value }
    case 'url':
      return { url: entry.value }
    case 'email':
      return { email: entry.value }
    case 'phone_number':
      return { phone_number: entry.value }
    case 'people':
      return { people: entry.value.map((id) => ({ id })) }
    case 'relation':
      return { relation: entry.value.map((id) => ({ id })) }
    case 'files':
      return {
        files: entry.value.map((url) => ({
          type: 'external',
          name: url.split('/').pop() ?? 'File',
          external: { url },
        })),
      }
    default: {
      // Exhaustiveness: should be unreachable per the discriminated union.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = entry as any
      throw new BlockRuntimeError(`Unsupported property type: ${e?.type}`, 'INVALID_PROPERTY_TYPE')
    }
  }
}

/**
 * Re-validate the typed entries against the live database schema. Catches:
 *  - properties that don't exist in the database
 *  - select / multi_select / status with option names not in the schema
 *  - non-writable property targets (formula, rollup, created_time, …)
 *
 * The discriminator handles raw-type mismatches at parse time; this layer is
 * for option-name and schema-conformance errors that need the live schema.
 */
export function buildNotionProperties(
  entries: TypedPropertyEntry[],
  schema: Record<string, DatabaseProperty>
): Record<string, unknown> {
  const properties: Record<string, unknown> = {}

  for (const entry of entries) {
    const schemaProp = schema[entry.name]
    if (!schemaProp) {
      throw new BlockRuntimeError(
        `Property "${entry.name}" does not exist on the database.`,
        'INVALID_PROPERTY'
      )
    }
    if (!schemaProp.writable) {
      throw new BlockRuntimeError(
        `Property "${entry.name}" is not writable (type: ${schemaProp.type}).`,
        'INVALID_PROPERTY'
      )
    }
    if (schemaProp.type !== entry.type) {
      throw new BlockRuntimeError(
        `Property "${entry.name}" expects type "${schemaProp.type}" but received "${entry.type}".`,
        'INVALID_PROPERTY_TYPE'
      )
    }

    if (entry.type === 'select' || entry.type === 'status') {
      const allowed = schemaProp.options ?? []
      if (allowed.length > 0 && !allowed.includes(entry.value)) {
        throw new BlockRuntimeError(
          `Option "${entry.value}" is not valid for property "${entry.name}". Allowed: ${allowed.join(', ')}.`,
          'INVALID_OPTION'
        )
      }
    }
    if (entry.type === 'multi_select') {
      const allowed = schemaProp.options ?? []
      if (allowed.length > 0) {
        for (const v of entry.value) {
          if (!allowed.includes(v)) {
            throw new BlockRuntimeError(
              `Option "${v}" is not valid for property "${entry.name}". Allowed: ${allowed.join(', ')}.`,
              'INVALID_OPTION'
            )
          }
        }
      }
    }

    properties[entry.name] = formatEntry(entry)
  }

  return properties
}
