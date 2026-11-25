import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * true depois que a store foi carregada do localStorage.
 * A reidratação acontece no __root (client-side); antes disso o estado é o padrão
 * e não dá para saber, por exemplo, se há garçom logado.
 */
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
