const BASE_URL = 'https://people.googleapis.com/v1'

const ALL_PERSON_FIELDS = [
  'addresses',
  'biographies',
  'birthdays',
  'coverPhotos',
  'emailAddresses',
  'events',
  'genders',
  'imClients',
  'interests',
  'locales',
  'memberships',
  'metadata',
  'names',
  'nicknames',
  'occupations',
  'organizations',
  'phoneNumbers',
  'photos',
  'relations',
  'residences',
  'sipAddresses',
  'skills',
  'urls',
  'userDefined',
]

export function resolvePersonFields(fieldValue: string): string {
  if (fieldValue === '*') return ALL_PERSON_FIELDS.join(',')
  return fieldValue
}

export async function contactsApiRequest(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>
) {
  const url = new URL(`${BASE_URL}${path}`)
  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error?.message || `Google Contacts API error: ${response.status}`)
  }

  if (response.status === 204) return { success: true }
  return response.json()
}

export async function contactsApiRequestAll(
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  qs?: Record<string, string | number | boolean>,
  propertyName = 'connections'
) {
  const items: any[] = []
  let pageToken: string | undefined

  do {
    const result = await contactsApiRequest(accessToken, method, path, body, {
      ...qs,
      pageSize: 100,
      ...(pageToken ? { pageToken } : {}),
    })
    if (result[propertyName]) items.push(...result[propertyName])
    pageToken = result.nextPageToken
  } while (pageToken)

  return items
}
