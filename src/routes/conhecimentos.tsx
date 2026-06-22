import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Headphones, Monitor, BarChart3, Lightbulb } from "lucide-react";

const cards = [
  { title: "Atendimento", icon: Headphones },
  { title: "Sistema", icon: Monitor },
  { title: "Relatórios", icon: BarChart3 },
  { title: "Dicas", icon: Lightbulb },
];

export const Route = createFileRoute("/conhecimentos")({
  component: () => (
    <AppShell>
      <div>
        <h1 className="font-display italic text-3xl text-primary mb-8">Base de Conhecimento</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="border-2 border-primary/40 rounded-2xl p-8 flex flex-col items-center gap-4 hover:shadow-lg hover:border-primary transition cursor-pointer bg-card"
            >
              <h3 className="font-display italic text-xl text-primary">{title}</h3>
              <Icon className="w-20 h-20 text-primary" strokeWidth={1.5} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  ),
});
