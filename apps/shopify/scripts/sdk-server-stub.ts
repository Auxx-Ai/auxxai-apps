// apps/shopify/scripts/sdk-server-stub.ts
//
// Test-only stand-in for `@auxx/sdk/server`, which is a TYPES-ONLY export — at runtime
// the app-runtime sandbox supplies these, so the connector module cannot be imported by
// plain node. Only the error classes are needed, and the projection path under test
// never throws them; this exists purely so the real handler can be bundled and run
// outside the sandbox.

class SdkError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ConflictError extends SdkError {}
export class ConnectionExpiredError extends SdkError {}
export class InsufficientPermissionsError extends SdkError {}
export class InvalidInputError extends SdkError {}
export class NotFoundError extends SdkError {}
export class RateLimitError extends SdkError {}
export class UpstreamServiceError extends SdkError {}
