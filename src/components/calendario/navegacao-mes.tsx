import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mesAnterior, mesSeguinte, rotuloMes } from "@/lib/calendario";

export function NavegacaoMes({ referencia }: { referencia: Date }) {
  const anterior = mesAnterior(referencia);
  const seguinte = mesSeguinte(referencia);

  function href(data: Date) {
    return `/calendario?mes=${data.getMonth() + 1}&ano=${data.getFullYear()}`;
  }

  return (
    <div className="flex items-center justify-between">
      <Link
        href={href(anterior)}
        className="toque-confortavel flex items-center justify-center rounded-md hover:bg-secondary"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <p className="text-lg font-semibold capitalize">{rotuloMes(referencia)}</p>
      <Link
        href={href(seguinte)}
        className="toque-confortavel flex items-center justify-center rounded-md hover:bg-secondary"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
