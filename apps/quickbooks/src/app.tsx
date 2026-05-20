// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { quickbooksBlock } from './blocks/quickbooks/quickbooks.workflow'
import { createQuickbooksCustomerTool } from './tools/create-quickbooks-customer.tool'
import { createQuickbooksEstimateTool } from './tools/create-quickbooks-estimate.tool'
import { createQuickbooksInvoiceTool } from './tools/create-quickbooks-invoice.tool'
import { createQuickbooksPaymentTool } from './tools/create-quickbooks-payment.tool'
import { createQuickbooksVendorTool } from './tools/create-quickbooks-vendor.tool'
import { findQuickbooksCustomerTool } from './tools/find-quickbooks-customer.tool'
import { findQuickbooksVendorTool } from './tools/find-quickbooks-vendor.tool'
import { getQuickbooksCustomerTool } from './tools/get-quickbooks-customer.tool'
import { getQuickbooksEstimateTool } from './tools/get-quickbooks-estimate.tool'
import { getQuickbooksInvoiceTool } from './tools/get-quickbooks-invoice.tool'
import { getQuickbooksItemTool } from './tools/get-quickbooks-item.tool'
import { getQuickbooksPaymentTool } from './tools/get-quickbooks-payment.tool'
import { getQuickbooksVendorTool } from './tools/get-quickbooks-vendor.tool'
import { quickbooksBillCreateTool } from './tools/internal/bill-create.tool'
import { quickbooksBillDeleteTool } from './tools/internal/bill-delete.tool'
import { quickbooksBillGetTool } from './tools/internal/bill-get.tool'
import { quickbooksBillGetManyTool } from './tools/internal/bill-get-many.tool'
import { quickbooksBillUpdateTool } from './tools/internal/bill-update.tool'
import { quickbooksCustomerCreateTool } from './tools/internal/customer-create.tool'
import { quickbooksCustomerGetTool } from './tools/internal/customer-get.tool'
import { quickbooksCustomerGetManyTool } from './tools/internal/customer-get-many.tool'
import { quickbooksCustomerUpdateTool } from './tools/internal/customer-update.tool'
import { quickbooksEmployeeCreateTool } from './tools/internal/employee-create.tool'
import { quickbooksEmployeeGetTool } from './tools/internal/employee-get.tool'
import { quickbooksEmployeeGetManyTool } from './tools/internal/employee-get-many.tool'
import { quickbooksEmployeeUpdateTool } from './tools/internal/employee-update.tool'
import { quickbooksEstimateCreateTool } from './tools/internal/estimate-create.tool'
import { quickbooksEstimateDeleteTool } from './tools/internal/estimate-delete.tool'
import { quickbooksEstimateGetTool } from './tools/internal/estimate-get.tool'
import { quickbooksEstimateGetManyTool } from './tools/internal/estimate-get-many.tool'
import { quickbooksEstimateSendTool } from './tools/internal/estimate-send.tool'
import { quickbooksEstimateUpdateTool } from './tools/internal/estimate-update.tool'
import { quickbooksInvoiceCreateTool } from './tools/internal/invoice-create.tool'
import { quickbooksInvoiceDeleteTool } from './tools/internal/invoice-delete.tool'
import { quickbooksInvoiceGetTool } from './tools/internal/invoice-get.tool'
import { quickbooksInvoiceGetManyTool } from './tools/internal/invoice-get-many.tool'
import { quickbooksInvoiceSendTool } from './tools/internal/invoice-send.tool'
import { quickbooksInvoiceUpdateTool } from './tools/internal/invoice-update.tool'
import { quickbooksInvoiceVoidTool } from './tools/internal/invoice-void.tool'
import { quickbooksItemGetTool } from './tools/internal/item-get.tool'
import { quickbooksItemGetManyTool } from './tools/internal/item-get-many.tool'
import { quickbooksPaymentCreateTool } from './tools/internal/payment-create.tool'
import { quickbooksPaymentDeleteTool } from './tools/internal/payment-delete.tool'
import { quickbooksPaymentGetTool } from './tools/internal/payment-get.tool'
import { quickbooksPaymentGetManyTool } from './tools/internal/payment-get-many.tool'
import { quickbooksPaymentSendTool } from './tools/internal/payment-send.tool'
import { quickbooksPaymentUpdateTool } from './tools/internal/payment-update.tool'
import { quickbooksPaymentVoidTool } from './tools/internal/payment-void.tool'
import { quickbooksPurchaseGetTool } from './tools/internal/purchase-get.tool'
import { quickbooksPurchaseGetManyTool } from './tools/internal/purchase-get-many.tool'
import { quickbooksTransactionGetReportTool } from './tools/internal/transaction-get-report.tool'
import { quickbooksVendorCreateTool } from './tools/internal/vendor-create.tool'
import { quickbooksVendorGetTool } from './tools/internal/vendor-get.tool'
import { quickbooksVendorGetManyTool } from './tools/internal/vendor-get-many.tool'
import { quickbooksVendorUpdateTool } from './tools/internal/vendor-update.tool'
import { listQuickbooksAccountsTool } from './tools/list-quickbooks-accounts.tool'
import { listQuickbooksItemsTool } from './tools/list-quickbooks-items.tool'
import { searchQuickbooksCustomersTool } from './tools/search-quickbooks-customers.tool'
import { searchQuickbooksEstimatesTool } from './tools/search-quickbooks-estimates.tool'
import { searchQuickbooksInvoicesTool } from './tools/search-quickbooks-invoices.tool'
import { searchQuickbooksPaymentsTool } from './tools/search-quickbooks-payments.tool'
import { searchQuickbooksVendorsTool } from './tools/search-quickbooks-vendors.tool'
import { sendQuickbooksEstimateTool } from './tools/send-quickbooks-estimate.tool'
import { sendQuickbooksInvoiceTool } from './tools/send-quickbooks-invoice.tool'
import { quickbooksToolsets } from './tools/toolsets'
import { updateQuickbooksCustomerTool } from './tools/update-quickbooks-customer.tool'
import { updateQuickbooksEstimateTool } from './tools/update-quickbooks-estimate.tool'
import { updateQuickbooksInvoiceTool } from './tools/update-quickbooks-invoice.tool'
import { updateQuickbooksPaymentTool } from './tools/update-quickbooks-payment.tool'
import { updateQuickbooksVendorTool } from './tools/update-quickbooks-vendor.tool'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },

  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },

  workflow: {
    blocks: [quickbooksBlock],
    triggers: [],
  },

  tools: [
    // Agent-surface tools (exposed to LLM via toolsets).
    listQuickbooksAccountsTool,
    listQuickbooksItemsTool,
    findQuickbooksCustomerTool,
    getQuickbooksCustomerTool,
    searchQuickbooksCustomersTool,
    findQuickbooksVendorTool,
    getQuickbooksVendorTool,
    searchQuickbooksVendorsTool,
    getQuickbooksInvoiceTool,
    searchQuickbooksInvoicesTool,
    getQuickbooksEstimateTool,
    searchQuickbooksEstimatesTool,
    getQuickbooksPaymentTool,
    searchQuickbooksPaymentsTool,
    getQuickbooksItemTool,
    createQuickbooksCustomerTool,
    updateQuickbooksCustomerTool,
    createQuickbooksVendorTool,
    updateQuickbooksVendorTool,
    createQuickbooksInvoiceTool,
    updateQuickbooksInvoiceTool,
    sendQuickbooksInvoiceTool,
    createQuickbooksEstimateTool,
    updateQuickbooksEstimateTool,
    sendQuickbooksEstimateTool,
    createQuickbooksPaymentTool,
    updateQuickbooksPaymentTool,
    // Internal-only tools (no `agent` / `action` keys) — invoked via the
    // QuickBooks workflow block dispatcher (toolMap).
    quickbooksBillCreateTool,
    quickbooksBillDeleteTool,
    quickbooksBillGetTool,
    quickbooksBillGetManyTool,
    quickbooksBillUpdateTool,
    quickbooksCustomerCreateTool,
    quickbooksCustomerGetTool,
    quickbooksCustomerGetManyTool,
    quickbooksCustomerUpdateTool,
    quickbooksEmployeeCreateTool,
    quickbooksEmployeeGetTool,
    quickbooksEmployeeGetManyTool,
    quickbooksEmployeeUpdateTool,
    quickbooksEstimateCreateTool,
    quickbooksEstimateDeleteTool,
    quickbooksEstimateGetTool,
    quickbooksEstimateGetManyTool,
    quickbooksEstimateSendTool,
    quickbooksEstimateUpdateTool,
    quickbooksInvoiceCreateTool,
    quickbooksInvoiceDeleteTool,
    quickbooksInvoiceGetTool,
    quickbooksInvoiceGetManyTool,
    quickbooksInvoiceSendTool,
    quickbooksInvoiceUpdateTool,
    quickbooksInvoiceVoidTool,
    quickbooksItemGetTool,
    quickbooksItemGetManyTool,
    quickbooksPaymentCreateTool,
    quickbooksPaymentDeleteTool,
    quickbooksPaymentGetTool,
    quickbooksPaymentGetManyTool,
    quickbooksPaymentSendTool,
    quickbooksPaymentUpdateTool,
    quickbooksPaymentVoidTool,
    quickbooksPurchaseGetTool,
    quickbooksPurchaseGetManyTool,
    quickbooksTransactionGetReportTool,
    quickbooksVendorCreateTool,
    quickbooksVendorGetTool,
    quickbooksVendorGetManyTool,
    quickbooksVendorUpdateTool,
  ],

  toolsets: quickbooksToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">QuickBooks</TextBlock>
      <TextBlock align="left">
        Connect your QuickBooks Online account to automate accounting workflows. Manage customers,
        invoices, payments, estimates, bills, and more directly from your Auxx workflows.
      </TextBlock>
    </>
  )
}
