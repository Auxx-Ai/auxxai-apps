// tests/map-deposit.test.ts

import { describe, expect, it } from 'vitest'
import { mapDeposit } from '../src/tools/shared/map-deposit'

describe('mapDeposit', () => {
  it('names what each line deposits and what each coded line credits', () => {
    const mapped = mapDeposit({
      Id: '402',
      TxnDate: '2026-09-22',
      TotalAmt: 350,
      SyncToken: '0',
      DepositToAccountRef: { value: '1150040044' },
      Line: [
        { Amount: 100, LinkedTxn: [{ TxnId: '401', TxnType: 'Payment', TxnLineId: '0' }] },
        { Amount: 250, DepositLineDetail: { AccountRef: { value: '1150040092' } } },
      ],
    })
    expect(mapped.depositToAccountId).toBe('1150040044')
    expect(mapped.lines).toEqual([
      { amount: 100, accountId: null, linkedTxns: [{ txnId: '401', txnType: 'Payment' }] },
      { amount: 250, accountId: '1150040092', linkedTxns: [] },
    ])
  })
})
