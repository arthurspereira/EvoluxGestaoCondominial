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
      clientes: {
        Row: {
          ativo: boolean
          criado_em: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          sindico: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          sindico?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          sindico?: string | null
        }
        Relationships: []
      }
      compromissos: {
        Row: {
          cliente_id: string | null
          concluido: boolean
          criado_em: string
          criado_por: string
          data: string
          horario: string | null
          id: string
          titulo: string
        }
        Insert: {
          cliente_id?: string | null
          concluido?: boolean
          criado_em?: string
          criado_por: string
          data: string
          horario?: string | null
          id?: string
          titulo: string
        }
        Update: {
          cliente_id?: string | null
          concluido?: boolean
          criado_em?: string
          criado_por?: string
          data?: string
          horario?: string | null
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      locais: {
        Row: {
          ativo: boolean
          cliente_id: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "locais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencao_fotos: {
        Row: {
          altura: number | null
          criado_em: string
          etapa: string
          id: string
          largura: number | null
          manutencao_id: string
          ordem: number
          storage_path: string
          tamanho_bytes: number | null
        }
        Insert: {
          altura?: number | null
          criado_em?: string
          etapa?: string
          id?: string
          largura?: number | null
          manutencao_id: string
          ordem?: number
          storage_path: string
          tamanho_bytes?: number | null
        }
        Update: {
          altura?: number | null
          criado_em?: string
          etapa?: string
          id?: string
          largura?: number | null
          manutencao_id?: string
          ordem?: number
          storage_path?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_fotos_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencao_fotos_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes_detalhadas"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          atualizado_em: string
          cliente_id: string
          codigo: number
          data_calendario: string | null
          descricao: string
          id: string
          local_descricao: string
          local_id: string | null
          previsto_para: string | null
          registrado_em: string
          registrado_por: string
          resolucao_descricao: string | null
          resolvido_em: string | null
          resolvido_por: string | null
          status: Database["public"]["Enums"]["status_manutencao"]
          tipo_id: string
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          codigo?: never
          data_calendario?: string | null
          descricao: string
          id?: string
          local_descricao: string
          local_id?: string | null
          previsto_para?: string | null
          registrado_em?: string
          registrado_por: string
          resolucao_descricao?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: Database["public"]["Enums"]["status_manutencao"]
          tipo_id: string
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          codigo?: never
          data_calendario?: string | null
          descricao?: string
          id?: string
          local_descricao?: string
          local_id?: string | null
          previsto_para?: string | null
          registrado_em?: string
          registrado_por?: string
          resolucao_descricao?: string | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: Database["public"]["Enums"]["status_manutencao"]
          tipo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_resolvido_por_fkey"
            columns: ["resolvido_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          papel: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id: string
          nome: string
          papel?: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          papel?: string
        }
        Relationships: []
      }
      tipos_manutencao: {
        Row: {
          ativo: boolean
          cor: string
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          cor?: string
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          cor?: string
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
    }
    Views: {
      manutencoes_detalhadas: {
        Row: {
          atualizado_em: string | null
          cliente_id: string | null
          cliente_nome: string | null
          codigo: number | null
          data_calendario: string | null
          descricao: string | null
          fotos_registro: number | null
          fotos_resolucao: number | null
          id: string | null
          local_descricao: string | null
          previsto_para: string | null
          registrado_em: string | null
          registrado_por_nome: string | null
          resolucao_descricao: string | null
          resolvido_em: string | null
          status: Database["public"]["Enums"]["status_manutencao"] | null
          tipo_cor: string | null
          tipo_id: string | null
          tipo_nome: string | null
          total_fotos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manutencoes_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_manutencao"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      usuario_ativo: { Args: never; Returns: boolean }
    }
    Enums: {
      status_manutencao: "pendente" | "em_andamento" | "resolvida"
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

// Aliases de domínio usados pela aplicação. A view abaixo só expõe campos
// obrigatórios das tabelas relacionadas por JOIN, mas o gerador do Supabase
// os marca como anuláveis por se tratar de uma view.
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"]
export type Local = Database["public"]["Tables"]["locais"]["Row"]
export type Compromisso = Database["public"]["Tables"]["compromissos"]["Row"]
export type ManutencaoFoto = Database["public"]["Tables"]["manutencao_fotos"]["Row"]
export type TipoManutencao = Database["public"]["Tables"]["tipos_manutencao"]["Row"]
export type StatusManutencao = Database["public"]["Enums"]["status_manutencao"]
export type ManutencaoDetalhada = {
  id: string
  codigo: number
  cliente_id: string
  cliente_nome: string
  local_descricao: string
  tipo_id: string
  tipo_nome: string
  tipo_cor: string
  descricao: string
  status: StatusManutencao
  registrado_em: string
  previsto_para: string | null
  data_calendario: string
  registrado_por_nome: string
  resolucao_descricao: string | null
  resolvido_em: string | null
  atualizado_em: string
  total_fotos: number
  fotos_registro: number
  fotos_resolucao: number
}

export const Constants = {
  public: {
    Enums: {
      status_manutencao: ["pendente", "em_andamento", "resolvida"],
    },
  },
} as const

