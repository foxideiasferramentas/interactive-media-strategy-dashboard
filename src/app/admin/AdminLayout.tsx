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
  ChevronLeft,
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



// ─── Main Layout ──────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { logout } = useStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className={`px-6 py-8 border-b border-slate-800 ${isCollapsed && !isMobile ? "flex justify-center px-0" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20 flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed || isMobile ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none mb-1.5">
                Painel Admin
              </p>
              <p className="text-white font-bold text-base leading-tight">
                Fox Dashboard
              </p>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 px-4 py-8 space-y-1.5 ${isCollapsed && !isMobile ? "flex flex-col items-center" : ""}`}>
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
              title={isCollapsed && !isMobile ? item.label : ""}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              } ${isCollapsed && !isMobile ? "w-12 h-12 justify-center px-0" : "w-full"}`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              {!isCollapsed || isMobile ? (
                <span className="text-sm font-semibold flex-1">{item.label}</span>
              ) : null}
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

      {/* User Info */}
      <div className={`mx-4 mt-auto p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center gap-3 mb-2 ${isCollapsed && !isMobile ? "px-0 justify-center bg-transparent border-none shadow-none" : ""}`}>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-900/20 flex-shrink-0">
          FA
        </div>
        {!isCollapsed || isMobile ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-none mb-1 truncate">
              Fox Admin
            </p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
              Administrador
            </p>
          </div>
        ) : null}
      </div>

      {/* Logout */}
      <div className={`p-4 border-t border-slate-800 ${isCollapsed && !isMobile ? "flex justify-center" : ""}`}>
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all ${
            isCollapsed && !isMobile ? "w-12 h-12 justify-center px-0" : "w-full"
          }`}
          title={isCollapsed && !isMobile ? "Sair do Sistema" : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed || isMobile ? (
            <span className="text-sm font-semibold text-left">Sair do Sistema</span>
          ) : null}
        </button>
      </div>

      {/* Toggle Collapse - Desktop Only */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-lg z-50 transition-all hover:bg-slate-700"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside 
          className={`fixed top-0 left-0 h-screen bg-slate-900 flex flex-col z-30 shadow-xl transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
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
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isMobile ? "ml-0" : isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {/* Simple Header - Mobile Only */}
        {isMobile && (
          <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center sticky top-0 z-20 gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-bold text-slate-900">Fox Dashboard</span>
            <div className="ml-auto">
              <button className="relative w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
