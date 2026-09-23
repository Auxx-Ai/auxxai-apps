// src/tools/get-quickbooks-purchase.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { isEntityNotFoundFault } from './shared/fault-convergence'
import { type MappedPurchase, mapPurchase } from './shared/map-purchase'
import { validateQbId } from './shared/qql-builder'

interface GetPurchaseInput {
  purchaseId: string
}

type GetPurchaseOutput = ({ status: 'Found' } & MappedPurchase) | { status: 'NotFound' }

export default async function getQuickbooksPurchase(
  input: GetPurchaseInput
): Promise<GetPurchaseOutput> {
  const id = input.purchaseId?.trim()
  if (!id) invalidInput('purchaseId is required.')
  validateQbId(id, 'purchaseId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await quickbooksApi<any>(realmId, `/purchase/${id}`, credential, { sandbox })
    return { status: 'Found', ...mapPurchase(result?.Purchase) }
  } catch (error) {
    if (isEntityNotFoundFault(error)) return { status: 'NotFound' }
    throw error
  }
}
