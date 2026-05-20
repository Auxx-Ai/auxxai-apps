// src/blocks/template/template-tool-map.ts

/**
 * `<operation>` → tool id dispatch table for the template block.
 * Lives in its own file so the server dispatcher can import it without
 * pulling in the workflow.tsx node/panel React graph.
 */
export const templateToolMap = {
  echo: 'echo',
  reverse: 'reverse',
} as const
