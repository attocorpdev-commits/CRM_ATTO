// ============================================================
// Auto-generated Supabase types
// To regenerate: bunx supabase gen types typescript --project-id YOUR_ID > types/database.types.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendedores: {
        Row: {
          id: string
          user_id: string | null
          nome: string
          email: string
          whatsapp_number: string | null
          status: "ativo" | "inativo" | "pausado"
          role: "superadmin" | "admin" | "vendedor"
          capacidade_maxima: number
          conversas_ativas: number
          permissions: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          nome: string
          email: string
          whatsapp_number?: string | null
          status?: "ativo" | "inativo" | "pausado"
          role?: "superadmin" | "admin" | "vendedor"
          capacidade_maxima?: number
          conversas_ativas?: number
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          nome?: string
          email?: string
          whatsapp_number?: string | null
          status?: "ativo" | "inativo" | "pausado"
          role?: "superadmin" | "admin" | "vendedor"
          capacidade_maxima?: number
          conversas_ativas?: number
          permissions?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversas_whatsapp: {
        Row: {
          id: string
          numero_cliente: string
          nome_cliente: string | null
          vendedor_id: string | null
          status: "ativa" | "encerrada" | "arquivada" | "queued"
          estagio: "novo" | "contatado" | "qualificado" | "proposta" | "fechado"
          ultima_mensagem: string | null
          ultima_mensagem_time: string | null
          unread_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_cliente: string
          nome_cliente?: string | null
          vendedor_id?: string | null
          status?: "ativa" | "encerrada" | "arquivada" | "queued"
          estagio?: "novo" | "contatado" | "qualificado" | "proposta" | "fechado"
          ultima_mensagem?: string | null
          ultima_mensagem_time?: string | null
          unread_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_cliente?: string
          nome_cliente?: string | null
          vendedor_id?: string | null
          status?: "ativa" | "encerrada" | "arquivada" | "queued"
          estagio?: "novo" | "contatado" | "qualificado" | "proposta" | "fechado"
          ultima_mensagem?: string | null
          ultima_mensagem_time?: string | null
          unread_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_whatsapp_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          }
        ]
      }
      mensagens_whatsapp: {
        Row: {
          id: string
          conversa_id: string
          direcao: "inbound" | "outbound"
          conteudo: string | null
          mid: string | null
          status: "enviada" | "entregue" | "lida" | "falha"
          timestamp: string
          anexos: Json
        }
        Insert: {
          id?: string
          conversa_id: string
          direcao: "inbound" | "outbound"
          conteudo?: string | null
          mid?: string | null
          status?: "enviada" | "entregue" | "lida" | "falha"
          timestamp?: string
          anexos?: Json
        }
        Update: {
          id?: string
          conversa_id?: string
          direcao?: "inbound" | "outbound"
          conteudo?: string | null
          mid?: string | null
          status?: "enviada" | "entregue" | "lida" | "falha"
          timestamp?: string
          anexos?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_whatsapp_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas_whatsapp"
            referencedColumns: ["id"]
          }
        ]
      }
      configuracoes_whatsapp: {
        Row: {
          id: string
          nome_conta: string
          evolution_api_url: string
          evolution_api_key: string
          instance_name: string
          numero_whatsapp: string | null
          status: "ativo" | "inativo"
          webhook_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome_conta: string
          evolution_api_url: string
          evolution_api_key: string
          instance_name: string
          numero_whatsapp?: string | null
          status?: "ativo" | "inativo"
          webhook_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome_conta?: string
          evolution_api_url?: string
          evolution_api_key?: string
          instance_name?: string
          numero_whatsapp?: string | null
          status?: "ativo" | "inativo"
          webhook_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_vendedor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      assign_conversation: {
        Args: { p_conversa_id: string; p_vendedor_id: string }
        Returns: undefined
      }
      unassign_conversation: {
        Args: { p_conversa_id: string }
        Returns: undefined
      }
      get_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: Record<PropertyKey, never>
    CompositeTypes: Record<PropertyKey, never>
  }
}
