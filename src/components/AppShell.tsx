import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Package,
  Tags,
  BookOpen,
  Settings,
  UserCircle2,
  LogOut,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/status", label: "Criação Status", icon: Tags },
  { to: "/conhecimentos", label: "Conhecimentos", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const displayName = user.user_metadata?.name || user.email?.split("@")[0] || "Usuário";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30 print:hidden">
        <div className="px-6 pt-8 pb-6">
          <Link to="/dashboard" className="font-display text-3xl">
            Connectly
          </Link>
        </div>

        <div className="px-4 space-y-2">
          <Link
            to="/clientes/novo"
            className="block w-full text-center bg-white text-sidebar font-semibold py-2.5 rounded-full text-sm hover:bg-white/90 transition"
          >
            <Plus className="inline w-4 h-4 -mt-0.5 mr-1" />
            LEAD
          </Link>
          <Link
            to="/orcamentos/novo"
            className="block w-full text-center bg-white text-sidebar font-semibold py-2.5 rounded-full text-sm hover:bg-white/90 transition"
          >
            <Plus className="inline w-4 h-4 -mt-0.5 mr-1" />
            Orçamento
          </Link>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <Link to="/perfil" className="flex items-center gap-2 text-sm font-medium hover:opacity-80">
            <UserCircle2 className="w-5 h-5" />
            <span className="truncate">{displayName}</span>
          </Link>
          <Link
            to="/perfil"
            className="flex items-center gap-2 text-xs mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurações
          </Link>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
            className="flex items-center gap-2 text-xs mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 p-8 md:p-10 print:ml-0 print:p-0">{children}</main>
    </div>
  );
}
