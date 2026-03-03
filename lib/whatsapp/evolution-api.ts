// ============================================================
// Evolution API Client
// Open-source self-hosted WhatsApp gateway
// Docs: https://doc.evolution-api.com
// ============================================================

export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message?: {
      conversation?: string
      extendedTextMessage?: { text: string }
      imageMessage?: { caption?: string; url?: string; mimetype?: string }
      audioMessage?: { url?: string; mimetype?: string }
      videoMessage?: { caption?: string; url?: string; mimetype?: string }
      documentMessage?: {
        caption?: string
        url?: string
        fileName?: string
        mimetype?: string
      }
      stickerMessage?: { url?: string }
    }
    messageType: string
    messageTimestamp: number
    pushName?: string
    status?: string
    // For status updates (messages.update event)
    update?: {
      status: string
    }
  }
}

interface SendTextPayload {
  number: string
  text: string
  delay?: number
}

interface SendMediaPayload {
  number: string
  mediatype: "image" | "video" | "audio" | "document"
  mimetype: string
  caption?: string
  media: string // URL or base64
  fileName?: string
}

interface WebhookSetPayload {
  url: string
  webhook_by_events: boolean
  webhook_base64: boolean
  events: string[]
}

interface EvolutionResponse {
  key?: { id: string }
  status?: string
  [key: string]: unknown
}

export class EvolutionApiClient {
  private baseUrl: string
  private apiKey: string
  private instance: string

  constructor(baseUrl: string, apiKey: string, instance: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "")
    this.apiKey = apiKey
    this.instance = instance
  }

  private async request<T = EvolutionResponse>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `Evolution API ${method} ${path} → ${res.status}: ${text}`
      )
    }

    return res.json() as Promise<T>
  }

  /**
   * Send a plain text message.
   */
  async sendText(payload: SendTextPayload) {
    return this.request("POST", `/message/sendText/${this.instance}`, payload)
  }

  /**
   * Send media (image, video, audio, document).
   */
  async sendMedia(payload: SendMediaPayload) {
    return this.request("POST", `/message/sendMedia/${this.instance}`, payload)
  }

  /**
   * Configure the webhook for this instance.
   * Events: MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE, etc.
   */
  async setWebhook(payload: WebhookSetPayload) {
    return this.request("POST", `/webhook/set/${this.instance}`, {
      webhook: { enabled: true, ...payload },
    })
  }

  /**
   * Get current webhook configuration.
   */
  async getWebhook() {
    return this.request("GET", `/webhook/find/${this.instance}`)
  }

  /**
   * Get all instances registered in this Evolution API server.
   */
  async fetchInstances() {
    return this.request("GET", `/instance/fetchInstances`)
  }

  /**
   * Get the connection state of this instance.
   * Returns { instance: { state: "open" | "connecting" | "close" } }
   */
  async getConnectionState() {
    return this.request<{ instance: { state: string } }>(
      "GET",
      `/instance/connectionState/${this.instance}`
    )
  }

  /**
   * Get the QR code for connecting this instance.
   * QR code expires in ~30 seconds — poll every 25s while showing the dialog.
   */
  async fetchQRCode() {
    return this.request<{ base64?: string; code?: string }>(
      "GET",
      `/instance/connect/${this.instance}`
    )
  }

  /**
   * Disconnect this instance from WhatsApp.
   */
  async logout() {
    return this.request("DELETE", `/instance/logout/${this.instance}`)
  }

  /**
   * Extract text content from an Evolution API message payload.
   * Returns null if the message has no extractable text (e.g. pure audio).
   */
  extractTextContent(
    data: EvolutionWebhookPayload["data"]
  ): string | null {
    const msg = data.message
    if (!msg) return null

    return (
      msg.conversation ??
      msg.extendedTextMessage?.text ??
      msg.imageMessage?.caption ??
      msg.videoMessage?.caption ??
      msg.documentMessage?.caption ??
      null
    )
  }

  /**
   * Determine the message type label for storage/display.
   */
  getMessageType(data: EvolutionWebhookPayload["data"]): string {
    const msg = data.message
    if (!msg) return data.messageType
    if (msg.imageMessage) return "image"
    if (msg.audioMessage) return "audio"
    if (msg.videoMessage) return "video"
    if (msg.documentMessage) return "document"
    if (msg.stickerMessage) return "sticker"
    return "text"
  }
}

/**
 * Factory that creates an EvolutionApiClient from environment variables.
 * Server-side only — uses env vars that are not exposed to the browser.
 */
export function createEvolutionClient(): EvolutionApiClient {
  if (!process.env.EVOLUTION_API_URL) throw new Error("EVOLUTION_API_URL not set")
  if (!process.env.EVOLUTION_API_KEY) throw new Error("EVOLUTION_API_KEY not set")
  if (!process.env.EVOLUTION_INSTANCE_NAME) throw new Error("EVOLUTION_INSTANCE_NAME not set")

  return new EvolutionApiClient(
    process.env.EVOLUTION_API_URL,
    process.env.EVOLUTION_API_KEY,
    process.env.EVOLUTION_INSTANCE_NAME
  )
}
