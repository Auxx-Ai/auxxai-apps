// src/tools/create-quickbooks-item.tool.server.ts

import { quickbooksApi } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection, invalidInput } from './shared/connection'
import { mapItemDetail, type MappedItemDetail } from './shared/map-item'
import { validateQbId } from './shared/qql-builder'

interface CreateQuickbooksItemInput {
  name: string
  incomeAccountId: string
  description?: string
  unitPrice?: number
  taxable?: boolean
}

export default async function createQuickbooksItem(
  input: CreateQuickbooksItemInput
): Promise<MappedItemDetail> {
  const name = input.name?.trim()
  if (!name) invalidInput('name is required.')
  validateQbId(input.incomeAccountId, 'incomeAccountId')

  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  const body: Record<string, unknown> = {
    Name: name,
    Type: 'Service',
    IncomeAccountRef: { value: input.incomeAccountId },
    ...(input.description && { Description: input.description }),
    ...(input.unitPrice != null && { UnitPrice: input.unitPrice }),
    ...(input.taxable != null && { Taxable: input.taxable }),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await quickbooksApi<any>(realmId, '/item', credential, {
    method: 'POST',
    body,
    sandbox,
  })
  return mapItemDetail(result.Item)
}
