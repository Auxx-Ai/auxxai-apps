// src/tools/get-github-pull-request.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import githubIcon from '../assets/icon.png'
import getGithubPullRequestExecute from './get-github-pull-request.tool.server'

export const getGithubPullRequestTool = defineTool({
  id: 'get_github_pull_request',
  name: 'Get GitHub pull request',
  description:
    'Composite fetch of a GitHub pull request — metadata, body, recent reviews, last-commit check status, and (optionally) the changed-file list. Single GraphQL round-trip. Use when the user asks for PR status, review state, or CI results.',
  icon: githubIcon,
  inputs: z.object({
    owner: z.string(),
    repo: z.string(),
    prNumber: z.number().int(),
    includeReviews: z.boolean().optional().describe('Default true.'),
    includeChecks: z.boolean().optional().describe('Default true.'),
    includeFiles: z
      .boolean()
      .optional()
      .describe('Default false. File list can be large (50+ files); LLM rarely needs it.'),
    reviewsLimit: z.number().int().min(1).max(50).optional().describe('Default 20.'),
  }),
  outputs: z.object({
    prNumber: z.number().int(),
    title: z.string(),
    body: z.string().nullable(),
    state: z.enum(['open', 'closed', 'merged']),
    isDraft: z.boolean(),
    author: z.string().nullable(),
    headRef: z.string(),
    baseRef: z.string(),
    url: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    mergedAt: z.string().nullable(),
    mergedBy: z.string().nullable(),
    commentsCount: z.number().int(),
    additions: z.number().int(),
    deletions: z.number().int(),
    changedFiles: z.number().int(),
    labels: z.array(z.string()),
    assignees: z.array(z.string()),
    requestedReviewers: z
      .array(z.string())
      .describe('GitHub logins of users still pending review.'),
    reviews: z
      .array(
        z.object({
          reviewId: z.string(),
          author: z.string().nullable(),
          state: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
          body: z.string().nullable(),
          submittedAt: z.string().nullable(),
          url: z.string(),
        })
      )
      .describe('Most-recent-first. Empty when includeReviews=false.'),
    checks: z
      .object({
        state: z
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
        summary: z
          .string()
          .describe('LLM-friendly rollup, e.g. "5 passed, 1 failed (lint, typecheck)".'),
        runs: z.array(
          z.object({
            name: z.string(),
            conclusion: z.string().nullable(),
            url: z.string().nullable(),
          })
        ),
      })
      .nullable()
      .describe('Null when includeChecks=false.'),
    files: z
      .array(
        z.object({
          path: z.string(),
          additions: z.number().int(),
          deletions: z.number().int(),
          status: z.enum(['ADDED', 'MODIFIED', 'REMOVED', 'RENAMED', 'COPIED', 'CHANGED']),
        })
      )
      .describe('Empty when includeFiles=false.'),
  }),
  exampleOutput: {
    prNumber: 1043,
    title: 'Fix mobile Safari login button',
    body: 'Resolves the unresponsive login button on iOS Safari by fixing the overlay z-index. Closes #1042.',
    state: 'open',
    isDraft: false,
    author: 'octocat',
    headRef: 'fix/mobile-login',
    baseRef: 'main',
    url: 'https://github.com/octocat/hello-world/pull/1043',
    createdAt: '2026-06-07T09:00:00Z',
    updatedAt: '2026-06-08T13:00:00Z',
    mergedAt: null,
    mergedBy: null,
    commentsCount: 3,
    additions: 42,
    deletions: 11,
    changedFiles: 3,
    labels: ['bug', 'mobile'],
    assignees: ['octocat'],
    requestedReviewers: ['monalisa'],
    reviews: [
      {
        reviewId: 'PRR_kwDOABCD12345',
        author: 'hubot',
        state: 'COMMENTED',
        body: 'Looks reasonable, one nit on naming.',
        submittedAt: '2026-06-08T12:30:00Z',
        url: 'https://github.com/octocat/hello-world/pull/1043#pullrequestreview-1987654321',
      },
    ],
    checks: {
      state: 'FAILURE',
      summary: '5 passed, 1 failed (lint)',
      runs: [
        {
          name: 'lint',
          conclusion: 'FAILURE',
          url: 'https://github.com/octocat/hello-world/actions/runs/9876543210',
        },
        {
          name: 'test',
          conclusion: 'SUCCESS',
          url: 'https://github.com/octocat/hello-world/actions/runs/9876543211',
        },
      ],
    },
    files: [],
  },
  config: {
    requiresConnection: true,
    timeout: 20000,
  },
  execute: getGithubPullRequestExecute,
  agent: { toolsetSlug: 'github.pulls' },
})
