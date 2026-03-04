import type { Database } from "./database.types"

// ============================================================
// Row types (what you get from SELECT queries)
// ============================================================
export type Vendedor     = Database["public"]["Tables"]["vendedores"]["Row"]
export type Conversa     = Database["public"]["Tables"]["conversas_whatsapp"]["Row"]
export type Mensagem     = Database["public"]["Tables"]["mensagens_whatsapp"]["Row"]
export type Configuracao = Database["public"]["Tables"]["configuracoes_whatsapp"]["Row"]

// ============================================================
// Insert types (for INSERT operations)
// ============================================================
export type VendedorInsert     = Database["public"]["Tables"]["vendedores"]["Insert"]
export type ConversaInsert     = Database["public"]["Tables"]["conversas_whatsapp"]["Insert"]
export type MensagemInsert     = Database["public"]["Tables"]["mensagens_whatsapp"]["Insert"]
export type ConfiguracaoInsert = Database["public"]["Tables"]["configuracoes_whatsapp"]["Insert"]

// ============================================================
// Update types
// ============================================================
export type VendedorUpdate     = Database["public"]["Tables"]["vendedores"]["Update"]
export type ConversaUpdate     = Database["public"]["Tables"]["conversas_whatsapp"]["Update"]
export type MensagemUpdate     = Database["public"]["Tables"]["mensagens_whatsapp"]["Update"]

// ============================================================
// Enriched types with joined data
// ============================================================
export type ConversaComVendedor = Conversa & {
  vendedores?: Pick<Vendedor, "nome" | "email"> | null
}

// ============================================================
// Domain-specific union types
// ============================================================
export type ConversaStatus  = Conversa["status"]
export type ConversaEstagio = Conversa["estagio"]
export type VendedorStatus  = Vendedor["status"]
export type VendedorRole    = Vendedor["role"]
export type MensagemDirecao = Mensagem["direcao"]
export type MensagemStatus  = Mensagem["status"]

// ============================================================
// Disparos (bulk messaging)
// ============================================================
export type Disparo              = Database["public"]["Tables"]["disparos"]["Row"]
export type DisparoInsert        = Database["public"]["Tables"]["disparos"]["Insert"]
export type DisparoContato       = Database["public"]["Tables"]["disparo_contatos"]["Row"]
export type DisparoContatoInsert = Database["public"]["Tables"]["disparo_contatos"]["Insert"]
export type DisparoStatus        = Disparo["status"]
export type DisparoContatoStatus = DisparoContato["status"]
