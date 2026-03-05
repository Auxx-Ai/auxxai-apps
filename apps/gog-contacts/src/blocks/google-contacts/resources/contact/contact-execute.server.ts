import { getOrganizationConnection } from '@auxx/sdk/server'
import {
  contactsApiRequest,
  contactsApiRequestAll,
  resolvePersonFields,
} from '../../shared/google-contacts-api'

function throwConnectionNotFound(): never {
  const err = new Error(
    'Google Contacts not connected. Please connect in Settings → Apps → Google Contacts.'
  ) as Error & { code: string; scope: string }
  err.code = 'CONNECTION_NOT_FOUND'
  err.scope = 'organization'
  throw err
}

export async function executeContact(operation: string, input: any): Promise<Record<string, any>> {
  const connection = getOrganizationConnection()
  if (!connection?.value) throwConnectionNotFound()
  const token = connection.value

  switch (operation) {
    case 'create': {
      const body: any = {
        names: [
          {
            givenName: input.createGivenName || '',
            familyName: input.createFamilyName || '',
            ...(input.createMiddleName ? { middleName: input.createMiddleName } : {}),
            ...(input.createHonorificPrefix
              ? { honorificPrefix: input.createHonorificPrefix }
              : {}),
            ...(input.createHonorificSuffix
              ? { honorificSuffix: input.createHonorificSuffix }
              : {}),
          },
        ],
      }

      if (input.createEmail) {
        body.emailAddresses = [{ value: input.createEmail, type: input.createEmailType || 'home' }]
      }
      if (input.createPhone) {
        body.phoneNumbers = [{ value: input.createPhone, type: input.createPhoneType || 'mobile' }]
      }
      if (input.createCompany || input.createJobTitle) {
        body.organizations = [
          {
            ...(input.createCompany ? { name: input.createCompany } : {}),
            ...(input.createJobTitle ? { title: input.createJobTitle } : {}),
          },
        ]
      }
      if (input.createNotes) {
        body.biographies = [{ value: input.createNotes, contentType: 'TEXT_PLAIN' }]
      }
      if (input.createBirthday) {
        const [year, month, day] = input.createBirthday.split('-')
        body.birthdays = [{ date: { year: Number(year), month: Number(month), day: Number(day) } }]
      }
      if (
        input.createStreetAddress ||
        input.createCity ||
        input.createRegion ||
        input.createPostalCode ||
        input.createCountryCode
      ) {
        body.addresses = [
          {
            streetAddress: input.createStreetAddress || '',
            city: input.createCity || '',
            region: input.createRegion || '',
            postalCode: input.createPostalCode || '',
            countryCode: input.createCountryCode || '',
            type: input.createAddressType || 'home',
          },
        ]
      }
      if (input.createGroup) {
        body.memberships = [
          {
            contactGroupMembership: { contactGroupResourceName: input.createGroup },
          },
        ]
      }

      const result = await contactsApiRequest(token, 'POST', '/people:createContact', body)
      return mapContactResponse(result)
    }

    case 'delete': {
      const contactId = input.deleteContactId
      await contactsApiRequest(token, 'DELETE', `/${contactId}:deleteContact`)
      return { success: 'true' }
    }

    case 'get': {
      const contactId = input.getContactId
      const personFields = resolvePersonFields(input.getFields || '*')

      const result = await contactsApiRequest(token, 'GET', `/${contactId}`, undefined, {
        personFields,
      })
      return mapContactResponse(result)
    }

    case 'getMany': {
      const useQuery = input.getManyUseQuery === 'true'
      const personFields = resolvePersonFields(input.getManyFields || '*')
      const limit = Number(input.getManyLimit || 100)

      let contacts: any[]

      if (useQuery) {
        // Warm up search index
        await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
          query: '',
          readMask: 'names',
        })

        const result = await contactsApiRequest(token, 'GET', '/people:searchContacts', undefined, {
          query: input.getManyQuery || '',
          readMask: personFields,
          pageSize: limit,
        })
        contacts = (result.results || []).map((r: any) => r.person)
      } else {
        const qs: any = {
          personFields,
          pageSize: Math.min(limit, 100),
        }
        if (input.getManySortOrder) qs.sortOrder = input.getManySortOrder

        if (limit <= 100) {
          const result = await contactsApiRequest(
            token,
            'GET',
            '/people/me/connections',
            undefined,
            qs
          )
          contacts = result.connections || []
        } else {
          contacts = await contactsApiRequestAll(
            token,
            'GET',
            '/people/me/connections',
            undefined,
            qs
          )
          contacts = contacts.slice(0, limit)
        }
      }

      return {
        contacts: contacts.map(mapContactResponse),
        count: contacts.length,
      }
    }

    case 'update': {
      const contactId = input.updateContactId
      const updatePersonFields: string[] = []

      // Fetch current etag
      const current = await contactsApiRequest(token, 'GET', `/${contactId}`, undefined, {
        personFields: 'names',
      })

      const body: any = { etag: current.etag }

      const hasNameFields =
        input.updateGivenName ||
        input.updateFamilyName ||
        input.updateMiddleName ||
        input.updateHonorificPrefix ||
        input.updateHonorificSuffix
      if (hasNameFields) {
        body.names = [
          {
            ...(input.updateGivenName ? { givenName: input.updateGivenName } : {}),
            ...(input.updateFamilyName ? { familyName: input.updateFamilyName } : {}),
            ...(input.updateMiddleName ? { middleName: input.updateMiddleName } : {}),
            ...(input.updateHonorificPrefix
              ? { honorificPrefix: input.updateHonorificPrefix }
              : {}),
            ...(input.updateHonorificSuffix
              ? { honorificSuffix: input.updateHonorificSuffix }
              : {}),
          },
        ]
        updatePersonFields.push('names')
      }

      if (input.updateEmail) {
        body.emailAddresses = [{ value: input.updateEmail, type: input.updateEmailType || 'home' }]
        updatePersonFields.push('emailAddresses')
      }
      if (input.updatePhone) {
        body.phoneNumbers = [{ value: input.updatePhone, type: input.updatePhoneType || 'mobile' }]
        updatePersonFields.push('phoneNumbers')
      }
      if (input.updateCompany || input.updateJobTitle) {
        body.organizations = [
          {
            ...(input.updateCompany ? { name: input.updateCompany } : {}),
            ...(input.updateJobTitle ? { title: input.updateJobTitle } : {}),
          },
        ]
        updatePersonFields.push('organizations')
      }
      if (input.updateNotes) {
        body.biographies = [{ value: input.updateNotes, contentType: 'TEXT_PLAIN' }]
        updatePersonFields.push('biographies')
      }
      if (input.updateBirthday) {
        const [year, month, day] = input.updateBirthday.split('-')
        body.birthdays = [{ date: { year: Number(year), month: Number(month), day: Number(day) } }]
        updatePersonFields.push('birthdays')
      }
      if (
        input.updateStreetAddress ||
        input.updateCity ||
        input.updateRegion ||
        input.updatePostalCode ||
        input.updateCountryCode
      ) {
        body.addresses = [
          {
            streetAddress: input.updateStreetAddress || '',
            city: input.updateCity || '',
            region: input.updateRegion || '',
            postalCode: input.updatePostalCode || '',
            countryCode: input.updateCountryCode || '',
            type: input.updateAddressType || 'home',
          },
        ]
        updatePersonFields.push('addresses')
      }
      if (input.updateGroup) {
        body.memberships = [
          {
            contactGroupMembership: { contactGroupResourceName: input.updateGroup },
          },
        ]
        updatePersonFields.push('memberships')
      }

      const personFields = resolvePersonFields('*')
      const result = await contactsApiRequest(token, 'PATCH', `/${contactId}:updateContact`, body, {
        updatePersonFields: updatePersonFields.join(','),
        personFields,
      })
      return mapContactResponse(result)
    }

    default:
      throw new Error(`Unknown contact operation: ${operation}`)
  }
}

function mapContactResponse(person: any) {
  const name = person.names?.[0] || {}
  const email = person.emailAddresses?.[0]?.value || ''
  const phone = person.phoneNumbers?.[0]?.value || ''
  const org = person.organizations?.[0] || {}
  const bio = person.biographies?.[0]?.value || ''

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
    notes: bio,
  }
}
