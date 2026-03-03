import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { telegramSchema } from '../../telegram-schema'

interface FilePanelProps {
  api: UseWorkflowApi<typeof telegramSchema>
}

export function FilePanel({ api }: FilePanelProps) {
  const { StringInput, VarField, VarFieldGroup, Section } = api

  return (
    <Section title="File">
      <VarFieldGroup>
        <VarField>
          <StringInput name="getFileId" />
        </VarField>
      </VarFieldGroup>
    </Section>
  )
}
