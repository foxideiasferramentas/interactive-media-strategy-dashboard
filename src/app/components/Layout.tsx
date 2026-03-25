import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { BarChart2, TrendingUp, Globe, ChevronRight, ShieldCheck, LayoutDashboard, Megaphone, ChevronDown, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useIsMobile } from "./ui/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { useStore } from "../data/store";
import { LogOut } from "lucide-react";

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  description?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    path: "/",
    label: "Visão Geral",
    icon: LayoutDashboard,
    description: "Resumo estratégico",
  },
  {
    label: "Campanha",
    icon: Megaphone,
    children: [
      {
        path: "/meta-ads",
        label: "Meta Ads",
        icon: Globe,
        description: "Facebook & Instagram",
      },
      {
        path: "/google-ads",
        label: "Google Ads",
        icon: TrendingUp,
        description: "Search & Display",
      },
    ],
  },
];

export function Layout() {
  const { logout } = useStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Campanha"]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-expand group if a child is active
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children?.some(child => child.path === location.pathname)) {
        if (!expandedGroups.includes(item.label)) {
          setExpandedGroups(prev => [...prev, item.label]);
        }
      }
    });
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest leading-none mb-0.5">Apresentação</p>
            <p className="text-sm text-gray-800 leading-tight" style={{ fontWeight: 600 }}>Mídia Paga 2025</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest px-3 mb-3">Navegação</p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isGroup = !!item.children;
          const isExpanded = expandedGroups.includes(item.label);
          const isActive = item.path === location.pathname;
          const isChildActive = item.children?.some(c => c.path === location.pathname);

          if (isGroup) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                    ${isChildActive 
                      ? "text-blue-600 bg-blue-50/50" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isChildActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                  <span className="flex-1 text-sm text-left font-medium">{item.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"} ${isChildActive ? "text-blue-400" : "text-gray-300"}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pt-1 space-y-1">
                        {item.children?.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = child.path === location.pathname;
                          
                          return (
                            <Link
                              key={child.path}
                              to={child.path!}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                                ${isChildActive
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }
                              `}
                            >
                              <ChildIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isChildActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium leading-tight">{child.label}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path!}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                ${isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${isActive ? "text-white" : "text-gray-800"}`} style={{ fontWeight: 500 }}>
                  {item.label}
                </p>
                {item.description && (
                  <p className={`text-xs leading-tight mt-0.5 ${isActive ? "text-blue-100" : "text-gray-400"}`}>
                    {item.description}
                  </p>
                )}
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs text-gray-500">Estratégia Ativa</span>
        </div>
        
        <div className="flex flex-col gap-2 mt-3">
          <Link 
            to="/admin" 
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-blue-600 transition-colors group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            Acesso Restrito Admin
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 transition-colors group pt-1"
          >
            <LogOut className="w-3.5 h-3.5 text-red-300 group-hover:text-red-500 transition-colors" />
            Encerrar Sessão
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
          <SidebarContent />
        </aside>
      )}

      {/* Sidebar - Mobile */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r-0">
            <aside className="h-full flex flex-col bg-white">
              <SidebarContent />
            </aside>
          </SheetContent>
        </Sheet>
      )}

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen ${isMobile ? "ml-0" : "ml-64"}`}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-500"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs text-gray-400 uppercase tracking-wide">Apresentação</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              {navItems.map((item) => {
                if (item.path === location.pathname) {
                  return <span key={item.label} className="text-xs text-gray-700 font-medium">{item.label}</span>;
                }
                const activeChild = item.children?.find(c => c.path === location.pathname);
                if (activeChild) {
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <ChevronRight className="w-3 h-3 text-gray-200" />
                      <span className="text-xs text-gray-700 font-medium">{activeChild.label}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
              Confidencial · Cliente
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
