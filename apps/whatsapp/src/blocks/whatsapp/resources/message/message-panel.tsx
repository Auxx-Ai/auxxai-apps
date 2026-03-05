// src/blocks/whatsapp/resources/message/message-panel.tsx

type MessagePanelProps = {
  api: any
  phoneNumbers: { label: string; value: string }[]
  templates: { label: string; value: string }[]
}

export function MessagePanel({ api, phoneNumbers, templates }: MessagePanelProps) {
  const {
    OptionsInput,
    StringInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      <Section title="Destination">
        <VarFieldGroup>
          <VarField>
            <OptionsInput name="phoneNumberId" options={phoneNumbers} />
          </VarField>
          <VarField>
            <StringInput name="recipientPhone" placeholder="+1234567890" />
          </VarField>
        </VarFieldGroup>
      </Section>

      <ConditionalRender when={(d: any) => d.operation === 'sendText'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendTextBody" multiline rows={4} />
            </VarField>
            <VarField>
              <BooleanInput name="sendTextPreviewUrl" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'sendMedia'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendMediaType" />
            </VarField>
            <VarField>
              <StringInput name="sendMediaUrl" placeholder="https://example.com/image.jpg" />
            </VarField>
            <VarField>
              <StringInput name="sendMediaCaption" />
            </VarField>
            <ConditionalRender when={(d: any) => d.sendMediaType === 'document'}>
              <VarField>
                <StringInput name="sendMediaFilename" placeholder="file.pdf" />
              </VarField>
            </ConditionalRender>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'sendTemplate'}>
        <Section title="Template">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendTemplateId" options={templates} />
            </VarField>
            <VarField>
              <StringInput
                name="sendTemplateComponents"
                multiline
                rows={4}
                placeholder='[{"type":"body","parameters":[{"type":"text","text":"value"}]}]'
              />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'sendContacts'}>
        <Section title="Contact">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendContactFormattedName" placeholder="John Doe" />
            </VarField>
            <VarField>
              <StringInput name="sendContactFirstName" placeholder="John" />
            </VarField>
            <VarField>
              <StringInput name="sendContactLastName" placeholder="Doe" />
            </VarField>
            <VarField>
              <StringInput name="sendContactPhone" placeholder="+1234567890" />
            </VarField>
            <VarField>
              <StringInput name="sendContactEmail" placeholder="john@example.com" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      <ConditionalRender when={(d: any) => d.operation === 'sendLocation'}>
        <Section title="Location">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendLocationLatitude" placeholder="37.775" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationLongitude" placeholder="-122.425" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationName" placeholder="San Francisco" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationAddress" placeholder="1 Market St" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
