"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, PlusCircle, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", label: "Início", icone: LayoutDashboard },
  { href: "/manutencoes", label: "Manutenções", icone: Wrench },
  { href: "/manutencoes/nova", label: "Nova", icone: PlusCircle, destaque: true },
  { href: "/calendario", label: "Agenda", icone: CalendarDays },
  { href: "/clientes", label: "Clientes", icone: Users },
];

// Visível só abaixo de md — no desktop a navegação vira sidebar.
// "Nova Manutenção" ganha destaque visual porque é a ação mais usada
// no celular (briefing, seção 14).
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden">
      <ul className="grid grid-cols-5">
        {ITENS.map(({ href, label, icone: Icone, destaque }) => {
          const ativo = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "toque-confortavel flex flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
                  ativo ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icone className={cn(destaque ? "h-8 w-8 -mt-4 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md" : "h-5 w-5")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
