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
