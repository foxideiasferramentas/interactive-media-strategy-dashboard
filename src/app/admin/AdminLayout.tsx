import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Users,
  Briefcase,
  Settings,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Bell,
  Search,
  ChevronRight,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../data/store";
import { useIsMobile } from "../components/ui/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Button } from "../components/ui/button";

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/clients", label: "Clientes", icon: Users },
  { path: "/admin/campaigns", label: "Campanhas", icon: Briefcase },
  { path: "/admin/settings", label: "Configurações", icon: Settings },
];

// ─── Global Search ────────────────────────────────────────────────────────────

function GlobalSearch() {
  const { clients, campaigns } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();

  const matchedClients = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      )
    : [];

  const matchedCampaigns = q
    ? campaigns.filter((c) => c.name.toLowerCase().includes(q))
    : [];

  const hasResults = matchedClients.length > 0 || matchedCampaigns.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          value={query}
          placeholder="Buscar clientes, campanhas..."
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
        />
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {!hasResults ? (
              <p className="px-5 py-4 text-sm text-slate-400">
                Nenhum resultado para "{query}"
              </p>
            ) : (
              <div className="py-2">
                {matchedClients.length > 0 && (
                  <>
                    <p className="px-5 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Clientes
                    </p>
                    {matchedClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelect("/admin/clients")}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.company.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-400">{c.company}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                      </button>
                    ))}
                  </>
                )}

                {matchedCampaigns.length > 0 && (
                  <>
                    <p className="px-5 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest border-t border-slate-50 mt-1 pt-3">
                      Campanhas
                    </p>
                    {matchedCampaigns.map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          handleSelect(`/admin/campaigns/${c.id}`)
                        }
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            R$ {c.budget.toLocaleString("pt-BR")}/mês
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { logout } = useStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-6 py-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none mb-1.5">
              Painel Admin
            </p>
            <p className="text-white font-bold text-base leading-tight">
              Fox Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-8 space-y-1.5">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/admin" &&
              location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span className="text-sm font-semibold flex-1">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold text-left">Sair do Sistema</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 flex flex-col z-30 shadow-xl">
          <SidebarContent />
        </aside>
      )}

      {/* Sidebar - Mobile */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r-0 bg-slate-900 text-white">
            <aside className="h-full flex flex-col">
              <SidebarContent />
            </aside>
          </SheetContent>
        </Sheet>
      )}

      {/* Main */}
      <div className={`flex-1 flex flex-col ${isMobile ? "ml-0" : "ml-64"}`}>
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 gap-4 md:gap-6">
          <div className="flex items-center gap-4 flex-1">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-slate-500"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="relative w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                  Fox Admin
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Administrador
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-sm">
                FA
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
