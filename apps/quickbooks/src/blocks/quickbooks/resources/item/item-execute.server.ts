import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  throwConnectionNotFound,
} from '../../shared/quickbooks-api'

async function getConnectionAndRealm() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const realmId = connection.metadata?.realmId
  if (!realmId) throw new Error('QuickBooks realm ID not found. Please reconnect.')
  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true
  return { credential: connection.value, realmId, sandbox }
}

export async function executeItem(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'get': {
      const id = input.getItemId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getItemId', message: 'Item ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/item/${id}`, credential, { sandbox })
      const item = result.Item

      return {
        itemId: item.Id,
        name: item.Name ?? '',
        type: item.Type ?? '',
        unitPrice: String(item.UnitPrice ?? 0),
        description: item.Description ?? '',
        active: String(item.Active ?? true),
        raw: item,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyItemReturnAll === true
      const limit = Number(input.getManyItemLimit) || 50
      const where = input.getManyItemQuery?.trim() || undefined

      const items = await quickbooksQuery<any>(realmId, 'Item', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        items: items,
        count: String(items.length),
      }
    }

    default:
      throw new Error(`Unknown item operation: ${operation}`)
  }
}
