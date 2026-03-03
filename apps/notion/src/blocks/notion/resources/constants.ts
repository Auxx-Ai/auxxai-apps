// src/blocks/notion/resources/constants.ts

export const RESOURCES = [
  { value: 'databasePage', label: 'Database Page' },
  { value: 'page', label: 'Page' },
  { value: 'block', label: 'Block' },
  { value: 'database', label: 'Database' },
  { value: 'user', label: 'User' },
] as const

export const OPERATIONS = {
  databasePage: [
    { value: 'create', label: 'Create' },
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'update', label: 'Update' },
  ],
  page: [
    { value: 'archive', label: 'Archive' },
    { value: 'create', label: 'Create' },
    { value: 'search', label: 'Search' },
  ],
  block: [
    { value: 'append', label: 'Append' },
    { value: 'getChildren', label: 'Get Children' },
  ],
  database: [
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
    { value: 'search', label: 'Search' },
  ],
  user: [
    { value: 'get', label: 'Get' },
    { value: 'getMany', label: 'Get Many' },
  ],
} as const

export const ALL_OPERATIONS = [
  { value: 'append', label: 'Append' },
  { value: 'archive', label: 'Archive' },
  { value: 'create', label: 'Create' },
  { value: 'get', label: 'Get' },
  { value: 'getChildren', label: 'Get Children' },
  { value: 'getMany', label: 'Get Many' },
  { value: 'search', label: 'Search' },
  { value: 'update', label: 'Update' },
] as const

export const VALID_OPERATIONS: Record<string, string[]> = {
  databasePage: ['create', 'get', 'getMany', 'update'],
  page: ['archive', 'create', 'search'],
  block: ['append', 'getChildren'],
  database: ['get', 'getMany', 'search'],
  user: ['get', 'getMany'],
}

/** Supported block types for the Block: Append operation. */
export const BLOCK_TYPES = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading_1', label: 'Heading 1' },
  { value: 'heading_2', label: 'Heading 2' },
  { value: 'heading_3', label: 'Heading 3' },
  { value: 'bulleted_list_item', label: 'Bulleted List' },
  { value: 'numbered_list_item', label: 'Numbered List' },
  { value: 'to_do', label: 'To-Do' },
  { value: 'toggle', label: 'Toggle' },
  { value: 'quote', label: 'Quote' },
  { value: 'callout', label: 'Callout' },
  { value: 'divider', label: 'Divider' },
  { value: 'code', label: 'Code' },
] as const

/** Code block language options. */
export const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'plain text', label: 'Plain Text' },
] as const

/**
 * Supported filter conditions by property type for simple filter mode.
 */
export const FILTER_CONDITIONS: Record<string, { value: string; label: string }[]> = {
  title: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  rich_text: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  url: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  email: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  phone_number: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than_or_equal_to', label: 'Greater Than Or Equal' },
    { value: 'less_than_or_equal_to', label: 'Less Than Or Equal' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  checkbox: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  status: [
    { value: 'equals', label: 'Equals' },
    { value: 'does_not_equal', label: 'Does Not Equal' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  multi_select: [
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'on_or_before', label: 'On Or Before' },
    { value: 'on_or_after', label: 'On Or After' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  created_time: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'on_or_before', label: 'On Or Before' },
    { value: 'on_or_after', label: 'On Or After' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  last_edited_time: [
    { value: 'equals', label: 'Equals' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'on_or_before', label: 'On Or Before' },
    { value: 'on_or_after', label: 'On Or After' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  people: [
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  created_by: [
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  last_edited_by: [
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  relation: [
    { value: 'contains', label: 'Contains' },
    { value: 'does_not_contain', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  files: [
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
}
