import type { ConversaEstagio } from "@/types"

export const STAGES: ConversaEstagio[] = [
  "novo",
  "contatado",
  "qualificado",
  "proposta",
  "fechado",
]

export const STAGE_LABELS: Record<ConversaEstagio, string> = {
  novo: "Novo Contato",
  contatado: "Em Atendimento",
  qualificado: "Orçamento",
  proposta: "Contrato",
  fechado: "Concluído",
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

export const STAGE_AVATAR_COLORS: Record<ConversaEstagio, string> = {
  novo:        "bg-blue-500 text-white",
  contatado:   "bg-yellow-500 text-white",
  qualificado: "bg-purple-500 text-white",
  proposta:    "bg-orange-500 text-white",
  fechado:     "bg-green-500 text-white",
}

export const STAGE_BORDER_COLORS: Record<ConversaEstagio, string> = {
  novo:        "border-l-blue-500",
  contatado:   "border-l-yellow-500",
  qualificado: "border-l-purple-500",
  proposta:    "border-l-orange-500",
  fechado:     "border-l-green-500",
}

export const STAGE_EMPTY_MESSAGES: Record<ConversaEstagio, string> = {
  novo:        "Sem novos contatos",
  contatado:   "Nenhum em atendimento",
  qualificado: "Nenhum orçamento",
  proposta:    "Nenhum contrato",
  fechado:     "Nenhum concluído",
}
