// src/triggers/shipment-status-changed/shipment-status-changed.workflow.tsx

/**
 * Agent-only trigger. It watches the agent-populated watch registry (via the
 * `watch_shipment` tool), so it has no meaningful workflow surface — a workflow
 * never calls `watch_shipment`, leaving the registry empty. Workflows use
 * `ups.shipment-tracker` instead, which is configured from its own panel.
 */

import { defineTrigger } from '@auxx/sdk'
import icon from '../../assets/icon.png'
import { shipmentStatusChangedSchema } from './shipment-status-changed-schema'
import shipmentStatusChangedExecute from './shipment-status-changed.server'

export const shipmentStatusChangedTrigger = defineTrigger({
  id: 'ups.shipment-status-changed',
  label: 'Shipment status changed',
  description:
    'Fires when a watched UPS shipment gets a new status (delivered, exception, in transit, …).',
  icon,
  color: '#351C15',
  schema: shipmentStatusChangedSchema,
  execute: shipmentStatusChangedExecute,
  config: {
    requiresConnection: true,
    timeout: 30000,
    retries: 0,
    polling: { intervalMinutes: 30, minIntervalMinutes: 15 },
  },
  agent: {
    label: 'UPS shipment status changed',
    description: 'Fires when a watched UPS shipment gets a new status (delivered, exception, …)',
    defaultEnabled: false,
  },
})
