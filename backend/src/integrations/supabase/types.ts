export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assinaturas: {
        Row: {
          assinado_em: string
          id: string
          membro_id: string
          proposta_id: string
          tx_signature: string | null
        }
        Insert: {
          assinado_em?: string
          id?: string
          membro_id: string
          proposta_id: string
          tx_signature?: string | null
        }
        Update: {
          assinado_em?: string
          id?: string
          membro_id?: string
          proposta_id?: string
          tx_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      entidades: {
        Row: {
          criado_em: string
          id: string
          multisig_pda: string | null
          nome: string
          publico: boolean
          slug: string
          tipo: Database["public"]["Enums"]["tipo_entidade"]
          universidade: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          multisig_pda?: string | null
          nome: string
          publico?: boolean
          slug: string
          tipo: Database["public"]["Enums"]["tipo_entidade"]
          universidade?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          multisig_pda?: string | null
          nome?: string
          publico?: boolean
          slug?: string
          tipo?: Database["public"]["Enums"]["tipo_entidade"]
          universidade?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          capacidade: number | null
          data: string
          entidade_id: string
          id: string
          local: string | null
          nome: string
          rubrica: Database["public"]["Enums"]["rubrica"]
          slug: string
        }
        Insert: {
          capacidade?: number | null
          data: string
          entidade_id: string
          id?: string
          local?: string | null
          nome: string
          rubrica?: Database["public"]["Enums"]["rubrica"]
          slug: string
        }
        Update: {
          capacidade?: number | null
          data?: string
          entidade_id?: string
          id?: string
          local?: string | null
          nome?: string
          rubrica?: Database["public"]["Enums"]["rubrica"]
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ingressos: {
        Row: {
          comprador_id: string | null
          evento_id: string
          id: string
          lamports: number | null
          lancamento_id: string | null
          lote: string
          lote_id: string | null
          pago_em: string | null
          preco_centavos: number
          referencia: string
          reservado_em: string
          status: Database["public"]["Enums"]["status_ingresso"]
          tx_signature: string | null
        }
        Insert: {
          comprador_id?: string | null
          evento_id: string
          id?: string
          lamports?: number | null
          lancamento_id?: string | null
          lote: string
          lote_id?: string | null
          pago_em?: string | null
          preco_centavos: number
          referencia: string
          reservado_em?: string
          status?: Database["public"]["Enums"]["status_ingresso"]
          tx_signature?: string | null
        }
        Update: {
          comprador_id?: string | null
          evento_id?: string
          id?: string
          lamports?: number | null
          lancamento_id?: string | null
          lote?: string
          lote_id?: string | null
          pago_em?: string | null
          preco_centavos?: number
          referencia?: string
          reservado_em?: string
          status?: Database["public"]["Enums"]["status_ingresso"]
          tx_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingressos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingressos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingressos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          criado_em: string
          descricao: string
          entidade_id: string
          id: string
          rubrica: Database["public"]["Enums"]["rubrica"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          tx_signature: string | null
          valor_centavos: number
        }
        Insert: {
          criado_em?: string
          descricao: string
          entidade_id: string
          id?: string
          rubrica: Database["public"]["Enums"]["rubrica"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          tx_signature?: string | null
          valor_centavos: number
        }
        Update: {
          criado_em?: string
          descricao?: string
          entidade_id?: string
          id?: string
          rubrica?: Database["public"]["Enums"]["rubrica"]
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          tx_signature?: string | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          evento_id: string
          id: string
          nome: string
          ordem: number
          preco_centavos: number
          total: number
          vendidos: number
        }
        Insert: {
          evento_id: string
          id?: string
          nome: string
          ordem?: number
          preco_centavos: number
          total: number
          vendidos?: number
        }
        Update: {
          evento_id?: string
          id?: string
          nome?: string
          ordem?: number
          preco_centavos?: number
          total?: number
          vendidos?: number
        }
        Relationships: [
          {
            foreignKeyName: "lotes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          ativo: boolean
          email: string | null
          entidade_id: string
          id: string
          nome: string
          papel: Database["public"]["Enums"]["papel_membro"]
          pubkey: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          email?: string | null
          entidade_id: string
          id?: string
          nome: string
          papel: Database["public"]["Enums"]["papel_membro"]
          pubkey?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          email?: string | null
          entidade_id?: string
          id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          pubkey?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          chave_pix: string
          criado_em: string
          criado_por: string
          destino: string
          entidade_id: string
          id: string
          rubrica: Database["public"]["Enums"]["rubrica"]
          status: Database["public"]["Enums"]["status_proposta"]
          tx_index: number | null
          valor_centavos: number
        }
        Insert: {
          chave_pix: string
          criado_em?: string
          criado_por: string
          destino: string
          entidade_id: string
          id?: string
          rubrica: Database["public"]["Enums"]["rubrica"]
          status?: Database["public"]["Enums"]["status_proposta"]
          tx_index?: number | null
          valor_centavos: number
        }
        Update: {
          chave_pix?: string
          criado_em?: string
          criado_por?: string
          destino?: string
          entidade_id?: string
          id?: string
          rubrica?: Database["public"]["Enums"]["rubrica"]
          status?: Database["public"]["Enums"]["status_proposta"]
          tx_index?: number | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_entidade_id_fkey"
            columns: ["entidade_id"]
            isOneToOne: false
            referencedRelation: "entidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      vender_lote: { Args: { p_lote: string }; Returns: number }
    }
    Enums: {
      papel_membro: "presidente" | "tesoureiro" | "conselho" | "socio"
      rubrica: "Eventos" | "Marketing" | "Esporte" | "Associados"
      status_ingresso: "reservado" | "pago" | "usado"
      status_proposta: "pendente" | "aprovada" | "executada" | "rejeitada"
      tipo_entidade: "atletica" | "formatura" | "ej" | "ca"
      tipo_lancamento: "entrada" | "saida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_membro: ["presidente", "tesoureiro", "conselho", "socio"],
      rubrica: ["Eventos", "Marketing", "Esporte", "Associados"],
      status_ingresso: ["reservado", "pago", "usado"],
      status_proposta: ["pendente", "aprovada", "executada", "rejeitada"],
      tipo_entidade: ["atletica", "formatura", "ej", "ca"],
      tipo_lancamento: ["entrada", "saida"],
    },
  },
} as const
