// src/tools/list-airtable-bases.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import airtableIcon from '../assets/icon.png'
import listAirtableBasesExecute from './list-airtable-bases.tool.server'

export const listAirtableBasesTool = defineTool({
  id: 'list_airtable_bases',
  name: 'List Airtable bases',
  description:
    'List Airtable bases the connected account can access. Use this once before fetching a schema or searching records when the user has not named a base explicitly.',
  icon: airtableIcon,
  inputs: z.object({}),
  outputs: z.object({
    bases: z
      .array(
        z.object({
          baseId: z.string().describe('Base id to use in subsequent tool calls (e.g. appXYZ123).'),
          name: z.string().describe('Human-readable base name.'),
          permissionLevel: z.string().describe('owner | create | edit | comment | read.'),
        })
      )
      .describe('All bases accessible to the connected Airtable account.'),
  }),
  config: {
    requiresConnection: true,
    timeout: 10000,
  },
  execute: listAirtableBasesExecute,
})
