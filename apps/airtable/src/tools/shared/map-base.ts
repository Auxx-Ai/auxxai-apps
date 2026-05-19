// src/tools/shared/map-base.ts

/**
 * Tool-surface mapper for an Airtable base listing. Returns structured base
 * metadata (id, name, permission level) for `list_airtable_bases`.
 */
export interface MappedAirtableBase {
  baseId: string
  name: string
  permissionLevel: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBase(base: any): MappedAirtableBase {
  return {
    baseId: base.id ?? '',
    name: base.name ?? '',
    permissionLevel: base.permissionLevel ?? '',
  }
}
