// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * QuickBooks toolsets. Read/write split per
 * plans/kopilot/apps/quickbooks-overhaul.md §5. `send_*` tools sit in
 * the `.write` toolsets because they have non-reversible side effects
 * (emailing the customer).
 *
 * `list_quickbooks_accounts` and `list_quickbooks_items` are
 * intentionally toolset-less — the platform bridge auto-attaches them
 * when any `quickbooks.*` toolset is enabled.
 */
export const quickbooksToolsets: Toolset[] = [
  {
    id: 'quickbooks.contacts.read',
    name: 'QuickBooks contacts (read)',
    description:
      'Look up QuickBooks customers and vendors. Use for "who is this customer?", "what is their balance?", "find the vendor we paid last month".',
    tools: [
      'find_quickbooks_customer',
      'get_quickbooks_customer',
      'search_quickbooks_customers',
      'find_quickbooks_vendor',
      'get_quickbooks_vendor',
      'search_quickbooks_vendors',
    ],
  },
  {
    id: 'quickbooks.contacts.write',
    name: 'QuickBooks contacts (write)',
    description:
      'Create or update QuickBooks customers and vendors from chat. Enable when the agent should be able to save contacts mid-conversation.',
    tools: [
      'create_quickbooks_customer',
      'update_quickbooks_customer',
      'create_quickbooks_vendor',
      'update_quickbooks_vendor',
    ],
  },
  {
    id: 'quickbooks.sales.read',
    name: 'QuickBooks sales (read)',
    description:
      'Read invoices, estimates, payments, and the product/service catalog. Use for "what is outstanding?", "what did we invoice this customer?", "show recent payments".',
    tools: [
      'get_quickbooks_invoice',
      'search_quickbooks_invoices',
      'get_quickbooks_estimate',
      'search_quickbooks_estimates',
      'get_quickbooks_payment',
      'search_quickbooks_payments',
      'get_quickbooks_item',
    ],
  },
  {
    id: 'quickbooks.sales.write',
    name: 'QuickBooks sales (write)',
    description:
      'Create/update invoices, estimates, and payments — and send invoices/estimates to customers by email. Enable when the agent should be able to bill or quote from chat.',
    tools: [
      'create_quickbooks_invoice',
      'update_quickbooks_invoice',
      'send_quickbooks_invoice',
      'create_quickbooks_estimate',
      'update_quickbooks_estimate',
      'send_quickbooks_estimate',
      'create_quickbooks_payment',
      'update_quickbooks_payment',
    ],
  },
]
