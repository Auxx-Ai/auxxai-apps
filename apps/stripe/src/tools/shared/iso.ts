// src/tools/shared/iso.ts

/** Stripe returns unix seconds; tools surface ISO strings. */
export function isoFromUnix(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null
  return new Date(seconds * 1000).toISOString()
}

/** Parse an ISO date-time string to unix seconds. */
export function unixFromIso(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}
