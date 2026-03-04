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
          n8n_webhook_url: string | null
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
          n8n_webhook_url?: string | null
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
          n8n_webhook_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      disparos: {
        Row: {
          id: string
          vendedor_id: string
          mensagem: string
          total_contatos: number
          enviados: number
          falhas: number
          delay_segundos: number
          status: "pendente" | "em_andamento" | "concluido" | "cancelado" | "erro"
          erro_msg: string | null
          started_at: string | null
          finished_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendedor_id: string
          mensagem: string
          total_contatos?: number
          enviados?: number
          falhas?: number
          delay_segundos?: number
          status?: "pendente" | "em_andamento" | "concluido" | "cancelado" | "erro"
          erro_msg?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendedor_id?: string
          mensagem?: string
          total_contatos?: number
          enviados?: number
          falhas?: number
          delay_segundos?: number
          status?: "pendente" | "em_andamento" | "concluido" | "cancelado" | "erro"
          erro_msg?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disparos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          }
        ]
      }
      disparo_contatos: {
        Row: {
          id: string
          disparo_id: string
          nome: string
          numero: string
          status: "pendente" | "enviado" | "falha"
          erro_msg: string | null
          enviado_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          disparo_id: string
          nome: string
          numero: string
          status?: "pendente" | "enviado" | "falha"
          erro_msg?: string | null
          enviado_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          disparo_id?: string
          nome?: string
          numero?: string
          status?: "pendente" | "enviado" | "falha"
          erro_msg?: string | null
          enviado_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disparo_contatos_disparo_id_fkey"
            columns: ["disparo_id"]
            isOneToOne: false
            referencedRelation: "disparos"
            referencedColumns: ["id"]
          }
        ]
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
      increment_disparo_enviados: {
        Args: { p_disparo_id: string }
        Returns: undefined
      }
      increment_disparo_falhas: {
        Args: { p_disparo_id: string }
        Returns: undefined
      }
    }
    Enums: Record<PropertyKey, never>
    CompositeTypes: Record<PropertyKey, never>
  }
}
