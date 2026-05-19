// src/tools/shared/map-contact.ts

/**
 * Google People API `Person` → tool-shaped object. Returns structured
 * arrays (all emails/phones/groups), unlike the workflow block's
 * `mapContactResponse` which returns a flat single-email/single-phone
 * shape for variable splicing. Different consumers — don't share.
 *
 * See plans/kopilot/apps/gog-contacts-overhaul.md §7 ("`map-contact.ts`
 * is the tool-shape mapper, not the workflow mapper").
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ContactEmail {
  value: string
  type: string | null
}

export interface ContactPhone {
  value: string
  type: string | null
}

export interface ContactGroup {
  resourceName: string
  name: string | null
}

export interface ContactAddress {
  type: string | null
  streetAddress: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  countryCode: string | null
  formattedValue: string | null
}

export interface ContactUrl {
  value: string
  type: string | null
}

export interface BaseMappedContact {
  resourceName: string
  contactId: string
  givenName: string | null
  familyName: string | null
  displayName: string | null
  emails: ContactEmail[]
  phones: ContactPhone[]
  company: string | null
  jobTitle: string | null
  notes: string | null
  birthday: string | null
  groups: ContactGroup[]
}

export interface FullMappedContact extends BaseMappedContact {
  middleName: string | null
  honorificPrefix: string | null
  honorificSuffix: string | null
  addresses: ContactAddress[]
  urls: ContactUrl[]
  photoUrl: string | null
  etag: string
}

function shortId(resourceName: string): string {
  const slash = resourceName.indexOf('/')
  return slash >= 0 ? resourceName.slice(slash + 1) : resourceName
}

function formatBirthday(person: any): string | null {
  const date = person.birthdays?.[0]?.date
  if (!date) return null
  const { year, month, day } = date
  if (!year || !month || !day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function mapBase(person: any): BaseMappedContact {
  const name = person.names?.[0] ?? {}
  const org = person.organizations?.[0] ?? {}
  return {
    resourceName: person.resourceName ?? '',
    contactId: shortId(person.resourceName ?? ''),
    givenName: name.givenName ?? null,
    familyName: name.familyName ?? null,
    displayName:
      name.displayName ?? `${name.givenName ?? ''} ${name.familyName ?? ''}`.trim() ?? null,
    emails: (person.emailAddresses ?? []).map((e: any) => ({
      value: e.value ?? '',
      type: e.type ?? null,
    })),
    phones: (person.phoneNumbers ?? []).map((p: any) => ({
      value: p.value ?? '',
      type: p.type ?? null,
    })),
    company: org.name ?? null,
    jobTitle: org.title ?? null,
    notes: person.biographies?.[0]?.value ?? null,
    birthday: formatBirthday(person),
    groups: (person.memberships ?? [])
      .map((m: any) => m.contactGroupMembership)
      .filter(Boolean)
      .map((g: any) => ({
        resourceName: g.contactGroupResourceName ?? '',
        name: null,
      })),
  }
}

export function mapContactForTool(person: any): BaseMappedContact {
  return mapBase(person)
}

export function mapContactForToolFull(person: any): FullMappedContact {
  const name = person.names?.[0] ?? {}
  return {
    ...mapBase(person),
    middleName: name.middleName ?? null,
    honorificPrefix: name.honorificPrefix ?? null,
    honorificSuffix: name.honorificSuffix ?? null,
    addresses: (person.addresses ?? []).map((a: any) => ({
      type: a.type ?? null,
      streetAddress: a.streetAddress ?? null,
      city: a.city ?? null,
      region: a.region ?? null,
      postalCode: a.postalCode ?? null,
      countryCode: a.countryCode ?? null,
      formattedValue: a.formattedValue ?? null,
    })),
    urls: (person.urls ?? []).map((u: any) => ({
      value: u.value ?? '',
      type: u.type ?? null,
    })),
    photoUrl: person.photos?.[0]?.url ?? null,
    etag: person.etag ?? '',
  }
}
