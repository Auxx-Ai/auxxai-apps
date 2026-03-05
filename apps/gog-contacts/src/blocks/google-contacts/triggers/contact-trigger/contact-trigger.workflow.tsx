import type { WorkflowTrigger } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  useWorkflowNode,
} from '@auxx/sdk/client'
import googleContactsIcon from '../../../../assets/icon.png'
import { ContactTriggerPanel } from './contact-trigger-panel'
import { contactTriggerSchema } from './contact-trigger-schema'
import contactTriggerExecute from './contact-trigger.server'

const triggerLabels: Record<string, string> = {
  contactCreated: 'Contact Created',
  contactUpdated: 'Contact Updated',
  contactDeleted: 'Contact Deleted',
}

function ContactTriggerNode() {
  const { data } = useWorkflowNode()
  const label = triggerLabels[data.triggerOn as string] || 'Contacts Trigger'

  return (
    <WorkflowNode>
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const contactTrigger = {
  id: 'gog-contacts.contact-trigger',
  label: 'Google Contacts Trigger',
  description: 'Triggers when contacts are created, updated, or deleted',
  icon: googleContactsIcon,
  color: '#4285F4',
  schema: contactTriggerSchema,
  node: ContactTriggerNode,
  panel: ContactTriggerPanel,
  execute: contactTriggerExecute,
  config: {
    requiresConnection: true,
    polling: {
      intervalMinutes: 5,
      minIntervalMinutes: 1,
    },
  },
} satisfies WorkflowTrigger<typeof contactTriggerSchema>
