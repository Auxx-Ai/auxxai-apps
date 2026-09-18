// apps/quickbooks/tests/find-quickbooks-item.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksQuery: vi.fn(),
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
}))

import { quickbooksQuery } from '../src/blocks/quickbooks/shared/quickbooks-api'
import findItem from '../src/tools/find-quickbooks-item.tool.server'

beforeEach(() => vi.clearAllMocks())

describe('find_quickbooks_item', () => {
  it('queries Item by exact name and maps the income account', async () => {
    vi.mocked(quickbooksQuery).mockResolvedValue([
      { Id: '61', Name: 'auxx:79', IncomeAccountRef: { value: '79' }, SyncToken: '0' },
    ])

    const result = await findItem({ name: 'auxx:79' })

    expect(quickbooksQuery).toHaveBeenCalledWith(
      'company-A',
      'Item',
      'token',
      expect.objectContaining({ where: "Name = 'auxx:79'", limit: 1, sandbox: true })
    )
    expect(result).toEqual({
      status: 'Found',
      itemId: '61',
      name: 'auxx:79',
      incomeAccountId: '79',
      syncToken: '0',
    })
  })

  it('answers NotFound rather than throwing on a miss', async () => {
    vi.mocked(quickbooksQuery).mockResolvedValue([])

    await expect(findItem({ name: 'no such item' })).resolves.toEqual({ status: 'NotFound' })
  })
})
