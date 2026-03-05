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

export async function executeEstimate(
  operation: string,
  input: any,
): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'create': {
      const customerId = input.createEstimateCustomer
      if (!customerId)
        throw new BlockValidationError([
          { field: 'createEstimateCustomer', message: 'Customer is required.' },
        ])

      const itemId = input.createEstimateItemId
      const amount = Number(input.createEstimateAmount) || 0

      const line: Record<string, any> = {
        Amount: amount,
        DetailType: 'SalesItemLineDetail',
        Description: input.createEstimateDescription || '',
        SalesItemLineDetail: {
          ...(itemId && { ItemRef: { value: itemId } }),
        },
      }

      const body: Record<string, any> = {
        CustomerRef: { value: customerId },
        Line: [line],
        ...(input.createEstimateDocNumber && { DocNumber: input.createEstimateDocNumber }),
        ...(input.createEstimateTxnDate && { TxnDate: input.createEstimateTxnDate }),
        ...(input.createEstimateBillEmail && {
          BillEmail: { Address: input.createEstimateBillEmail },
        }),
        ...(input.createEstimateCustomerMemo && {
          CustomerMemo: { value: input.createEstimateCustomerMemo },
        }),
      }

      const result = await quickbooksApi<any>(realmId, '/estimate', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const estimate = result.Estimate
      return {
        estimateId: estimate.Id,
        docNumber: estimate.DocNumber ?? '',
        totalAmt: String(estimate.TotalAmt ?? 0),
        syncToken: estimate.SyncToken,
      }
    }

    case 'delete': {
      const id = input.deleteEstimateId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'deleteEstimateId', message: 'Estimate ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Estimate', id, credential, { sandbox })

      await quickbooksApi<any>(realmId, '/estimate?operation=delete', credential, {
        method: 'POST',
        body: { Id: id, SyncToken: syncToken },
        sandbox,
      })

      return { success: 'true' }
    }

    case 'get': {
      const id = input.getEstimateId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'getEstimateId', message: 'Estimate ID is required.' },
        ])

      const result = await quickbooksApi<any>(realmId, `/estimate/${id}`, credential, { sandbox })
      const e = result.Estimate

      return {
        estimateId: e.Id,
        docNumber: e.DocNumber ?? '',
        customerName: e.CustomerRef?.name ?? '',
        customerId: e.CustomerRef?.value ?? '',
        totalAmt: String(e.TotalAmt ?? 0),
        txnDate: e.TxnDate ?? '',
        emailStatus: e.EmailStatus ?? '',
        status: e.TxnStatus ?? '',
        raw: e,
      }
    }

    case 'getMany': {
      const returnAll = input.getManyEstimateReturnAll === true
      const limit = Number(input.getManyEstimateLimit) || 50
      const where = input.getManyEstimateQuery?.trim() || undefined

      const estimates = await quickbooksQuery<any>(realmId, 'Estimate', credential, {
        where,
        limit,
        returnAll,
        sandbox,
      })

      return {
        estimates: estimates,
        count: String(estimates.length),
      }
    }

    case 'send': {
      const id = input.sendEstimateId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'sendEstimateId', message: 'Estimate ID is required.' },
        ])

      const email = input.sendEstimateEmail?.trim()
      const sendPath = email
        ? `/estimate/${id}/send?sendTo=${encodeURIComponent(email)}`
        : `/estimate/${id}/send`

      const result = await quickbooksApi<any>(realmId, sendPath, credential, {
        method: 'POST',
        body: {},
        sandbox,
      })

      const e = result.Estimate
      return {
        estimateId: e.Id,
        emailStatus: e.EmailStatus ?? '',
      }
    }

    case 'update': {
      const id = input.updateEstimateId?.trim()
      if (!id)
        throw new BlockValidationError([
          { field: 'updateEstimateId', message: 'Estimate ID is required.' },
        ])

      const { syncToken } = await getSyncToken(realmId, 'Estimate', id, credential, { sandbox })

      const body: Record<string, any> = {
        sparse: true,
        Id: id,
        SyncToken: syncToken,
      }

      if (input.updateEstimateCustomer) {
        body.CustomerRef = { value: input.updateEstimateCustomer }
      }

      const itemId = input.updateEstimateItemId
      const amount = input.updateEstimateAmount
      if (itemId || amount !== undefined) {
        const line: Record<string, any> = {
          Amount: Number(amount) || 0,
          DetailType: 'SalesItemLineDetail',
          ...(input.updateEstimateDescription && { Description: input.updateEstimateDescription }),
          SalesItemLineDetail: {
            ...(itemId && { ItemRef: { value: itemId } }),
          },
        }
        body.Line = [line]
      }

      if (input.updateEstimateDocNumber) body.DocNumber = input.updateEstimateDocNumber
      if (input.updateEstimateTxnDate) body.TxnDate = input.updateEstimateTxnDate
      if (input.updateEstimateBillEmail) {
        body.BillEmail = { Address: input.updateEstimateBillEmail }
      }
      if (input.updateEstimateCustomerMemo) {
        body.CustomerMemo = { value: input.updateEstimateCustomerMemo }
      }

      const result = await quickbooksApi<any>(realmId, '/estimate', credential, {
        method: 'POST',
        body,
        sandbox,
      })

      const e = result.Estimate
      return {
        estimateId: e.Id,
        docNumber: e.DocNumber ?? '',
        customerName: e.CustomerRef?.name ?? '',
        customerId: e.CustomerRef?.value ?? '',
        totalAmt: String(e.TotalAmt ?? 0),
        txnDate: e.TxnDate ?? '',
        emailStatus: e.EmailStatus ?? '',
        status: e.TxnStatus ?? '',
        raw: e,
      }
    }

    default:
      throw new Error(`Unknown estimate operation: ${operation}`)
  }
}
