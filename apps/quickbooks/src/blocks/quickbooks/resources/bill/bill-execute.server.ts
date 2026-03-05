import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  getSyncToken,
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

export async function executeBill(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const vendorId = input.createBillVendor?.trim()
      if (!vendorId)
        throw new BlockValidationError([
          { field: 'createBillVendor', message: 'Vendor is required.' },
        ])

      const detailType = input.createBillDetailType || 'AccountBasedExpenseLineDetail'
      const amount = Number(input.createBillAmount) || 0

      const lineDetail: Record<string, any> = {}
      if (detailType === 'AccountBasedExpenseLineDetail') {
        const accountId = input.createBillAccountId?.trim()
        if (!accountId)
          throw new BlockValidationError([
            { field: 'createBillAccountId', message: 'Account is required for account-based expenses.' },
          ])
        lineDetail.AccountBasedExpenseLineDetail = {
          AccountRef: { value: accountId },
        }
      } else {
        const itemId = input.createBillItemId?.trim()
        if (!itemId)
          throw new BlockValidationError([
            { field: 'createBillItemId', message: 'Item is required for item-based expenses.' },
          ])
        lineDetail.ItemBasedExpenseLineDetail = {
          ItemRef: { value: itemId },
        }
      }

      const line: Record<string, any> = {
        DetailType: detailType,
        Amount: amount,
        ...lineDetail,
      }

      if (input.createBillDescription) {
        line.Description = input.createBillDescription
      }

      const body: Record<string, any> = {
        VendorRef: { value: vendorId },
        Line: [line],
        ...(input.createBillDueDate && { DueDate: input.createBillDueDate }),
        ...(input.createBillTxnDate && { TxnDate: input.createBillTxnDate }),
      }

      const result = await quickbooksApi<any>(realmId, '/bill', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const bill = result.Bill
      return {
        billId: bill.Id,
        totalAmt: String(bill.TotalAmt ?? 0),
        balance: String(bill.Balance ?? 0),
        vendorName: bill.VendorRef?.name ?? '',
        syncToken: bill.SyncToken,
      }
    }

    case 'delete': {
      const id = input.deleteBillId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'deleteBillId', message: 'Bill ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Bill', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/bill?operation=delete', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    case 'get': {
      const id = input.getBillId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getBillId', message: 'Bill ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/bill/${id}`, credential, { sandbox })
      const b = result.Bill

      return {
        billId: b.Id,
        totalAmt: String(b.TotalAmt ?? 0),
        balance: String(b.Balance ?? 0),
        vendorName: b.VendorRef?.name ?? '',
        dueDate: b.DueDate ?? '',
        txnDate: b.TxnDate ?? '',
        raw: b,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyBillReturnAll === true
      const limit = Number(input.getManyBillLimit) || 50
      const where = input.getManyBillQuery?.trim() || undefined

      const bills = await quickbooksQuery<any>(realmId, 'Bill', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        bills: bills,
        count: String(bills.length),
      }
    }

    case 'update': {
      const id = input.updateBillId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateBillId', message: 'Bill ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Bill', id, credential, { sandbox })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
        ...(input.updateBillVendor && { VendorRef: { value: input.updateBillVendor } }),
        ...(input.updateBillDueDate && { DueDate: input.updateBillDueDate }),
        ...(input.updateBillTxnDate && { TxnDate: input.updateBillTxnDate }),
      }

      const detailType = input.updateBillDetailType
      const amount = input.updateBillAmount

      if (detailType || amount !== undefined) {
        const lineDetail: Record<string, any> = {}
        const resolvedDetailType = detailType || 'AccountBasedExpenseLineDetail'

        if (resolvedDetailType === 'AccountBasedExpenseLineDetail' && input.updateBillAccountId) {
          lineDetail.AccountBasedExpenseLineDetail = {
            AccountRef: { value: input.updateBillAccountId },
          }
        } else if (
          resolvedDetailType === 'ItemBasedExpenseLineDetail' &&
          input.updateBillItemId
        ) {
          lineDetail.ItemBasedExpenseLineDetail = {
            ItemRef: { value: input.updateBillItemId },
          }
        }

        if (Object.keys(lineDetail).length > 0 || amount !== undefined) {
          const line: Record<string, any> = {
            DetailType: resolvedDetailType,
            ...(amount !== undefined && { Amount: Number(amount) }),
            ...lineDetail,
          }

          if (input.updateBillDescription) {
            line.Description = input.updateBillDescription
          }

          body.Line = [line]
        }
      }

      const result = await quickbooksApi<any>(realmId, '/bill', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const b = result.Bill
      return {
        billId: b.Id,
        totalAmt: String(b.TotalAmt ?? 0),
        balance: String(b.Balance ?? 0),
        vendorName: b.VendorRef?.name ?? '',
        dueDate: b.DueDate ?? '',
        txnDate: b.TxnDate ?? '',
        raw: b,
      }
    }

    default:
      throw new Error(`Unknown bill operation: ${operation}`)
  }
}
