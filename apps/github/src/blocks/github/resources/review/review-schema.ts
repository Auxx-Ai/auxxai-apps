import { Workflow } from '@auxx/sdk'

export const reviewInputs = {
  // --- Review: Create ---
  createReviewPRNumber: Workflow.string({
    label: 'Pull Request Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  createReviewEvent: Workflow.select({
    label: 'Review Action',
    options: [
      { value: 'APPROVE', label: 'Approve' },
      { value: 'REQUEST_CHANGES', label: 'Request Changes' },
      { value: 'COMMENT', label: 'Comment' },
    ],
    default: 'APPROVE',
  }),
  createReviewBody: Workflow.string({
    label: 'Review Body',
    placeholder: 'Looks good to me!',
    acceptsVariables: true,
  }),
  createReviewCommitId: Workflow.string({
    label: 'Commit SHA',
    description: 'Specific commit to review (defaults to latest)',
    placeholder: 'abc123',
    acceptsVariables: true,
  }),

  // --- Review: Get ---
  getReviewPRNumber: Workflow.string({
    label: 'Pull Request Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  getReviewId: Workflow.string({
    label: 'Review ID',
    acceptsVariables: true,
  }),

  // --- Review: Get Many ---
  getManyReviewsPRNumber: Workflow.string({
    label: 'Pull Request Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  getManyReviewsReturnAll: Workflow.boolean({
    label: 'Return All',
    default: false,
  }),
  getManyReviewsLimit: Workflow.number({
    label: 'Limit',
    default: 50,
    min: 1,
    max: 100,
  }),

  // --- Review: Update ---
  updateReviewPRNumber: Workflow.string({
    label: 'Pull Request Number',
    placeholder: '42',
    acceptsVariables: true,
  }),
  updateReviewId: Workflow.string({
    label: 'Review ID',
    acceptsVariables: true,
  }),
  updateReviewBody: Workflow.string({
    label: 'Review Body',
    placeholder: 'Updated review...',
    acceptsVariables: true,
  }),
}

export function reviewComputeOutputs(operation: string) {
  switch (operation) {
    case 'create':
      return {
        reviewId: Workflow.string({ label: 'Review ID' }),
        reviewState: Workflow.string({ label: 'State' }),
        reviewUrl: Workflow.string({ label: 'URL' }),
      }
    case 'get':
      return {
        reviewId: Workflow.string({ label: 'Review ID' }),
        reviewState: Workflow.string({ label: 'State' }),
        reviewBody: Workflow.string({ label: 'Body' }),
        reviewUser: Workflow.string({ label: 'User' }),
        reviewUrl: Workflow.string({ label: 'URL' }),
        reviewSubmittedAt: Workflow.string({ label: 'Submitted At' }),
      }
    case 'getMany':
      return {
        reviews: Workflow.string({ label: 'Reviews (JSON)' }),
        totalCount: Workflow.string({ label: 'Total Count' }),
      }
    case 'update':
      return {
        reviewId: Workflow.string({ label: 'Review ID' }),
        reviewState: Workflow.string({ label: 'State' }),
      }
    default:
      return {}
  }
}
