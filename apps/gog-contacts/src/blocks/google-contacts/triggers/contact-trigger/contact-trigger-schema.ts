import { Workflow } from '@auxx/sdk'

export const contactTriggerInputs = {
  triggerOn: Workflow.select({
    label: 'Trigger On',
    options: [
      { value: 'contactCreated', label: 'Contact Created' },
      { value: 'contactUpdated', label: 'Contact Updated' },
      { value: 'contactDeleted', label: 'Contact Deleted' },
    ],
    default: 'contactCreated',
  }),
}

export const contactTriggerOutputs = {
  contactId: Workflow.string({ label: 'Contact ID' }),
  resourceName: Workflow.string({ label: 'Resource Name' }),
  givenName: Workflow.string({ label: 'First Name' }),
  familyName: Workflow.string({ label: 'Last Name' }),
  displayName: Workflow.string({ label: 'Display Name' }),
  email: Workflow.string({ label: 'Email' }),
  phone: Workflow.string({ label: 'Phone' }),
  company: Workflow.string({ label: 'Company' }),
  jobTitle: Workflow.string({ label: 'Job Title' }),
}

export const contactTriggerSchema = {
  inputs: contactTriggerInputs,
  outputs: contactTriggerOutputs,
}
