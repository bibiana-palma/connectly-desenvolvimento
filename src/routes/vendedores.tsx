import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/vendedores")({
  component: () => (
    <AppShell>
      <div>
        <h1 className="font-display italic text-3xl text-primary mb-8">Vendedores</h1>
        <div className="border border-primary/30 rounded-2xl p-12 text-center text-muted-foreground">
          Em breve: gerenciamento da equipe de vendedores.
        </div>
      </div>
    </AppShell>
  ),
});
