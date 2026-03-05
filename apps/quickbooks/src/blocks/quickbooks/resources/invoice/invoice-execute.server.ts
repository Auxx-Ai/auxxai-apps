import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { BlockValidationError } from '@auxx/sdk/shared'
import {
  quickbooksApi,
  quickbooksQuery,
  getSyncToken,
  throwConnectionNotFound,
  buildAddress,
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

export async function executeInvoice(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const customerId = input.createInvoiceCustomer?.trim()
      if (!customerId)
        throw new BlockValidationError([
          { field: 'createInvoiceCustomer', message: 'Customer is required.' },
        ])

      const lines: Array<Record<string, any>> = []
      const amount = Number.parseFloat(input.createInvoiceAmount)
      if (amount || input.createInvoiceItemId) {
        lines.push({
          Amount: amount || 0,
          Description: input.createInvoiceDescription || '',
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ...(input.createInvoiceItemId && {
              ItemRef: { value: input.createInvoiceItemId },
            }),
            ...(input.createInvoiceQuantity && {
              Qty: Number.parseFloat(input.createInvoiceQuantity) || 1,
            }),
          },
        })
      }

      const body: Record<string, any> = {
        CustomerRef: { value: customerId },
        ...(lines.length > 0 && { Line: lines }),
        ...(input.createInvoiceDocNumber && { DocNumber: input.createInvoiceDocNumber }),
        ...(input.createInvoiceDueDate && { DueDate: input.createInvoiceDueDate }),
        ...(input.createInvoiceTxnDate && { TxnDate: input.createInvoiceTxnDate }),
        ...(input.createInvoiceBillEmail && {
          BillEmail: { Address: input.createInvoiceBillEmail },
        }),
        ...(input.createInvoiceCustomerMemo && {
          CustomerMemo: { value: input.createInvoiceCustomerMemo },
        }),
      }

      const addr = buildAddress({
        line1: input.createInvoiceBillAddrLine1,
        city: input.createInvoiceBillAddrCity,
        postalCode: input.createInvoiceBillAddrPostalCode,
        state: input.createInvoiceBillAddrState,
      })
      if (addr) body.BillAddr = addr

      const result = await quickbooksApi<any>(realmId, '/invoice', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const inv = result.Invoice
      return {
        invoiceId: inv.Id,
        docNumber: inv.DocNumber ?? '',
        totalAmt: String(inv.TotalAmt ?? 0),
        balance: String(inv.Balance ?? 0),
        dueDate: inv.DueDate ?? '',
        syncToken: inv.SyncToken,
      }
    }

    case 'delete': {
      const id = input.deleteInvoiceId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'deleteInvoiceId', message: 'Invoice ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Invoice', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/invoice?operation=delete', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    case 'get': {
      const id = input.getInvoiceId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getInvoiceId', message: 'Invoice ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/invoice/${id}`, credential, { sandbox })
      const inv = result.Invoice

      return {
        invoiceId: inv.Id,
        docNumber: inv.DocNumber ?? '',
        customerName: inv.CustomerRef?.name ?? '',
        customerId: inv.CustomerRef?.value ?? '',
        totalAmt: String(inv.TotalAmt ?? 0),
        balance: String(inv.Balance ?? 0),
        dueDate: inv.DueDate ?? '',
        txnDate: inv.TxnDate ?? '',
        emailStatus: inv.EmailStatus ?? '',
        status: inv.Balance === 0 ? 'Paid' : 'Open',
        raw: inv,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyInvoiceReturnAll === true
      const limit = Number(input.getManyInvoiceLimit) || 50
      const where = input.getManyInvoiceQuery?.trim() || undefined

      const invoices = await quickbooksQuery<any>(realmId, 'Invoice', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        invoices: invoices,
        count: String(invoices.length),
      }
    }

    case 'send': {
      const id = input.sendInvoiceId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'sendInvoiceId', message: 'Invoice ID is required.' },
        ])

      const email = input.sendInvoiceEmail?.trim()
      const sendPath = email
        ? `/invoice/${id}/send?sendTo=${encodeURIComponent(email)}`
        : `/invoice/${id}/send`

      const result = await quickbooksApi<any>(realmId, sendPath, credential, {
        method: 'POST',
        body: {},
        sandbox,
      })

      const inv = result.Invoice
      return {
        invoiceId: inv.Id,
        emailStatus: inv.EmailStatus ?? '',
      }
    }

    case 'update': {
      const id = input.updateInvoiceId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateInvoiceId', message: 'Invoice ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Invoice', id, credential, { sandbox })

      const lines: Array<Record<string, any>> = []
      const amount = Number.parseFloat(input.updateInvoiceAmount)
      if (amount || input.updateInvoiceItemId) {
        lines.push({
          Amount: amount || 0,
          Description: input.updateInvoiceDescription || '',
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ...(input.updateInvoiceItemId && {
              ItemRef: { value: input.updateInvoiceItemId },
            }),
            ...(input.updateInvoiceQuantity && {
              Qty: Number.parseFloat(input.updateInvoiceQuantity) || 1,
            }),
          },
        })
      }

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
        ...(input.updateInvoiceCustomer && {
          CustomerRef: { value: input.updateInvoiceCustomer },
        }),
        ...(lines.length > 0 && { Line: lines }),
        ...(input.updateInvoiceDocNumber && { DocNumber: input.updateInvoiceDocNumber }),
        ...(input.updateInvoiceDueDate && { DueDate: input.updateInvoiceDueDate }),
        ...(input.updateInvoiceTxnDate && { TxnDate: input.updateInvoiceTxnDate }),
        ...(input.updateInvoiceBillEmail && {
          BillEmail: { Address: input.updateInvoiceBillEmail },
        }),
        ...(input.updateInvoiceCustomerMemo && {
          CustomerMemo: { value: input.updateInvoiceCustomerMemo },
        }),
      }

      const addr = buildAddress({
        line1: input.updateInvoiceBillAddrLine1,
        city: input.updateInvoiceBillAddrCity,
        postalCode: input.updateInvoiceBillAddrPostalCode,
        state: input.updateInvoiceBillAddrState,
      })
      if (addr) body.BillAddr = addr

      const result = await quickbooksApi<any>(realmId, '/invoice', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const inv = result.Invoice
      return {
        invoiceId: inv.Id,
        docNumber: inv.DocNumber ?? '',
        customerName: inv.CustomerRef?.name ?? '',
        customerId: inv.CustomerRef?.value ?? '',
        totalAmt: String(inv.TotalAmt ?? 0),
        balance: String(inv.Balance ?? 0),
        dueDate: inv.DueDate ?? '',
        txnDate: inv.TxnDate ?? '',
        emailStatus: inv.EmailStatus ?? '',
        status: inv.Balance === 0 ? 'Paid' : 'Open',
        raw: inv,
      }
    }

    case 'void': {
      const id = input.voidInvoiceId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'voidInvoiceId', message: 'Invoice ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Invoice', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/invoice?operation=void', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown invoice operation: ${operation}`)
  }
}
