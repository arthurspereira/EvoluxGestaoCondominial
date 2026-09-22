import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Usado em Server Components, Server Actions e route handlers.
// Cada chamada lê os cookies da requisição atual, então a sessão do
// usuário logado acompanha automaticamente — não é preciso passar token.
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaDefinir: { name: string; value: string; options?: object }[]) {
          try {
            cookiesParaDefinir.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de dentro de um Server Component sem permissão de
            // escrita — o middleware já cuida do refresh da sessão nesse
            // caso, então é seguro ignorar aqui.
          }
        },
      },
    }
  );
}
