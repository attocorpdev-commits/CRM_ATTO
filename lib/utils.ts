import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips WhatsApp JID suffix to get the plain phone number.
 * "5511999999999@s.whatsapp.net" → "5511999999999"
 * "5511999999999@g.us"           → "5511999999999" (group)
 */
export function formatPhoneNumber(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, "").replace(/@g\.us$/, "")
}

/**
 * Returns true if the JID belongs to a WhatsApp group.
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith("@g.us")
}

/**
 * Human-readable relative timestamp in pt-BR.
 * e.g. "há 5 minutos"
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: ptBR,
  })
}
