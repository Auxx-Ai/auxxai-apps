import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { telegramSchema } from '../../telegram-schema'

interface CallbackPanelProps {
  api: UseWorkflowApi<typeof telegramSchema>
}

export function CallbackPanel({ api }: CallbackPanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Answer Query */}
      <ConditionalRender when={(d) => d.operation === 'answerQuery'}>
        <Section title="Callback">
          <VarFieldGroup>
            <VarField>
              <StringInput name="answerQueryId" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <StringInput name="answerQueryText" />
            </VarField>
            <VarField>
              <BooleanInput name="answerQueryShowAlert" />
            </VarField>
            <VarField>
              <StringInput name="answerQueryUrl" />
            </VarField>
            <VarField>
              <NumberInput name="answerQueryCacheTime" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Answer Inline Query */}
      <ConditionalRender when={(d) => d.operation === 'answerInlineQuery'}>
        <Section title="Inline Query">
          <VarFieldGroup>
            <VarField>
              <StringInput name="answerInlineQueryId" />
            </VarField>
            <VarField>
              <StringInput name="answerInlineResults" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <NumberInput name="answerInlineCacheTime" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
