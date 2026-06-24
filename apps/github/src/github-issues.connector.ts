// src/github-issues.connector.ts
//
// GitHub Issues data connector — syncs a repository's issues into an app-OWNED
// `github_issues` entity def (the platform creates the def + fields from the
// declarations below at setup; step-11 owned-mode materialization). One `issue`
// stream whose `execute` pages the REST /issues endpoint, returning ONE page + a
// `page=N` cursor per call. The platform loops `execute` (Step 11), validates each
// record against the stream schema, and writes it into the owned def.
//
// Owned (not contributing): GitHub issues are their own entity type, not an
// enrichment of an existing Contact. External id = the GitHub issue id (primary
// key); idempotent re-sync binds on it. `incremental` so the backfill runs once
// then steady `since`-floored delta runs.

import { defineDataConnector } from '@auxx/sdk/data-connectors'
import { z } from '@auxx/sdk/tools'
import githubIssuesSync from './github-issues.connector.server'

export const githubIssuesConnector = defineDataConnector({
  id: 'github.issues',
  label: 'GitHub Issues',
  requiresConnection: true,
  iconKey: 'circle-dot',
  // Which repository to sync, as a single `<owner>/<repo>` full-name. The setup
  // form renders this as a live dropdown of the connected account's repos (see
  // `configOptions` below); the server splits on `/`. Optional — blank falls back
  // to a busy public repo (facebook/react) that pages many times.
  config: z.object({
    repo: z.string().optional().describe('Repository, as `<owner>/<repo>` (e.g. "facebook/react")'),
  }),
  // Render `repo` as a searchable dropdown backed by the `github_list_repos` tool,
  // invoked through this connector's own GitHub connection. `fullName` is both the
  // stored value and the label. `allowCustom`: the listed repos are suggestions —
  // you can also type any `<owner>/<repo>` the token can't list (e.g. a public
  // repo like `facebook/react`); the server splits the typed full-name on `/`.
  configOptions: {
    repo: {
      kind: 'dynamic-select',
      dynamicSelect: {
        optionsFrom: 'github_list_repos',
        itemsPath: 'repos',
        valuePath: 'fullName',
        labelTemplate: '{fullName}',
        emptyHint: 'No repositories found for the connected account',
        allowCustom: true,
      },
    },
  },
  streams: [
    {
      key: 'issue',
      // `incremental`: backfill once, then steady `updated_at`-floored delta runs.
      syncMode: 'incremental',
      displayFieldKey: 'title',
      // SOURCE schema (Layer A) — one fetched issue. Keys are `fieldKey`; the
      // server returns `ConnectorRecord.fields` keyed by `sourcePath`.
      fields: {
        id: { type: 'TEXT', name: 'GitHub Issue ID', sourcePath: 'id' },
        number: { type: 'NUMBER', name: 'Number', sourcePath: 'number' },
        title: { type: 'TEXT', name: 'Title', sourcePath: 'title' },
        state: { type: 'TEXT', name: 'State', sourcePath: 'state' },
        body: { type: 'RICH_TEXT', name: 'Body', sourcePath: 'body' },
        author: { type: 'TEXT', name: 'Author', sourcePath: 'author' },
        comments: { type: 'NUMBER', name: 'Comments', sourcePath: 'comments' },
        url: { type: 'URL', name: 'URL', sourcePath: 'url' },
        createdAt: { type: 'DATETIME', name: 'Created', sourcePath: 'created_at' },
        updatedAt: { type: 'DATETIME', name: 'Updated', sourcePath: 'updated_at' },
      },
      // OWNED — the platform provisions the `github_issues` def + these fields and
      // binds concrete refs at setup (no manual mapping needed).
      defaultMappings: [
        {
          rootPath: '',
          target: {
            mode: 'owned',
            entity: {
              apiSlug: 'github_issues',
              singular: 'GitHub Issue',
              plural: 'GitHub Issues',
              primaryDisplayField: 'title',
            },
          },
        },
      ],
      exampleRecord: {
        id: '1',
        number: 42,
        title: 'Something is broken',
        state: 'open',
        body: 'Steps to reproduce…',
        author: 'octocat',
        comments: 3,
        url: 'https://github.com/facebook/react/issues/42',
        created_at: '2024-02-11T10:00:00Z',
        updated_at: '2024-03-01T12:00:00Z',
      },
    },
  ],
  execute: githubIssuesSync,
})
