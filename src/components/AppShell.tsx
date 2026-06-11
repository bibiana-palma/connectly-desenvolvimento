import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { RefreshProvider } from "@/lib/refresh-context";
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
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
  const [expanded, setExpanded] = useState(false);
  const [displayName, setDisplayName] = useState<string>("Usuario");

  const sidebarWidth = expanded ? "w-64" : "w-16";

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setDisplayName(user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario");
  }, [user]);


  useEffect(() => {
    if (!user) return;
    let mounted = true;
    // try to load profile name from `profiles` table (works with mock or Supabase)
    (async () => {
      try {
        const res = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const data = (res as any)?.data;
        if (mounted && data?.name) setDisplayName(data.name);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <RefreshProvider>
      <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarWidth} xl:w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30 print:hidden transition-all duration-300`}>
        <div className="px-2 xl:px-6 pt-8 pb-6 flex items-center justify-center xl:justify-start">
          <Link to="/dashboard" className="font-display text-3xl hidden xl:block">
            Connectly
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="xl:hidden p-2 rounded-md hover:bg-sidebar-accent transition"
            title={expanded ? "Recolher menu" : "Expandir menu"}
          >
            {expanded ? (
              <PanelLeftClose className="w-5 h-5 text-sidebar-foreground" />
            ) : (
              <PanelLeft className="w-5 h-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        <div className="px-2 xl:px-4 space-y-2">
          <Link
            to="/clientes/novo"
            className="block w-full text-center bg-white text-sidebar font-semibold py-2.5 rounded-full text-xs xl:text-sm hover:bg-white/90 transition"
            title="LEAD"
          >
            <Plus className="inline w-4 h-4 -mt-0.5 xl:mr-1" />
            <span className={`${expanded ? "inline" : "hidden"} xl:inline`}>LEAD</span>
          </Link>
          <Link
            to="/orcamentos/novo"
            className="block w-full text-center bg-white text-sidebar font-semibold py-2.5 rounded-full text-xs xl:text-sm hover:bg-white/90 transition"
            title="Orçamento"
          >
            <Plus className="inline w-4 h-4 -mt-0.5 xl:mr-1" />
            <span className={`${expanded ? "inline" : "hidden"} xl:inline`}>Orçamento</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 xl:px-4 mt-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition justify-center xl:justify-start ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/90 hover:bg-sidebar-accent/60"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 xl:w-4 xl:h-4 shrink-0" />
                <span className={`${expanded ? "inline" : "hidden"} xl:inline`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 xl:px-4 py-4 border-t border-sidebar-border">
          <Link to="/perfil" className="flex items-center gap-2 text-sm font-medium hover:opacity-80 justify-center xl:justify-start">
            <UserCircle2 className="w-5 h-5 shrink-0" />
            <span className={`${expanded ? "inline" : "hidden"} xl:inline truncate`}>{displayName}</span>
          </Link>
          <Link
            to="/perfil"
            className="flex items-center gap-2 text-xs mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground justify-center xl:justify-start"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span className={`${expanded ? "inline" : "hidden"} xl:inline`}>Configurações</span>
          </Link>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
            className="flex items-center gap-2 text-xs mt-2 text-sidebar-foreground/80 hover:text-sidebar-foreground w-full justify-center xl:justify-start"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={`${expanded ? "inline" : "hidden"} xl:inline`}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${expanded ? "ml-64" : "ml-16 xl:ml-64"} p-4 md:p-6 xl:p-8 print:ml-0 print:p-0`}>{children}</main>
      </div>
    </RefreshProvider>
  );
}
