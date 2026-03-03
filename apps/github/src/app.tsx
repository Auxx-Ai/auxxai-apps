import { TextBlock } from '@auxx/sdk/client'
import { githubBlock } from './blocks/github/github.workflow'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [githubBlock],
    triggers: [],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">GitHub</TextBlock>
      <TextBlock align="left">
        Manage issues, files, releases, pull requests, and reviews directly from your workflows.
      </TextBlock>
    </>
  )
}
