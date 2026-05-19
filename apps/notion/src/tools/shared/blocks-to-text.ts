// src/tools/shared/blocks-to-text.ts

/**
 * Flatten a Notion block array into a markdown-flavored plain-text string the
 * LLM can reason over. Exotic block types (callouts, embeds, child databases)
 * become `[<type>: …]` markers — lossy but readable.
 *
 * See plans/kopilot/apps/notion-overhaul.md §4.11.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function richTextToString(rich: any): string {
  if (!Array.isArray(rich)) return ''
  return rich.map((t: any) => t.plain_text ?? '').join('')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBlock(block: any): string {
  if (!block) return ''
  const type = block.type
  const data = block[type]

  switch (type) {
    case 'paragraph':
      return richTextToString(data?.rich_text)
    case 'heading_1':
      return `# ${richTextToString(data?.rich_text)}`
    case 'heading_2':
      return `## ${richTextToString(data?.rich_text)}`
    case 'heading_3':
      return `### ${richTextToString(data?.rich_text)}`
    case 'bulleted_list_item':
      return `- ${richTextToString(data?.rich_text)}`
    case 'numbered_list_item':
      return `1. ${richTextToString(data?.rich_text)}`
    case 'to_do':
      return `${data?.checked ? '[x]' : '[ ]'} ${richTextToString(data?.rich_text)}`
    case 'toggle':
      return `▸ ${richTextToString(data?.rich_text)}`
    case 'quote':
      return `> ${richTextToString(data?.rich_text)}`
    case 'callout': {
      const icon = data?.icon?.emoji ?? '💡'
      return `${icon} ${richTextToString(data?.rich_text)}`
    }
    case 'divider':
      return '---'
    case 'code': {
      const lang = data?.language ?? ''
      const text = richTextToString(data?.rich_text)
      return `\`\`\`${lang}\n${text}\n\`\`\``
    }
    case 'bookmark':
    case 'embed':
    case 'link_preview':
      return `[${type}: ${data?.url ?? ''}]`
    case 'image':
    case 'video':
    case 'file':
    case 'pdf': {
      const url = data?.external?.url ?? data?.file?.url ?? ''
      return `[${type}: ${url}]`
    }
    case 'equation':
      return `$${data?.expression ?? ''}$`
    case 'child_page':
      return `[child page: ${data?.title ?? ''}]`
    case 'child_database':
      return `[child database: ${data?.title ?? ''}]`
    case 'table_of_contents':
      return '[table of contents]'
    case 'breadcrumb':
      return '[breadcrumb]'
    case 'synced_block':
      return '[synced block]'
    default:
      return `[${type ?? 'unknown'}]`
  }
}

/**
 * Convert a flat array of Notion blocks (children API response) to a
 * markdown-ish string. Nested children are not recursed — the response
 * already returns just the top-level layer per `/blocks/<id>/children`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function blocksToText(blocks: any[]): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map(renderBlock)
    .filter((line) => line.length > 0)
    .join('\n')
}
