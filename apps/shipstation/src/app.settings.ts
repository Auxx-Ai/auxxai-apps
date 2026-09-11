// src/app.settings.ts

import { Settings, type SettingsSchema } from '@auxx/sdk'

/**
 * ShipStation's write gates.
 *
 * ## Why settings rather than connection variables
 *
 * The FedEx and QuickBooks apps both moved a flag OFF app settings and onto a
 * connection variable, because what they were describing (which environment a
 * token points at) is a property of ONE connection and drifted when flipped.
 *
 * These two are the opposite case. "May this organisation's workflows spend
 * money on postage" is an organisation policy, not a property of a ShipStation
 * account, and it should apply to every connected account at once. Nothing is
 * stored that a later flip could reinterpret: the dispatcher reads these at
 * execute time, so turning one off stops the next run rather than leaving
 * anything stale behind. A ShipStation connection is also a bare `secret` (the
 * API key IS `connection.value`, with no connection variables), so there is no
 * connection form to put them on.
 *
 * ## Why two flags
 *
 * `allowLabelPurchase` is the only operation in this app that spends money. An
 * org that wants workflows to tag shipments and issue return labels should not
 * have to also authorise buying outbound postage.
 *
 * `label.void` sits under `allowWrites`, NOT under `allowLabelPurchase`:
 * voiding requests a refund and is the corrective action for a mistaken
 * purchase. Tying it to the purchase flag would leave an org able to buy and
 * unable to undo. See `blocks/shipstation/resources/capabilities.ts`.
 *
 * Both default to false: a fresh installation is read-only.
 */
export const appSettingsSchema = {
  organization: {
    allowWrites: Settings.boolean({
      label: 'Allow shipment writes',
      description:
        'Let workflows create, update and cancel shipments, tag them, add internal notes, issue return labels and void labels. Does not allow purchasing labels.',
      default: false,
    }),
    allowLabelPurchase: Settings.boolean({
      label: 'Allow label purchase',
      description:
        'Let workflows buy shipping labels. This spends real money from the connected ShipStation account on every run.',
      default: false,
    }),
  },
  user: {},
} satisfies SettingsSchema

export default appSettingsSchema
