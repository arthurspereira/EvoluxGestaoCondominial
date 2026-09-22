import { z } from "zod";

// Compartilhado entre o formulário (react-hook-form) e a Server Action
// que grava no banco — a mesma regra vale nos dois lados.
export const schemaNovaManutencao = z.object({
  cliente_id: z.string().uuid({ message: "Selecione um cliente." }),

  // Local: permite escolher um existente (local_id) ou digitar um novo
  // (local_descricao obrigatório em ambos os casos, para o desnormalizado).
  local_id: z.string().uuid().nullable(),
  local_descricao: z
    .string()
    .trim()
    .min(2, "Informe o local da manutenção."),

  tipo_id: z.string().uuid({ message: "Selecione o tipo de manutenção." }),

  descricao: z
    .string()
    .trim()
    .min(5, "Descreva o problema com um pouco mais de detalhe."),

  // Opcional — é o que alimenta o calendário quando a data de execução
  // é diferente da data de registro.
  previsto_para: z.string().date().nullable().optional(),

  // Cada item é o caminho já enviado ao Storage (upload acontece antes
  // do submit, foto a foto, para o usuário ver o progresso).
  fotos: z
    .array(
      z.object({
        storage_path: z.string(),
        largura: z.number().int().positive().nullable(),
        altura: z.number().int().positive().nullable(),
        tamanho_bytes: z.number().int().positive().nullable(),
      })
    )
    .default([]),
});

export type NovaManutencaoInput = z.infer<typeof schemaNovaManutencao>;

export const schemaResolucao = z.object({
  resolucao_descricao: z
    .string()
    .trim()
    .min(5, "Descreva como o problema foi resolvido."),
  fotos: z
    .array(
      z.object({
        storage_path: z.string(),
        largura: z.number().int().positive().nullable(),
        altura: z.number().int().positive().nullable(),
        tamanho_bytes: z.number().int().positive().nullable(),
      })
    )
    .default([]),
});

export type ResolucaoInput = z.infer<typeof schemaResolucao>;

export const schemaCompromisso = z.object({
  cliente_id: z.string().uuid().nullable(),
  titulo: z.string().trim().min(2, "Dê um título para o compromisso."),
  data: z.string().date("Informe uma data válida."),
  horario: z.string().nullable().optional(),
});

export type CompromissoInput = z.infer<typeof schemaCompromisso>;
