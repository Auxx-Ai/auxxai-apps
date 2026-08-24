// tests/__mocks__/auxx-sdk-server.ts

/**
 * Mock of `@auxx/sdk/server` for vitest — the SDK error classes only, which is
 * all the pure builders and mappers under test need.
 */

export class ConnectionExpiredError extends Error {
  constructor(public scope: 'user' | 'organization' = 'organization') {
    super(`${scope} connection expired`)
    this.name = 'ConnectionExpiredError'
  }
}
export class InsufficientPermissionsError extends Error {
  constructor(public scope: 'user' | 'organization' = 'organization') {
    super('insufficient permissions')
    this.name = 'InsufficientPermissionsError'
  }
}
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInputError'
  }
}
export class NotFoundError extends Error {
  constructor(message = 'not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}
export class ConflictError extends Error {
  constructor(message = 'conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}
export class RateLimitError extends Error {
  constructor(public retryAfterSeconds?: number) {
    super('rate limited')
    this.name = 'RateLimitError'
  }
}
export class UpstreamServiceError extends Error {
  constructor(
    message = 'upstream unavailable',
    public statusCode?: number
  ) {
    super(message)
    this.name = 'UpstreamServiceError'
  }
}
