import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import { quickbooksApi, quickbooksQuery, throwConnectionNotFound } from '../../shared/quickbooks-api'

async function getConnectionAndRealm() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const realmId = connection.metadata?.realmId
  if (!realmId) throw new Error('QuickBooks realm ID not found. Please reconnect.')
  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true
  return { credential: connection.value, realmId, sandbox }
}

export async function executePurchase(
  operation: string,
  input: any,
): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'get': {
      const id = input.getPurchaseId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getPurchaseId', message: 'Purchase ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/purchase/${id}`, credential, { sandbox })
      const p = result.Purchase

      return {
        purchaseId: p.Id,
        totalAmt: String(p.TotalAmt ?? 0),
        txnDate: p.TxnDate ?? '',
        accountName: p.AccountRef?.name ?? '',
        raw: p,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyPurchaseReturnAll === true
      const limit = Number(input.getManyPurchaseLimit) || 50
      const where = input.getManyPurchaseQuery?.trim() || undefined

      const purchases = await quickbooksQuery<any>(realmId, 'Purchase', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        purchases: purchases,
        count: String(purchases.length),
      }
    }

    default:
      throw new Error(`Unknown purchase operation: ${operation}`)
  }
}
