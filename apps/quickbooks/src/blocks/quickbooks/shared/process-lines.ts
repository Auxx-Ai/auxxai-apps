export function processLineItems(
  lines: Array<{
    detailType?: string
    amount: number
    description?: string
    itemId?: string
    accountId?: string
    quantity?: number
  }>,
  resource: 'bill' | 'estimate' | 'invoice',
): Array<Record<string, any>> {
  return lines.map((line, i) => {
    const base = {
      Amount: line.amount,
      Description: line.description || '',
      LineNum: i + 1,
    }

    if (resource === 'bill') {
      if (line.detailType === 'ItemBasedExpenseLineDetail') {
        return {
          ...base,
          DetailType: 'ItemBasedExpenseLineDetail',
          ItemBasedExpenseLineDetail: {
            ItemRef: { value: line.itemId },
          },
        }
      }
      return {
        ...base,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: line.accountId },
        },
      }
    }

    // Estimate and Invoice use SalesItemLineDetail
    return {
      ...base,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        ItemRef: { value: line.itemId },
        Qty: line.quantity,
      },
    }
  })
}
