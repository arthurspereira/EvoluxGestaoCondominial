"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, PlusCircle, Users, Wrench, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";

const ITENS = [
  { href: "/", label: "Dashboard", icone: LayoutDashboard },
  { href: "/manutencoes", label: "Manutenções", icone: Wrench },
  { href: "/calendario", label: "Calendário", icone: CalendarDays },
  { href: "/clientes", label: "Clientes", icone: Users },
  { href: "/relatorios", label: "Relatórios", icone: FileText },
];

// Visível só a partir de md — no mobile a navegação vira tab bar.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      <div className="mb-6 px-2 flex justify-center">
        <Image
          src="/marca.png"
          alt="Evolux"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>

      <Link
        href="/manutencoes/nova"
        className="toque-confortavel mb-4 flex items-center justify-start gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <PlusCircle className="h-4 w-4" />
        Nova Manutenção
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {ITENS.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                ativo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icone className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="toque-confortavel flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </form>
    </aside>
  );
}
