import { getOrganizationConnection, getOrganizationSettings } from '@auxx/sdk/server'
import { quickbooksApi, throwConnectionNotFound } from '../../shared/quickbooks-api'

async function getConnectionAndRealm() {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const realmId = connection.metadata?.realmId
  if (!realmId) throw new Error('QuickBooks realm ID not found. Please reconnect.')
  const settings = await getOrganizationSettings()
  const sandbox = settings?.sandbox === true
  return { credential: connection.value, realmId, sandbox }
}

export async function executeTransaction(
  operation: string,
  input: any,
): Promise<Record<string, any>> {
  const { credential, realmId, sandbox } = await getConnectionAndRealm()

  switch (operation) {
    case 'getReport': {
      const params = new URLSearchParams()

      const dateMacro = input.getReportDateMacro?.trim()
      const startDate = input.getReportStartDate?.trim()
      const endDate = input.getReportEndDate?.trim()

      if (startDate) {
        params.set('start_date', startDate)
        if (endDate) params.set('end_date', endDate)
      } else if (dateMacro) {
        params.set('date_macro', dateMacro)
      }

      const transactionType = input.getReportTransactionType?.trim()
      if (transactionType) params.set('transaction_type', transactionType)

      const groupBy = input.getReportGroupBy?.trim()
      if (groupBy) params.set('group_by', groupBy)

      const sortBy = input.getReportSortBy?.trim()
      if (sortBy) params.set('sort_by', sortBy)

      const sortOrder = input.getReportSortOrder?.trim()
      if (sortOrder) params.set('sort_order', sortOrder)

      const columns = input.getReportColumns?.trim()
      if (columns) params.set('columns', columns)

      const queryString = params.toString()
      const path = `/reports/TransactionList${queryString ? `?${queryString}` : ''}`

      const result = await quickbooksApi<any>(realmId, path, credential, { sandbox })

      const report = result
      const reportColumns =
        report.Columns?.Column?.map((c: any) => c.ColTitle) ?? []
      const rows = report.Rows?.Row ?? []

      const transactions = rows.flatMap((row: any) => {
        if (row.ColData) {
          const entry: Record<string, string> = {}
          reportColumns.forEach((col: string, i: number) => {
            entry[col] = row.ColData[i]?.value ?? ''
          })
          return [entry]
        }
        // Handle grouped rows
        if (row.Rows?.Row) {
          return row.Rows.Row.filter((r: any) => r.ColData).map((r: any) => {
            const entry: Record<string, string> = {}
            reportColumns.forEach((col: string, i: number) => {
              entry[col] = r.ColData[i]?.value ?? ''
            })
            if (row.Header?.ColData?.[0]?.value) {
              entry['Group'] = row.Header.ColData[0].value
            }
            return entry
          })
        }
        return []
      })

      return {
        transactions: transactions,
        count: String(transactions.length),
      }
    }

    default:
      throw new Error(`Unknown transaction operation: ${operation}`)
  }
}
