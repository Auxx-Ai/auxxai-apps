// src/tools/summarize-recent-prs.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import summarizeRecentPrsExecute from './summarize-recent-prs.tool.server'

const TrimmedPr = z.object({
  repoFullName: z.string(),
  prNumber: z.number().int(),
  title: z.string(),
  state: z.enum(['open', 'closed', 'merged']),
  isDraft: z.boolean(),
  author: z.string().nullable(),
  headRef: z.string(),
  baseRef: z.string(),
  url: z.string(),
  updatedAt: z.string(),
  additions: z.number().int(),
  deletions: z.number().int(),
  changedFiles: z.number().int(),
  requestedReviewers: z.array(z.string()),
  topReviews: z
    .array(
      z.object({
        author: z.string().nullable(),
        state: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
        submittedAt: z.string().nullable(),
      })
    )
    .describe('Up to 5 most recent reviews.'),
  checksState: z
    .enum([
      'SUCCESS',
      'FAILURE',
      'PENDING',
      'NEUTRAL',
      'CANCELLED',
      'TIMED_OUT',
      'ACTION_REQUIRED',
      'SKIPPED',
      'EXPECTED',
    ])
    .nullable(),
  checksSummary: z.string().nullable(),
})

export const summarizeRecentPrsTool = defineTool({
  id: 'summarize_recent_prs',
  name: 'Summarize recent GitHub pull requests',
  description:
    'Fan out across recent GitHub pull requests, emit per-PR progress as detail+reviews+checks are fetched, and return a rollup summary (open vs merged, top reviewers pending, CI failure breakdown, oldest open PR).',
  icon: githubIcon,
  inputs: z.object({
    owner: z
      .string()
      .optional()
      .describe(
        'Restrict to owner. Omit owner + repo for "PRs across everything I have access to".'
      ),
    repo: z.string().optional(),
    state: z.enum(['open', 'closed', 'merged', 'all']).optional().describe('Default open.'),
    since: z.string().optional().describe('Default 7 days ago.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe('Default 10. Hard max 25 (chat budget — each PR is a composite fetch).'),
    includeChecks: z.boolean().optional().describe('Default true. Adds 1 sub-selection per PR.'),
  }),
  outputs: z.object({
    summary: z
      .string()
      .describe(
        'LLM-readable rollup: open vs merged counts, top reviewers pending, CI failure breakdown, oldest open PR.'
      ),
    pullRequests: z.array(TrimmedPr),
  }),
  config: {
    requiresConnection: true,
    timeout: 60000,
    streaming: true,
  },
  execute: summarizeRecentPrsExecute,
  agent: { toolsetSlug: 'github.pulls', streaming: true },
})
