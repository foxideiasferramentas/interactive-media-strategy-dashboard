import { motion } from "motion/react";
import {
  Users,
  Briefcase,
  TrendingUp,
  Target,
  ArrowUpRight,
  Plus,
  ChevronRight,
  MoreVertical,
  Clock,
  Trash2,
} from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useStore } from "../data/store";
import type { ActivityLog } from "../data/types";

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

// ─── Log item ─────────────────────────────────────────────────────────────────

function LogItem({ log, isLast }: { log: ActivityLog; isLast: boolean }) {
  return (
    <div className="flex gap-3 relative">
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[1px] bg-slate-100" />
      )}
      <div className="w-6 h-6 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center relative z-10 mt-0.5">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
      </div>
      <div>
        <p className="text-xs text-slate-900">
          <span className="font-bold">{log.user}</span> {log.action} em{" "}
          <span className="font-bold">{log.target}</span>
        </p>
        <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
          {relativeTime(log.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { clients, campaigns, activityLogs, clearLogs } = useStore();
  const navigate = useNavigate();

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);

  const campaignsWithLeads = campaigns.filter(
    (c) => c.objectives.leads && c.objectives.leads !== ""
  );
  const leadsGoalText =
    campaignsWithLeads.length > 0
      ? campaignsWithLeads.map((c) => c.objectives.leads).join(", ")
      : "—";

  const stats = [
    {
      label: "Clientes Ativos",
      value: String(clients.length),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Campanhas Ativas",
      value: String(activeCampaigns),
      icon: Briefcase,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Investimento Sob Gestão",
      value:
        totalBudget >= 1000
          ? `R$ ${(totalBudget / 1000).toFixed(0)}k`
          : `R$ ${totalBudget.toLocaleString("pt-BR")}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Meta de Leads",
      value: leadsGoalText,
      icon: Target,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const recentClients = [...clients].slice(0, 5);
  const recentLogs = activityLogs.slice(0, 6);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl md:text-2xl text-slate-900"
            style={{ fontWeight: 700 }}
          >
            Olá, Time de Estratégia 👋
          </h1>
          <p className="text-sm text-slate-500">
            Aqui está o que está acontecendo nas suas contas hoje.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/campaigns")}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-emerald-500 text-[10px] md:text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                Ativo
              </span>
            </div>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="text-xl md:text-2xl text-slate-900" style={{ fontWeight: 800 }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Clients */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3
              className="text-lg text-slate-900"
              style={{ fontWeight: 700 }}
            >
              Clientes Recentes
            </h3>
            <Link
              to="/admin/clients"
              className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentClients.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <p className="text-slate-400 font-medium mb-3">
                Nenhum cliente cadastrado ainda.
              </p>
              <Link
                to="/admin/clients"
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Cadastrar primeiro cliente
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Campanhas
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-widests">
                      Status
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/clients")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                            style={{ backgroundColor: client.color }}
                          >
                            {client.company.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {client.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {client.company}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.activeCampaigns} campanha
                        {client.activeCampaigns !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            client.activeCampaigns > 0
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {client.activeCampaigns > 0 ? "Ativo" : "Sem camp."}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

        {/* Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3
              className="text-lg text-slate-900"
              style={{ fontWeight: 700 }}
            >
              Últimas Atualizações
            </h3>
            {activityLogs.length > 0 && (
              <button
                onClick={clearLogs}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Limpar log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  Nenhuma atividade registrada ainda.
                </p>
                <p className="text-xs text-slate-300">
                  Ações como criar campanhas e editar clientes aparecem aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentLogs.map((log, i) => (
                  <LogItem
                    key={log.id}
                    log={log}
                    isLast={i === recentLogs.length - 1}
                  />
                ))}
                {activityLogs.length > 6 && (
                  <p className="text-xs text-center text-slate-400 pt-2 border-t border-slate-50">
                    +{activityLogs.length - 6} atividades anteriores
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
