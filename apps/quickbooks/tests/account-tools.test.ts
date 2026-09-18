// apps/quickbooks/tests/account-tools.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/blocks/quickbooks/shared/quickbooks-api', () => ({
  quickbooksApi: vi.fn(),
  quickbooksQuery: vi.fn(),
}))
vi.mock('../src/tools/shared/connection', () => ({
  getQuickbooksConnection: vi.fn(async () => ({
    credential: 'token',
    realmId: 'company-A',
    sandbox: true,
  })),
  invalidInput: (message: string) => {
    const err = new Error(message) as Error & { code: string }
    err.code = 'INVALID_INPUT'
    throw err
  },
}))

import { quickbooksApi, quickbooksQuery } from '../src/blocks/quickbooks/shared/quickbooks-api'
import createAccount from '../src/tools/create-quickbooks-account.tool.server'
import listAccounts from '../src/tools/list-quickbooks-accounts.tool.server'
import { mapAccount } from '../src/tools/shared/map-account'

beforeEach(() => vi.clearAllMocks())

describe('mapAccount', () => {
  it('reports parentId only when SubAccount is true', () => {
    const sub = mapAccount({
      Id: '90',
      Name: 'Card Clearing',
      FullyQualifiedName: 'Other Current Assets:Card Clearing',
      SubAccount: true,
      ParentRef: { value: '80' },
      AccountType: 'Other Current Asset',
      Classification: 'Asset',
    })
    expect(sub.parentId).toBe('80')
    expect(sub.subAccount).toBe(true)

    const topLevel = mapAccount({
      Id: '80',
      Name: 'Other Current Assets',
      SubAccount: false,
      ParentRef: { value: '1' }, // stale/ignored when SubAccount is false
      AccountType: 'Other Current Asset',
      Classification: 'Asset',
    })
    expect(topLevel.parentId).toBeNull()
    expect(topLevel.subAccount).toBe(false)
  })
})

describe('list_quickbooks_accounts', () => {
  it('carries parentId and subAccount through from the raw QuickBooks account', async () => {
    vi.mocked(quickbooksQuery).mockResolvedValue([
      { Id: '80', Name: 'Other Current Assets', SubAccount: false, AccountType: 'Other Current Asset' },
      {
        Id: '90',
        Name: 'Card Clearing',
        FullyQualifiedName: 'Other Current Assets:Card Clearing',
        SubAccount: true,
        ParentRef: { value: '80' },
        AccountType: 'Other Current Asset',
      },
    ])

    const { accounts } = await listAccounts()

    expect(accounts).toEqual([
      expect.objectContaining({ id: '80', parentId: null, subAccount: false }),
      expect.objectContaining({ id: '90', parentId: '80', subAccount: true }),
    ])
  })
})

