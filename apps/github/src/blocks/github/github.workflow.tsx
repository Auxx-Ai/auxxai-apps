import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import githubIcon from '../../assets/icon.png'
import githubExecute from './github.server'
import { GitHubPanel } from './github-panel'
import { githubSchema } from './github-schema'

export { githubSchema }

function GitHubNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'GitHub'
  let summary: string | undefined

  if (data.resource === 'issue') {
    switch (data.operation) {
      case 'create':
        label = 'Create Issue'
        summary = data.createIssueTitle || undefined
        break
      case 'createComment':
        label = 'Comment on Issue'
        summary = data.commentIssueNumber ? `#${data.commentIssueNumber}` : undefined
        break
      case 'edit':
        label = 'Edit Issue'
        summary = data.editIssueNumber ? `#${data.editIssueNumber}` : undefined
        break
      case 'get':
        label = 'Get Issue'
        summary = data.getIssueNumber ? `#${data.getIssueNumber}` : undefined
        break
      case 'lock':
        label = 'Lock Issue'
        summary = data.lockIssueNumber ? `#${data.lockIssueNumber}` : undefined
        break
    }
  } else if (data.resource === 'file') {
    switch (data.operation) {
      case 'create':
        label = 'Create File'
        summary = data.createFilePath || undefined
        break
      case 'delete':
        label = 'Delete File'
        summary = data.deleteFilePath || undefined
        break
      case 'edit':
        label = 'Edit File'
        summary = data.editFilePath || undefined
        break
      case 'get':
        label = 'Get File'
        summary = data.getFilePath || undefined
        break
      case 'list':
        label = 'List Files'
        summary = data.listFilePath || 'root'
        break
    }
  } else if (data.resource === 'repository') {
    switch (data.operation) {
      case 'get':
        label = 'Get Repository'
        break
      case 'getIssues':
        label = 'Get Issues'
        break
      case 'getPullRequests':
        label = 'Get Pull Requests'
        break
    }
    summary = data.repo || undefined
  } else if (data.resource === 'release') {
    switch (data.operation) {
      case 'create':
        label = 'Create Release'
        summary = data.createReleaseTag || undefined
        break
      case 'delete':
        label = 'Delete Release'
        break
      case 'get':
        label = 'Get Release'
        break
      case 'getMany':
        label = 'Get Releases'
        break
      case 'update':
        label = 'Update Release'
        break
    }
  } else if (data.resource === 'review') {
    switch (data.operation) {
      case 'create':
        label = 'Create Review'
        break
      case 'get':
        label = 'Get Review'
        break
      case 'getMany':
        label = 'Get Reviews'
        break
      case 'update':
        label = 'Update Review'
        break
    }
  }

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />

      <WorkflowNodeRow label={label} />

      {summary && (
        <WorkflowNodeText className="text-xs text-muted-foreground">{summary}</WorkflowNodeText>
      )}

      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}

      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const githubBlock = {
  id: 'github',
  label: 'GitHub',
  description:
    'Interact with GitHub \u2014 manage issues, files, releases, pull requests, and reviews',
  category: 'action',
  icon: githubIcon,
  color: '#24292F',
  schema: githubSchema,
  node: GitHubNode,
  panel: GitHubPanel,
  execute: githubExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof githubSchema>
