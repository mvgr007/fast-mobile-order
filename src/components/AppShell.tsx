import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, ChefHat, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";

export function AppShell({ title, back, children }: { title: string; back?: ReactNode; children: ReactNode }) {
  const waiter = useStore((s) => s.waiter);
  const logout = useStore((s) => s.logout);
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {back}
            <span className="shrink-0 rounded-md bg-primary px-2 py-1 font-display text-xs font-bold tracking-wider text-primary-foreground">FAST</span>
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{title}</h1>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/mesas" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-secondary text-foreground" }}>
              <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Mesas</span>
            </Link>
            <Link to="/cozinha" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" activeProps={{ className: "bg-secondary text-foreground" }}>
              <ChefHat className="h-4 w-4" /><span className="hidden sm:inline">Cozinha</span>
            </Link>
            {waiter && (
              <button onClick={() => { logout(); nav({ to: "/" }); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary">
                <LogOut className="h-4 w-4" /><span className="hidden md:inline">{waiter}</span>
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
    </div>
  );
}
