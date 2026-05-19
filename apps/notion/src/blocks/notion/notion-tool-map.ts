// src/blocks/notion/notion-tool-map.ts

/**
 * Dispatch table mapping `<resource>.<operation>` to the internal tool id
 * that backs that block branch. Used by both the block declaration
 * (`toolMap` field — harvested at catalog build) and the runtime
 * dispatcher in `notion.server.ts`.
 */
export const notionToolMap: Record<string, string> = {
  'databasePage.create': 'notion_block_create_database_page',
  'databasePage.get': 'notion_block_get_database_page',
  'databasePage.getMany': 'notion_block_get_many_database_pages',
  'databasePage.update': 'notion_block_update_database_page',
  'page.archive': 'notion_block_archive_page',
  'page.create': 'notion_block_create_page',
  'page.search': 'notion_block_search_pages',
  'block.append': 'notion_block_append_blocks',
  'block.getChildren': 'notion_block_get_block_children',
  'database.get': 'notion_block_get_database',
  'database.getMany': 'notion_block_get_many_databases',
  'database.search': 'notion_block_search_databases',
  'user.get': 'notion_block_get_user',
  'user.getMany': 'notion_block_get_many_users',
}
