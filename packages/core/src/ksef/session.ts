import type { KsefClient, KsefClientConfig, KsefSessionState } from './types.js'

export interface SessionManagerOptions {
  renewThresholdMs?: number
}

const DEFAULT_RENEW_THRESHOLD_MS = 60_000

export class SessionManager {
  private session: KsefSessionState | null = null
  private readonly renewThresholdMs: number

  constructor(
    private readonly client: KsefClient,
    private readonly config: KsefClientConfig,
    opts?: SessionManagerOptions,
  ) {
    this.renewThresholdMs = opts?.renewThresholdMs ?? DEFAULT_RENEW_THRESHOLD_MS
  }

  async ensure(): Promise<KsefSessionState> {
    if (!this.session) {
      this.session = await this.client.initSession(this.config)
      return this.session
    }

    const timeLeft = this.session.expiresAt.getTime() - Date.now()
    if (timeLeft < this.renewThresholdMs) {
      await this.close()
      this.session = await this.client.initSession(this.config)
    }

    return this.session
  }

  async close(): Promise<void> {
    if (this.session) {
      await this.client.terminateSession(this.session.token)
      this.session = null
    }
  }

  get current(): KsefSessionState | null {
    return this.session
  }

  get isActive(): boolean {
    if (!this.session) return false
    return this.session.expiresAt.getTime() > Date.now()
  }
}
