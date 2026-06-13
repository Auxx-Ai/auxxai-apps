// src/app.tsx

import { TextBlock } from '@auxx/sdk/client'
import { supabaseBlock } from './blocks/supabase/supabase.workflow'
import { deleteSupabaseRowsTool } from './tools/delete-supabase-rows.tool'
import { findSupabaseRowTool } from './tools/find-supabase-row.tool'
import { getSupabaseTableSchemaTool } from './tools/get-supabase-table-schema.tool'
import { insertSupabaseRowTool } from './tools/insert-supabase-row.tool'
import { listSupabaseTablesTool } from './tools/list-supabase-tables.tool'
import { searchSupabaseRowsTool } from './tools/search-supabase-rows.tool'
import { updateSupabaseRowsTool } from './tools/update-supabase-rows.tool'
import { supabaseToolsets } from './tools/toolsets'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },

  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },

  workflow: {
    blocks: [supabaseBlock],
    triggers: [],
  },
  tools: [
    listSupabaseTablesTool,
    getSupabaseTableSchemaTool,
    findSupabaseRowTool,
    searchSupabaseRowsTool,
    insertSupabaseRowTool,
    updateSupabaseRowsTool,
    deleteSupabaseRowsTool,
  ],
  toolsets: supabaseToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Supabase Integration</TextBlock>
      <TextBlock align="left">
        Connect your Supabase project to read and write table rows directly from Auxx workflows and
        Kopilot agents. Set your project URL in Settings and paste your Service Role key in the
        connection dialog.
      </TextBlock>
    </>
  )
}
