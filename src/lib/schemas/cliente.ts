import { z } from "zod";

export const schemaCliente = z.object({
  nome: z.string().trim().min(2, "Informe o nome do condomínio/cliente."),
  endereco: z.string().trim().optional(),
  sindico: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
});

export type ClienteInput = z.infer<typeof schemaCliente>;

export const schemaLocal = z.object({
  cliente_id: z.string().uuid({ message: "Selecione o cliente." }),
  nome: z.string().trim().min(2, "Informe o nome do local."),
});

export type LocalInput = z.infer<typeof schemaLocal>;
