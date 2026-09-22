import Link from "next/link";
import { Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Cliente } from "@/types/database";

export function CardCliente({ cliente, totalManutencoes }: { cliente: Cliente; totalManutencoes: number }) {
  return (
    <Link href={`/clientes/${cliente.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="space-y-1.5 p-4">
          <p className="flex items-center gap-2 font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {cliente.nome}
          </p>
          {cliente.endereco && <p className="text-sm text-muted-foreground">{cliente.endereco}</p>}
          {cliente.sindico && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {cliente.sindico}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {totalManutencoes} manutenç{totalManutencoes === 1 ? "ão" : "ões"} registrada{totalManutencoes === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
