import { VALID_OPERATIONS } from './resources/constants'
import { executeContact } from './resources/contact/contact-execute.server'

export default async function googleContactsExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  const { resource, operation } = input

  const valid = VALID_OPERATIONS[resource]
  if (!valid) throw new Error(`Unknown resource: ${resource}`)
  if (!valid.includes(operation)) {
    throw new Error(`Invalid operation "${operation}" for resource "${resource}"`)
  }

  switch (resource) {
    case 'contact':
      return executeContact(operation, input)
    default:
      throw new Error(`Unhandled resource: ${resource}`)
  }
}
