import type { ConversaEstagio } from "@/types"

export const STAGES: ConversaEstagio[] = [
  "novo",
  "contatado",
  "qualificado",
  "proposta",
  "fechado",
]

export const STAGE_LABELS: Record<ConversaEstagio, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  proposta: "Proposta",
  fechado: "Fechado",
}

export const STAGE_COLORS: Record<ConversaEstagio, string> = {
  novo: "bg-blue-100 text-blue-700",
  contatado: "bg-yellow-100 text-yellow-700",
  qualificado: "bg-purple-100 text-purple-700",
  proposta: "bg-orange-100 text-orange-700",
  fechado: "bg-green-100 text-green-700",
}

export const STAGE_HEADER_COLORS: Record<ConversaEstagio, string> = {
  novo: "border-t-blue-500",
  contatado: "border-t-yellow-500",
  qualificado: "border-t-purple-500",
  proposta: "border-t-orange-500",
  fechado: "border-t-green-500",
}
