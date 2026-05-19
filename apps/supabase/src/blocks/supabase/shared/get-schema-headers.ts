// src/blocks/supabase/shared/get-schema-headers.ts

/**
 * PostgREST exposes non-default Postgres schemas via the Accept-Profile
 * (read) and Content-Profile (write) headers. This helper returns the
 * right header for a given HTTP method, or an empty object when the
 * schema is the default `public`.
 */

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function getSchemaHeaders(
  method: string,
  customSchema: boolean,
  schema: string = 'public'
): Record<string, string> {
  if (!customSchema) return {}
  const trimmed = schema?.trim() || 'public'
  if (trimmed === 'public') return {}

  if (WRITE_METHODS.has(method.toUpperCase())) {
    return { 'Content-Profile': trimmed }
  }
  return { 'Accept-Profile': trimmed }
}
