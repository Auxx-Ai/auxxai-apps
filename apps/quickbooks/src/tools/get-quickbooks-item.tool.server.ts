// src/tools/get-quickbooks-item.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapItemDetail, type MappedItemDetail } from './shared/map-item'
import { validateQbId } from './shared/qql-builder'

interface GetQuickbooksItemInput {
  itemId: string
}

export default async function getQuickbooksItem(
  input: GetQuickbooksItemInput
): Promise<MappedItemDetail> {
  const id = input.itemId?.trim()
  if (!id) invalidInput('itemId is required.')
  validateQbId(id, 'itemId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, `/item/${id}`, credential, { sandbox })
  return mapItemDetail(result.Item)
}
