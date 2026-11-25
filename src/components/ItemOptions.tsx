import { brl, type Product } from "@/lib/mock";

const OBSERVACOES_RAPIDAS = ["Sem cebola", "Bem passado", "Sem gelo", "Pouco sal"];

/** Adicionais e observação de um item. Usado pelo garçom e pelo autoatendimento. */
export function ItemOptions({
  product,
  addons,
  onAddonsChange,
  notes,
  onNotesChange,
  size = "md",
}: {
  product: Product;
  addons: string[];
  onAddonsChange: (a: string[]) => void;
  notes: string;
  onNotesChange: (n: string) => void;
  size?: "md" | "lg";
}) {
  const big = size === "lg";
  return (
    <div className="text-left">
      {product.addons && product.addons.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adicionais
          </h4>
          <div className="space-y-2">
            {product.addons.map((a) => {
              const on = addons.includes(a.name);
              return (
                <button
                  key={a.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onAddonsChange(on ? addons.filter((x) => x !== a.name) : [...addons, a.name])
                  }
                  className={`flex w-full justify-between rounded-xl border ${big ? "p-4 text-base" : "p-3 text-sm"} ${on ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <span>{a.name}</span>
                  <span>+ {brl(a.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Observação
        </h4>
        <div className="mb-2 flex flex-wrap gap-2">
          {OBSERVACOES_RAPIDAS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onNotesChange(notes ? `${notes}, ${s.toLowerCase()}` : s)}
              className={`rounded-full bg-secondary ${big ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Ex: sem tomate"
          className={`w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary ${big ? "h-12 text-base" : "h-11"}`}
        />
      </div>
    </div>
  );
}
