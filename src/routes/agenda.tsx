import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/agenda")({
  component: () => (
    <AppShell>
      <div>
        <h1 className="font-display italic text-3xl text-primary mb-8">Agenda</h1>
        <div className="border border-primary/30 rounded-2xl p-12 text-center text-muted-foreground">
          Em breve: agenda de compromissos e lembretes.
        </div>
      </div>
    </AppShell>
  ),
});
