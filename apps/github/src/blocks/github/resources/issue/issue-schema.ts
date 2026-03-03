import { Workflow } from '@auxx/sdk'

export const issueInputs = {
  // --- Issue: Create ---
  createIssueTitle: Workflow.string({
    label: 'Title',
    placeholder: 'Bug: something is broken',
    acceptsVariables: true,
  }),
  createIssueBody: Workflow.string({
    label: 'Body',
    placeholder: 'Describe the issue...',
    acceptsVariables: true,
  }),
  createIssueLabels: Workflow.string({
    label: 'Labels',
    description: 'Comma-separated label names',
    placeholder: 'bug, priority:high',
    acceptsVariables: true,
  }),
  createIssueAssignees: Workflow.string({
    label: 'Assignees',
    description: 'Comma-separated GitHub usernames',
    placeholder: 'octocat, hubot',
    acceptsVariables: true,
  }),

  // --- Issue: Create Comment ---
  commentIssueNumber: Workflow.string({
    label: 'Issue Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  commentBody: Workflow.string({
    label: 'Comment Body',
    placeholder: 'Thanks for reporting this!',
    acceptsVariables: true,
  }),

  // --- Issue: Edit ---
  editIssueNumber: Workflow.string({
    label: 'Issue Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  editIssueTitle: Workflow.string({
    label: 'Title',
    placeholder: 'Updated title',
    acceptsVariables: true,
  }),
  editIssueBody: Workflow.string({
    label: 'Body',
    placeholder: 'Updated body',
    acceptsVariables: true,
  }),
  editIssueState: Workflow.select({
    label: 'State',
    options: [
      { value: '', label: 'No Change' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
    default: '',
  }),
  editIssueStateReason: Workflow.select({
    label: 'State Reason',
    options: [
      { value: '', label: 'No Change' },
      { value: 'completed', label: 'Completed' },
      { value: 'not_planned', label: 'Not Planned' },
      { value: 'reopened', label: 'Reopened' },
    ],
    default: '',
  }),
  editIssueLabels: Workflow.string({
    label: 'Labels',
    description: 'Comma-separated label names (replaces all existing)',
    placeholder: 'bug, priority:high',
    acceptsVariables: true,
  }),
  editIssueAssignees: Workflow.string({
    label: 'Assignees',
    description: 'Comma-separated usernames (replaces all existing)',
    placeholder: 'octocat, hubot',
    acceptsVariables: true,
  }),

  // --- Issue: Get ---
  getIssueNumber: Workflow.string({
    label: 'Issue Number',
    placeholder: '42',
    acceptsVariables: true,
  }),

  // --- Issue: Lock ---
  lockIssueNumber: Workflow.string({
    label: 'Issue Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  lockReason: Workflow.select({
    label: 'Lock Reason',
    options: [
      { value: '', label: 'None' },
      { value: 'off-topic', label: 'Off-topic' },
      { value: 'too heated', label: 'Too Heated' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'spam', label: 'Spam' },
    ],
    default: '',
  }),
}

export function issueComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        issueNumber: Workflow.string({ label: 'Issue Number' }),
        issueUrl: Workflow.string({ label: 'Issue URL' }),
        issueId: Workflow.string({ label: 'Issue ID' }),
        issueState: Workflow.string({ label: 'State' }),
      }
    case 'createComment':
      return {
        commentId: Workflow.string({ label: 'Comment ID' }),
        commentUrl: Workflow.string({ label: 'Comment URL' }),
      }
    case 'edit':
      return {
        issueNumber: Workflow.string({ label: 'Issue Number' }),
        issueUrl: Workflow.string({ label: 'Issue URL' }),
        issueState: Workflow.string({ label: 'State' }),
      }
    case 'get':
      return {
        issueNumber: Workflow.string({ label: 'Issue Number' }),
        issueTitle: Workflow.string({ label: 'Title' }),
        issueBody: Workflow.string({ label: 'Body' }),
        issueState: Workflow.string({ label: 'State' }),
        issueUrl: Workflow.string({ label: 'Issue URL' }),
        issueLabels: Workflow.array({ label: 'Labels', items: Workflow.string() }),
        issueAssignees: Workflow.array({ label: 'Assignees', items: Workflow.string() }),
        issueCreatedAt: Workflow.string({ label: 'Created At' }),
        issueUpdatedAt: Workflow.string({ label: 'Updated At' }),
      }
    case 'lock':
      return {
        locked: Workflow.string({ label: 'Locked' }),
      }
    default:
      return {}
  }
}
