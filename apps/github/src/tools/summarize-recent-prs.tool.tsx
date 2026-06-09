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
  exampleOutput: {
    summary:
      '8 PRs in the last 7 days: 6 open, 2 merged. 3 awaiting review (top pending reviewer: monalisa with 2). CI: 1 failing (lint on #1043). Oldest open PR is #1018, open 6 days.',
    pullRequests: [
      {
        repoFullName: 'octocat/hello-world',
        prNumber: 1043,
        title: 'Fix mobile Safari login button',
        state: 'open',
        isDraft: false,
        author: 'octocat',
        headRef: 'fix/mobile-login',
        baseRef: 'main',
        url: 'https://github.com/octocat/hello-world/pull/1043',
        updatedAt: '2026-06-08T13:00:00Z',
        additions: 42,
        deletions: 11,
        changedFiles: 3,
        requestedReviewers: ['monalisa'],
        topReviews: [
          {
            author: 'hubot',
            state: 'COMMENTED',
            submittedAt: '2026-06-08T12:30:00Z',
          },
        ],
        checksState: 'FAILURE',
        checksSummary: '5 passed, 1 failed (lint)',
      },
      {
        repoFullName: 'octocat/hello-world',
        prNumber: 1039,
        title: 'Add dark mode support',
        state: 'merged',
        isDraft: false,
        author: 'monalisa',
        headRef: 'feature/dark-mode',
        baseRef: 'main',
        url: 'https://github.com/octocat/hello-world/pull/1039',
        updatedAt: '2026-06-06T17:20:00Z',
        additions: 318,
        deletions: 54,
        changedFiles: 12,
        requestedReviewers: [],
        topReviews: [
          {
            author: 'octocat',
            state: 'APPROVED',
            submittedAt: '2026-06-06T16:00:00Z',
          },
        ],
        checksState: 'SUCCESS',
        checksSummary: '6 passed',
      },
    ],
  },
  config: {
    requiresConnection: true,
    timeout: 60000,
    streaming: true,
  },
  execute: summarizeRecentPrsExecute,
  agent: { toolsetSlug: 'github.pulls', streaming: true },
})
