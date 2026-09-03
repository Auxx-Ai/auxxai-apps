// src/entities.ts
//
// Definitions this app owns end to end — the owned side of the GitHub Issues
// data connector. `issues` carries every field the connector's `issue` stream
// projects; `githubId` is the external id (the GitHub issue id), so it is the
// entity's `identity` field.

import { defineEntity } from '@auxx/sdk/entities'

export const issues = defineEntity({
  key: 'issues',
  apiSlug: 'github_issues',
  singular: 'GitHub Issue',
  plural: 'GitHub Issues',
  primaryDisplayField: 'title',
  fields: [
    { key: 'githubId', type: 'TEXT', name: 'GitHub Issue ID', identity: true },
    { key: 'number', type: 'NUMBER', name: 'Number' },
    { key: 'title', type: 'TEXT', name: 'Title' },
    { key: 'state', type: 'TEXT', name: 'State' },
    { key: 'body', type: 'RICH_TEXT', name: 'Body' },
    { key: 'author', type: 'TEXT', name: 'Author' },
    { key: 'comments', type: 'NUMBER', name: 'Comments' },
    { key: 'url', type: 'URL', name: 'URL' },
    { key: 'createdAt', type: 'DATETIME', name: 'Created' },
    { key: 'updatedAt', type: 'DATETIME', name: 'Updated' },
  ],
})
