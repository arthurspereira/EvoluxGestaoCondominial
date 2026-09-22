import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { TabBar } from "@/components/layout/tab-bar";
import { logout } from "@/app/(auth)/actions";
import { LogOut } from "lucide-react";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        {/* Cabeçalho mobile com botão de logout — oculto no desktop onde a sidebar já tem o botão */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <p className="text-base font-semibold text-foreground">Evolux</p>
          <form action={logout}>
            <button
              type="submit"
              className="toque-confortavel flex items-center gap-1.5 text-sm text-muted-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 md:pb-8 md:pt-8">
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
