import type { PollingState, PollingExecuteResult } from '@auxx/sdk/server'
import { contactsApiRequest, resolvePersonFields } from '../../shared/google-contacts-api'

export default async function contactTriggerExecute(
  input: Record<string, unknown>,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const { state, connection } = polling
  if (!connection?.value) return { events: [], state }

  const token = connection.value
  const rawTriggerOn = input.triggerOn
  const triggerOn: string[] = Array.isArray(rawTriggerOn) ? rawTriggerOn : [rawTriggerOn as string]
  const now = new Date().toISOString()
  const personFields = resolvePersonFields('*')

  const events: Record<string, string>[] = []
  let newState = { ...state }

  if (triggerOn.includes('contactCreated') || triggerOn.includes('contactUpdated')) {
    const lastChecked = (state.lastChecked as string) || now

    const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
      personFields,
      sortOrder: 'LAST_MODIFIED_DESCENDING',
      pageSize: 100,
      requestSyncToken: true,
    })

    const contacts = result.connections || []

    const filtered = contacts.filter((c: any) => {
      const sources = c.metadata?.sources || []
      const updateTime = sources[0]?.updateTime
      if (!updateTime) return false
      return updateTime >= lastChecked
    })

    for (const person of filtered) {
      const mapped = mapTriggerContact(person)
      if (triggerOn.includes('contactCreated')) {
        events.push({ ...mapped, changeType: 'created' })
      } else if (triggerOn.includes('contactUpdated')) {
        events.push({ ...mapped, changeType: 'updated' })
      }
    }

    newState = {
      ...newState,
      lastChecked: now,
      syncToken: result.nextSyncToken || state.syncToken,
    }
  }

  if (triggerOn.includes('contactDeleted')) {
    const syncToken = state.syncToken as string | undefined

    if (!syncToken) {
      const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
        personFields: 'metadata',
        requestSyncToken: true,
        pageSize: 1,
      })
      newState = { ...newState, syncToken: result.nextSyncToken, lastChecked: now }
    } else {
      try {
        const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
          personFields,
          syncToken,
          requestSyncToken: true,
        })

        const contacts = result.connections || []
        const deleted = contacts.filter((c: any) => c.metadata?.deleted)

        for (const person of deleted) {
          events.push({
            changeType: 'deleted',
            contactId: person.resourceName?.split('/')[1] || '',
            resourceName: person.resourceName || '',
            givenName: '',
            familyName: '',
            displayName: '',
            email: '',
            phone: '',
            company: '',
            jobTitle: '',
          })
        }

        newState = { ...newState, syncToken: result.nextSyncToken, lastChecked: now }
      } catch (err: any) {
        if (err.message?.includes('410') || err.message?.includes('EXPIRED')) {
          const result = await contactsApiRequest(
            token,
            'GET',
            '/people/me/connections',
            undefined,
            {
              personFields: 'metadata',
              requestSyncToken: true,
              pageSize: 1,
            }
          )
          newState = { ...newState, syncToken: result.nextSyncToken, lastChecked: now }
        } else {
          throw err
        }
      }
    }
  }

  return { events, state: newState }
}

function mapTriggerContact(person: any) {
  const name = person.names?.[0] || {}
  const email = person.emailAddresses?.[0]?.value || ''
  const phone = person.phoneNumbers?.[0]?.value || ''
  const org = person.organizations?.[0] || {}

  return {
    contactId: person.resourceName?.split('/')[1] || '',
    resourceName: person.resourceName || '',
    givenName: name.givenName || '',
    familyName: name.familyName || '',
    displayName: name.displayName || `${name.givenName || ''} ${name.familyName || ''}`.trim(),
    email,
    phone,
    company: org.name || '',
    jobTitle: org.title || '',
  }
}