describe('create_quickbooks_account with parentId', () => {
  function mockParentFetch(parent: Record<string, unknown> | null) {
    vi.mocked(quickbooksApi).mockImplementation(async (_realmId, path) => {
      if (path === '/account/80') {
        if (!parent) throw new Error('404')
        return { Account: parent }
      }
      throw new Error(`unexpected quickbooksApi call: ${path}`)
    })
  }

  it('requires accountType (not just accountSubType) alongside parentId', async () => {
    await expect(
      createAccount({ name: 'Card Clearing', accountSubType: 'OtherCurrentAssets', parentId: '80' })
    ).rejects.toThrow('accountType is required alongside parentId')
    expect(quickbooksApi).not.toHaveBeenCalled()
  })

  it('refuses when the parent account does not exist', async () => {
    mockParentFetch(null)

    await expect(
      createAccount({
        name: 'Card Clearing',
        accountType: 'Other Current Asset',
        parentId: '80',
        reuseExisting: false,
      })
    ).rejects.toThrow('does not exist')
  })

  it('refuses an inactive parent', async () => {
    mockParentFetch({ Id: '80', Name: 'Old Parent', Active: false, AccountType: 'Other Current Asset' })

    await expect(
      createAccount({
        name: 'Card Clearing',
        accountType: 'Other Current Asset',
        parentId: '80',
        reuseExisting: false,
      })
    ).rejects.toThrow('is inactive')
  })

  it('refuses a parent whose AccountType differs from the one requested', async () => {
    mockParentFetch({ Id: '80', Name: 'Sales', Active: true, AccountType: 'Income' })

    await expect(
      createAccount({
        name: 'Consulting',
        accountType: 'Other Current Asset',
        parentId: '80',
        reuseExisting: false,
      })
    ).rejects.toThrow("must share its parent's AccountType")
  })

  it('sends ParentRef and SubAccount: true once the parent checks pass', async () => {
    vi.mocked(quickbooksApi).mockImplementation(async (_realmId, path, _credential, options) => {
      if (path === '/account/80') {
        return {
          Account: {
            Id: '80',
            Name: 'Other Current Assets',
            Active: true,
            AccountType: 'Other Current Asset',
          },
        }
      }
      if (path === '/account' && options?.method === 'POST') {
        return {
          Account: {
            Id: '91',
            Name: 'Card Clearing',
            FullyQualifiedName: 'Other Current Assets:Card Clearing',
            SubAccount: true,
            ParentRef: { value: '80' },
            AccountType: 'Other Current Asset',
          },
        }
      }
      throw new Error(`unexpected quickbooksApi call: ${path}`)
    })

    const result = await createAccount({
      name: 'Card Clearing',
      accountType: 'Other Current Asset',
      parentId: '80',
      reuseExisting: false,
    })

    expect(quickbooksApi).toHaveBeenCalledWith(
      'company-A',
      '/account',
      'token',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          Name: 'Card Clearing',
          ParentRef: { value: '80' },
          SubAccount: true,
        }),
      })
    )
    expect(result.account).toEqual(
      expect.objectContaining({ id: '91', parentId: '80', subAccount: true })
    )
  })

  it('does not match a same-named account under a different parent when parentId is given', async () => {
    vi.mocked(quickbooksQuery).mockResolvedValue([
      {
        Id: '50',
        Name: 'Card Clearing',
        FullyQualifiedName: 'Other Bank Accounts:Card Clearing',
        SubAccount: true,
        ParentRef: { value: '40' },
        AccountType: 'Other Current Asset',
      },
    ])
    vi.mocked(quickbooksApi).mockImplementationOnce(async () => ({
      Account: { Id: '80', Name: 'Other Current Assets', Active: true, AccountType: 'Other Current Asset' },
    }))
    vi.mocked(quickbooksApi).mockImplementationOnce(async () => ({
      Account: {
        Id: '92',
        Name: 'Card Clearing',
        FullyQualifiedName: 'Other Current Assets:Card Clearing',
        SubAccount: true,
        ParentRef: { value: '80' },
        AccountType: 'Other Current Asset',
      },
    }))

    const result = await createAccount({
      name: 'Card Clearing',
      accountType: 'Other Current Asset',
      parentId: '80',
    })

    expect(result.outcome).toBe('created')
    expect(result.account.id).toBe('92')
  })

  it('reuses a same-named account that is already under the requested parent', async () => {
    mockParentFetch({ Id: '80', Name: 'Other Current Assets', Active: true, AccountType: 'Other Current Asset' })
    vi.mocked(quickbooksQuery).mockResolvedValue([
      {
        Id: '92',
        Name: 'Card Clearing',
        FullyQualifiedName: 'Other Current Assets:Card Clearing',
        SubAccount: true,
        ParentRef: { value: '80' },
        AccountType: 'Other Current Asset',
      },
    ])

    const result = await createAccount({
      name: 'Card Clearing',
      accountType: 'Other Current Asset',
      parentId: '80',
    })

    expect(result).toEqual(
      expect.objectContaining({ outcome: 'existing', matchedOn: 'name', account: expect.objectContaining({ id: '92' }) })
    )
    // Reuse found a match — no create call should have gone out.
    expect(quickbooksApi).toHaveBeenCalledTimes(1)
  })
})

describe('create_quickbooks_account without parentId', () => {
  it('prefers the top-level match when a sub-account shares the same leaf name', async () => {
    vi.mocked(quickbooksQuery).mockResolvedValue([
      { Id: '10', Name: 'Consulting', FullyQualifiedName: 'Consulting', SubAccount: false, AccountType: 'Income' },
      {
        Id: '82',
        Name: 'Consulting',
        FullyQualifiedName: 'Income:Sales:Consulting',
        SubAccount: true,
        ParentRef: { value: '11' },
        AccountType: 'Income',
      },
    ])

    const result = await createAccount({ name: 'Consulting', accountType: 'Income' })

    expect(result).toEqual(
      expect.objectContaining({ outcome: 'existing', matchedOn: 'name', account: expect.objectContaining({ id: '10' }) })
    )
    expect(quickbooksApi).not.toHaveBeenCalled()
  })
})
