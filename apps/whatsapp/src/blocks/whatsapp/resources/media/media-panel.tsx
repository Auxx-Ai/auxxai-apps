// src/blocks/whatsapp/resources/media/media-panel.tsx

type MediaPanelProps = {
  api: any
  phoneNumbers: { label: string; value: string }[]
}

export function MediaPanel({ api, phoneNumbers }: MediaPanelProps) {
  const { OptionsInput, StringInput, VarField, VarFieldGroup, Section, ConditionalRender } = api

  return (
    <>
      <ConditionalRender when={(d: any) => d.operation === 'upload'}>
        <Section title="Upload">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="uploadPhoneNumberId" options={phoneNumbers} />
            </VarField>
            <VarField>
              <StringInput name="uploadMediaUrl" placeholder="https://example.com/file.jpg" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'getUrl'}>
        <Section title="Get Media URL">
          <VarFieldGroup>
            <VarField>
              <StringInput name="getUrlMediaId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'delete'}>
        <Section title="Delete Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteMediaId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
