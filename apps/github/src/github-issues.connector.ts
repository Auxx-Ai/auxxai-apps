// src/github-issues.connector.ts
//
// GitHub Issues data connector — syncs a repository's issues into the app-OWNED
// `issues` entity (declared in `entities.ts`). One `issue` stream whose `execute`
// pages the REST /issues endpoint, returning ONE page + a `page=N` cursor per
// call. The platform loops `execute`, validates each record against the stream
// schema, and writes it into the owned entity.
//
// Owned (not contributing): GitHub issues are their own entity type, not an
// enrichment of an existing Contact. External id = the GitHub issue id
// (`githubId`, `identity: true` on the entity); idempotent re-sync binds on it.
// `incremental` so the backfill runs once then steady `since`-floored delta runs.

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
    repo: z
      .string()
      .optional()
      .describe(
        'Which repository to sync — full name as `<owner>/<repo>`, e.g. `facebook/react`. Pick one of your repos from the list or type any public repo.'
      ),
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
      mappings: [
        {
          // Root record — owned `issues`. Each field's `key` names a field
          // already declared on the entity (`entities.ts`); type/name/identity
          // are inherited from there. `sourcePath` matches what
          // `github-issues.connector.server.ts` projects onto
          // `ConnectorRecord.fields`.
          rootPath: '',
          target: { entityKey: 'issues' },
          fields: [
            { key: 'githubId', sourcePath: 'id' },
            { key: 'number', sourcePath: 'number' },
            { key: 'title', sourcePath: 'title' },
            { key: 'state', sourcePath: 'state' },
            { key: 'body', sourcePath: 'body' },
            { key: 'author', sourcePath: 'author' },
            { key: 'comments', sourcePath: 'comments' },
            { key: 'url', sourcePath: 'url' },
            { key: 'createdAt', sourcePath: 'created_at' },
            { key: 'updatedAt', sourcePath: 'updated_at' },
          ],
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
