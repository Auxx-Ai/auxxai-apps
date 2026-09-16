// src/tools/get_affirm_charge.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import affirmIcon from '../assets/affirm.png'
import getAffirmChargeExecute from './get_affirm_charge.tool.server'
import { chargeDetailSchema, exampleChargeDetail } from './shared/schemas'

export const getAffirmChargeTool = defineTool({
  id: 'get_affirm_charge',
  name: 'Get Affirm charge',
  description:
    'Fetch one Affirm charge by its ARI (e.g. CPDZ-ANRU), with its authorisation and capture ' +
    'history and the Shopify payment session it belongs to. This is how a settlement event ' +
    'whose order_id does not match anything gets resolved: Affirm states the Shopify ' +
    'PaymentSession id itself. Returns NO customer name, email or address. READ-ONLY.',
  icon: affirmIcon,
  inputs: z.object({
    chargeId: z.string().describe('The Affirm charge ARI, e.g. CPDZ-ANRU.'),
  }),
  outputs: chargeDetailSchema.extend({
    summary: z.string().describe('Readable rollup. Safe to quote directly when answering.'),
  }),
  exampleOutput: {
    summary:
      'Affirm charge CPDZ-ANRU for 3740.05 USD, status captured. 1 event(s), 0 capture(s). ' +
      'Shopify payment session gid://shopify/PaymentSession/rPhjzMna9vESRYlOF0hLADbBL.',
    ...exampleChargeDetail,
  },
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: getAffirmChargeExecute,
  agent: {
    toolsetSlug: 'affirm.settlements',
    idempotent: true,
    surfaces: ['internal', 'builder'],
  },
})
