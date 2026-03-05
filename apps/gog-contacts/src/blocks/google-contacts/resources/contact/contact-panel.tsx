import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { googleContactsSchema } from '../../google-contacts-schema'

type SelectOption = { label: string; value: string }

interface ContactPanelProps {
  api: UseWorkflowApi<typeof googleContactsSchema>
  groups: SelectOption[]
  groupsLoading: boolean
}

export function ContactPanel({ api, groups, groupsLoading }: ContactPanelProps) {
  const { StringInput, OptionsInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      {/* Contact: Create */}
      <ConditionalRender when={(d) => d.operation === 'create'}>
        <Section title="Contact">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'createFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'createMiddleName'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Contact Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createEmail'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createEmailType'} />
            </VarField>
            <VarField>
              <StringInput name={'createPhone'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createPhoneType'} />
            </VarField>
            <VarField>
              <StringInput name={'createCompany'} />
            </VarField>
            <VarField>
              <StringInput name={'createJobTitle'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Additional Info" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createBirthday'} />
            </VarField>
            <VarField>
              <StringInput name={'createNotes'} />
            </VarField>
            <VarField>
              <StringInput name={'createHonorificPrefix'} />
            </VarField>
            <VarField>
              <StringInput name={'createHonorificSuffix'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'createStreetAddress'} />
            </VarField>
            <VarField>
              <StringInput name={'createCity'} />
            </VarField>
            <VarField>
              <StringInput name={'createRegion'} />
            </VarField>
            <VarField>
              <StringInput name={'createPostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'createCountryCode'} />
            </VarField>
            <VarField>
              <OptionsInput name={'createAddressType'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Group" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'createGroup'}
                options={groupsLoading ? [{ label: 'Loading groups...', value: '' }] : groups}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Contact: Delete */}
      <ConditionalRender when={(d) => d.operation === 'delete'}>
        <Section title="Contact to Delete">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'deleteContactId'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Contact: Get */}
      <ConditionalRender when={(d) => d.operation === 'get'}>
        <Section title="Contact">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'getContactId'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getFields'} />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Contact: Get Many */}
      <ConditionalRender when={(d) => d.operation === 'getMany'}>
        <Section title="Contacts">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name={'getManyUseQuery'} />
            </VarField>
            <ConditionalRender when={(d) => d.getManyUseQuery === 'true'}>
              <VarField>
                <StringInput name={'getManyQuery'} />
              </VarField>
            </ConditionalRender>
            <VarField>
              <OptionsInput name={'getManyFields'} />
            </VarField>
            <VarField>
              <OptionsInput name={'getManyLimit'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <ConditionalRender when={(d) => d.getManyUseQuery !== 'true'}>
          <Section title="Options" collapsible>
            <VarFieldGroup>
              <VarField>
                <OptionsInput name={'getManySortOrder'} />
              </VarField>
            </VarFieldGroup>
          </Section>
        </ConditionalRender>
      </ConditionalRender>

      {/* Contact: Update */}
      <ConditionalRender when={(d) => d.operation === 'update'}>
        <Section title="Contact">
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateContactId'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Name" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateGivenName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateFamilyName'} />
            </VarField>
            <VarField>
              <StringInput name={'updateMiddleName'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Contact Details" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateEmail'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateEmailType'} />
            </VarField>
            <VarField>
              <StringInput name={'updatePhone'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updatePhoneType'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCompany'} />
            </VarField>
            <VarField>
              <StringInput name={'updateJobTitle'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Additional Info" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateBirthday'} />
            </VarField>
            <VarField>
              <StringInput name={'updateNotes'} />
            </VarField>
            <VarField>
              <StringInput name={'updateHonorificPrefix'} />
            </VarField>
            <VarField>
              <StringInput name={'updateHonorificSuffix'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Address" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name={'updateStreetAddress'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCity'} />
            </VarField>
            <VarField>
              <StringInput name={'updateRegion'} />
            </VarField>
            <VarField>
              <StringInput name={'updatePostalCode'} />
            </VarField>
            <VarField>
              <StringInput name={'updateCountryCode'} />
            </VarField>
            <VarField>
              <OptionsInput name={'updateAddressType'} />
            </VarField>
          </VarFieldGroup>
        </Section>

        <Section title="Group" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput
                name={'updateGroup'}
                options={groupsLoading ? [{ label: 'Loading groups...', value: '' }] : groups}
              />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
