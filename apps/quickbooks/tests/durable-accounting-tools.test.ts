// apps/quickbooks/tests/durable-accounting-tools.test.ts
import {beforeEach,describe,expect,it,vi} from 'vitest'
vi.mock('../src/blocks/quickbooks/shared/quickbooks-api',()=>({quickbooksApi:vi.fn(),buildEmail:(email:string)=>email?{Address:email}:undefined,buildPhone:()=>undefined,buildAddress:()=>undefined}))
vi.mock('../src/tools/shared/connection',()=>({getQuickbooksConnection:vi.fn(async()=>({credential:'token',realmId:'company-A',sandbox:true})),invalidInput:(message:string)=>{throw new Error(message)}}))
vi.mock('../src/tools/shared/resolve-customer-refs',()=>({resolveCustomerRefs:vi.fn(async()=>({auxxContactId:null,auxxCompanyId:null,notImportedReason:'NOT_IMPORTED'}))}))
import {quickbooksApi} from '../src/blocks/quickbooks/shared/quickbooks-api'
import createJournal from '../src/tools/create-quickbooks-journal-entry.tool.server'
import createCustomer from '../src/tools/create-quickbooks-customer.tool.server'
beforeEach(()=>vi.clearAllMocks())
describe('durable accounting tool requests',()=>{
 it('sends explicit currency and request identity to the pinned journal endpoint',async()=>{
  vi.mocked(quickbooksApi).mockResolvedValue({JournalEntry:{Id:'1',CurrencyRef:{value:'USD'},Line:[]}})
  await createJournal({lines:[{amountMinor:4999,postingType:'Debit',accountId:'AR'},{amountMinor:4999,postingType:'Credit',accountId:'REV'}],txnDate:'2026-09-15',docNumber:'AUXX-FUL-test',currency:'USD',requestId:'journal-request'})
  expect(quickbooksApi).toHaveBeenCalledWith('company-A','/journalentry','token',expect.objectContaining({requestId:'journal-request',body:expect.objectContaining({CurrencyRef:{value:'USD'},TxnDate:'2026-09-15',Line:expect.arrayContaining([expect.objectContaining({Amount:49.99})])})}))
 })
 it('refuses malformed currency without HTTP',async()=>{
  await expect(createJournal({lines:[{amountMinor:1,postingType:'Debit',accountId:'AR'},{amountMinor:1,postingType:'Credit',accountId:'REV'}],currency:'us'})).rejects.toThrow('currency')
  expect(quickbooksApi).not.toHaveBeenCalled()
 })
 it('forwards a saved customer dependency request identity',async()=>{
  vi.mocked(quickbooksApi).mockResolvedValue({Customer:{Id:'2',DisplayName:'Customer',Notes:'auxx:contact:1'}})
  await createCustomer({displayName:'Customer',notes:'auxx:contact:1',requestId:'customer-request'},{} as never)
  expect(quickbooksApi).toHaveBeenCalledWith('company-A','/customer','token',expect.objectContaining({requestId:'customer-request',body:expect.objectContaining({Notes:'auxx:contact:1'})}))
 })
})
