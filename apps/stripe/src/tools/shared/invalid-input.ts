// src/tools/shared/invalid-input.ts

/**
 * Throws a tagged error the runtime maps to a tool-side INVALID_INPUT
 * frame. Used to re-check zod `.refine()` constraints the converter
 * strips from the LLM-facing JSON Schema (template §4 / shopify §4.2).
 */
export function invalidInput(message: string): never {
  const err = new Error(message) as Error & { code: string }
  err.code = 'INVALID_INPUT'
  throw err
}
