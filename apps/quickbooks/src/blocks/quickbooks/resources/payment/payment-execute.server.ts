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

export async function executePayment(operation: string, input: any): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const customerId = input.createPaymentCustomer
      if (!customerId)
        throw new BlockValidationError([
          { field: 'createPaymentCustomer', message: 'Customer is required.' },
        ])

      const totalAmt = input.createPaymentTotalAmt
      if (totalAmt === undefined || totalAmt === null)
        throw new BlockValidationError([
          { field: 'createPaymentTotalAmt', message: 'Total amount is required.' },
        ])

      const body: Record<string, any> = {
        CustomerRef: { value: customerId },
        TotalAmt: totalAmt,
      }

      if (input.createPaymentTxnDate?.trim()) {
        body.TxnDate = input.createPaymentTxnDate.trim()
      }

      const result = await quickbooksApi<any>(realmId, '/payment', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const payment = result.Payment
      return {
        paymentId: payment.Id,
        totalAmt: String(payment.TotalAmt),
        customerId: payment.CustomerRef?.value ?? '',
        syncToken: payment.SyncToken,
      }
    }

    case 'delete': {
      const id = input.deletePaymentId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'deletePaymentId', message: 'Payment ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Payment', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/payment?operation=delete', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    case 'get': {
      const id = input.getPaymentId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getPaymentId', message: 'Payment ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/payment/${id}`, credential, { sandbox })
      const p = result.Payment

      return {
        paymentId: p.Id,
        totalAmt: String(p.TotalAmt ?? 0),
        customerName: p.CustomerRef?.name ?? '',
        customerId: p.CustomerRef?.value ?? '',
        txnDate: p.TxnDate ?? '',
        raw: p,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyPaymentReturnAll === true
      const limit = Number(input.getManyPaymentLimit) || 50
      const where = input.getManyPaymentQuery?.trim() || undefined

      const payments = await quickbooksQuery<any>(realmId, 'Payment', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        payments: payments,
        count: String(payments.length),
      }
    }

    case 'send': {
      const id = input.sendPaymentId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'sendPaymentId', message: 'Payment ID is required.' },
        ])

      const email = input.sendPaymentEmail?.trim()
      const sendTo = email ? `?sendTo=${encodeURIComponent(email)}` : ''

      await quickbooksApi<any>(realmId, `/payment/${id}/send${sendTo}`, credential, {
        method: 'POST',
        body: {},
        sandbox,
      })

      return { paymentId: id }
    }

    case 'update': {
      const id = input.updatePaymentId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updatePaymentId', message: 'Payment ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Payment', id, credential, { sandbox })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
      }

      if (input.updatePaymentTxnDate?.trim()) {
        body.TxnDate = input.updatePaymentTxnDate.trim()
      }

      const result = await quickbooksApi<any>(realmId, '/payment', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const p = result.Payment
      return {
        paymentId: p.Id,
        totalAmt: String(p.TotalAmt ?? 0),
        customerName: p.CustomerRef?.name ?? '',
        customerId: p.CustomerRef?.value ?? '',
        txnDate: p.TxnDate ?? '',
        raw: p,
      }
    }

    case 'void': {
      const id = input.voidPaymentId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'voidPaymentId', message: 'Payment ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Payment', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/payment?operation=void', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    default:
      throw new Error(`Unknown payment operation: ${operation}`)
  }
}
