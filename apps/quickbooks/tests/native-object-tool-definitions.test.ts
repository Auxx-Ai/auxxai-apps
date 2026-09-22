// apps/quickbooks/tests/native-object-tool-definitions.test.ts
//
// Importing each tool.tsx exercises defineTool() (packages/sdk/src/root/tools/
// define-tool.ts), which validates the tool's exampleOutput against its own
// outputs schema at module load time. A schema/example mismatch throws here
// before it ever reached a deploy. Also checks the brief 67 §3 wiring rule:
// every native-object tool carries no `agent` key and sits in no toolset.
import { describe, expect, it } from 'vitest'
import { batchQuickbooksOperationsTool } from '../src/tools/batch-quickbooks-operations.tool'
import { createQuickbooksBillTool } from '../src/tools/create-quickbooks-bill.tool'
import { createQuickbooksCreditMemoTool } from '../src/tools/create-quickbooks-credit-memo.tool'
import { createQuickbooksDepositTool } from '../src/tools/create-quickbooks-deposit.tool'
import { createQuickbooksRefundReceiptTool } from '../src/tools/create-quickbooks-refund-receipt.tool'
import { createQuickbooksSalesReceiptTool } from '../src/tools/create-quickbooks-sales-receipt.tool'
import { deleteQuickbooksBillTool } from '../src/tools/delete-quickbooks-bill.tool'
import { deleteQuickbooksCreditMemoTool } from '../src/tools/delete-quickbooks-credit-memo.tool'
import { deleteQuickbooksDepositTool } from '../src/tools/delete-quickbooks-deposit.tool'
import { deleteQuickbooksInvoiceTool } from '../src/tools/delete-quickbooks-invoice.tool'
import { deleteQuickbooksPaymentTool } from '../src/tools/delete-quickbooks-payment.tool'
import { deleteQuickbooksRefundReceiptTool } from '../src/tools/delete-quickbooks-refund-receipt.tool'
import { deleteQuickbooksSalesReceiptTool } from '../src/tools/delete-quickbooks-sales-receipt.tool'
import { findQuickbooksBillTool } from '../src/tools/find-quickbooks-bill.tool'
import { findQuickbooksCreditMemoTool } from '../src/tools/find-quickbooks-credit-memo.tool'
import { findQuickbooksInvoiceTool } from '../src/tools/find-quickbooks-invoice.tool'
import { findQuickbooksItemTool } from '../src/tools/find-quickbooks-item.tool'
import { findQuickbooksRefundReceiptTool } from '../src/tools/find-quickbooks-refund-receipt.tool'
import { findQuickbooksSalesReceiptTool } from '../src/tools/find-quickbooks-sales-receipt.tool'
import { getQuickbooksBillTool } from '../src/tools/get-quickbooks-bill.tool'
import { getQuickbooksCreditMemoTool } from '../src/tools/get-quickbooks-credit-memo.tool'
import { getQuickbooksDepositTool } from '../src/tools/get-quickbooks-deposit.tool'
import { getQuickbooksRefundReceiptTool } from '../src/tools/get-quickbooks-refund-receipt.tool'
import { getQuickbooksSalesReceiptTool } from '../src/tools/get-quickbooks-sales-receipt.tool'
import { quickbooksToolsets } from '../src/tools/toolsets'

const nativeObjectTools = [
  createQuickbooksSalesReceiptTool,
  getQuickbooksSalesReceiptTool,
  deleteQuickbooksSalesReceiptTool,
  findQuickbooksSalesReceiptTool,
  createQuickbooksCreditMemoTool,
  getQuickbooksCreditMemoTool,
  deleteQuickbooksCreditMemoTool,
  findQuickbooksCreditMemoTool,
  createQuickbooksRefundReceiptTool,
  getQuickbooksRefundReceiptTool,
  deleteQuickbooksRefundReceiptTool,
  findQuickbooksRefundReceiptTool,
  createQuickbooksDepositTool,
  getQuickbooksDepositTool,
  deleteQuickbooksDepositTool,
  createQuickbooksBillTool,
  getQuickbooksBillTool,
  deleteQuickbooksBillTool,
  findQuickbooksBillTool,
  deleteQuickbooksInvoiceTool,
  findQuickbooksInvoiceTool,
  deleteQuickbooksPaymentTool,
  findQuickbooksItemTool,
  batchQuickbooksOperationsTool,
]

describe('brief 67 native-object tool definitions', () => {
  it('constructs every tool (exampleOutput satisfies its own outputs schema)', () => {
    expect(nativeObjectTools).toHaveLength(24)
  })

  it('carries no `agent` key — platform-called, not chat-agent tools', () => {
    for (const tool of nativeObjectTools) {
      expect('agent' in tool, `${tool.id} must not carry an agent key`).toBe(false)
    }
  })

  it('sits in no toolset', () => {
    const toolsetted = new Set(quickbooksToolsets.flatMap((ts) => ts.tools))
    for (const tool of nativeObjectTools) {
      expect(toolsetted.has(tool.id), `${tool.id} must not be in any toolset`).toBe(false)
    }
  })

  it('has unique ids', () => {
    const ids = nativeObjectTools.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
