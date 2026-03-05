import type { PollingState, PollingExecuteResult } from '@auxx/sdk/server'
import { contactsApiRequest, resolvePersonFields } from '../../shared/google-contacts-api'

export default async function contactTriggerExecute(
  input: Record<string, unknown>,
  polling: PollingState
): Promise<PollingExecuteResult> {
  const { state, connection } = polling
  if (!connection?.value) return { events: [], state }

  const token = connection.value
  const triggerOn = input.triggerOn as string
  const now = new Date().toISOString()
  const personFields = resolvePersonFields('*')

  if (triggerOn === 'contactCreated' || triggerOn === 'contactUpdated') {
    const lastChecked = (state.lastChecked as string) || now

    const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
      personFields,
      sortOrder: 'LAST_MODIFIED_DESCENDING',
      pageSize: 100,
      requestSyncToken: true,
    })

    const contacts = result.connections || []

    // Filter contacts modified since last poll
    const filtered = contacts.filter((c: any) => {
      const sources = c.metadata?.sources || []
      const updateTime = sources[0]?.updateTime
      if (!updateTime) return false
      return updateTime >= lastChecked
    })

    // For contactCreated, all modified contacts since last check are returned
    // (the People API doesn't distinguish create vs update reliably)
    const events = filtered.map((person: any) => mapTriggerContact(person))

    return {
      events,
      state: {
        ...state,
        lastChecked: now,
        syncToken: result.nextSyncToken || state.syncToken,
      },
    }
  }

  if (triggerOn === 'contactDeleted') {
    const syncToken = state.syncToken as string | undefined

    if (!syncToken) {
      // First poll: get sync token without processing
      const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
        personFields: 'metadata',
        requestSyncToken: true,
        pageSize: 1,
      })
      return {
        events: [],
        state: { ...state, syncToken: result.nextSyncToken, lastChecked: now },
      }
    }

    try {
      const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
        personFields,
        syncToken,
        requestSyncToken: true,
      })

      const contacts = result.connections || []
      const deleted = contacts.filter((c: any) => c.metadata?.deleted)

      const events = deleted.map((person: any) => ({
        contactId: person.resourceName?.split('/')[1] || '',
        resourceName: person.resourceName || '',
        givenName: '',
        familyName: '',
        displayName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
      }))

      return {
        events,
        state: { ...state, syncToken: result.nextSyncToken, lastChecked: now },
      }
    } catch (err: any) {
      // Sync token expired — reset and get a fresh one
      if (err.message?.includes('410') || err.message?.includes('EXPIRED')) {
        const result = await contactsApiRequest(token, 'GET', '/people/me/connections', undefined, {
          personFields: 'metadata',
          requestSyncToken: true,
          pageSize: 1,
        })
        return {
          events: [],
          state: { ...state, syncToken: result.nextSyncToken, lastChecked: now },
        }
      }
      throw err
    }
  }

  return { events: [], state: { ...state, lastChecked: now } }
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
