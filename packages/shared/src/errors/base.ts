export class KsefnikError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'KsefnikError'
  }
}
