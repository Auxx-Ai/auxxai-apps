import { Workflow } from '@auxx/sdk'

export const transactionInputs = {
  // --- Transaction: Get Report ---
  getReportDateMacro: Workflow.select({
    label: 'Date Range',
    description: 'Predefined date range',
    options: [
      { value: '', label: 'Custom Range' },
      { value: 'Today', label: 'Today' },
      { value: 'This Week', label: 'This Week' },
      { value: 'This Month', label: 'This Month' },
      { value: 'This Quarter', label: 'This Quarter' },
      { value: 'This Year', label: 'This Year' },
      { value: 'Last Week', label: 'Last Week' },
      { value: 'Last Month', label: 'Last Month' },
      { value: 'Last Quarter', label: 'Last Quarter' },
      { value: 'Last Year', label: 'Last Year' },
    ],
    default: '',
  }),
  getReportStartDate: Workflow.string({
    label: 'Start Date',
    description: 'YYYY-MM-DD (overrides date range macro)',
    placeholder: '2024-01-01',
    acceptsVariables: true,
  }),
  getReportEndDate: Workflow.string({
    label: 'End Date',
    description: 'YYYY-MM-DD',
    placeholder: '2024-12-31',
    acceptsVariables: true,
  }),
  getReportTransactionType: Workflow.select({
    label: 'Transaction Type',
    description: 'Filter by transaction type',
    options: [
      { value: '', label: 'All' },
      { value: 'Invoice', label: 'Invoice' },
      { value: 'Payment', label: 'Payment' },
      { value: 'Bill', label: 'Bill' },
      { value: 'Expense', label: 'Expense' },
      { value: 'Transfer', label: 'Transfer' },
      { value: 'Deposit', label: 'Deposit' },
      { value: 'Check', label: 'Check' },
      { value: 'JournalEntry', label: 'Journal Entry' },
      { value: 'CreditMemo', label: 'Credit Memo' },
      { value: 'RefundReceipt', label: 'Refund Receipt' },
    ],
    default: '',
  }),
  getReportGroupBy: Workflow.select({
    label: 'Group By',
    options: [
      { value: '', label: 'None' },
      { value: 'Account', label: 'Account' },
      { value: 'Customer', label: 'Customer' },
      { value: 'Vendor', label: 'Vendor' },
      { value: 'Month', label: 'Month' },
      { value: 'Quarter', label: 'Quarter' },
      { value: 'Year', label: 'Year' },
    ],
    default: '',
  }),
  getReportSortBy: Workflow.string({
    label: 'Sort By',
    description: 'Column name to sort by',
    acceptsVariables: true,
  }),
  getReportSortOrder: Workflow.select({
    label: 'Sort Order',
    options: [
      { value: '', label: 'Default' },
      { value: 'Ascend', label: 'Ascending' },
      { value: 'Descend', label: 'Descending' },
    ],
    default: '',
  }),
  getReportColumns: Workflow.string({
    label: 'Columns',
    description: 'Comma-separated list of columns to include',
    acceptsVariables: true,
  }),
}

export function transactionComputeOutputs(operation: string) {
  if (operation === 'getReport') {
    return {
      transactions: Workflow.string({ label: 'Transactions (JSON)' }),
      count: Workflow.string({ label: 'Count' }),
    }
  }
  return {}
}
