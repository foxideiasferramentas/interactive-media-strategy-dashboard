import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  ArrowRight,
  DollarSign,
  Target,
  Calendar,
  PlayCircle,
  PauseCircle,
  Clock,
  X,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Pencil,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useStore } from "../data/store";
import type { Campaign, Client } from "../data/types";
import { generateStrategy, getGeminiKey } from "../lib/aiStrategy";
import { slugify } from "../utils/slug";

// ─── Status map ───────────────────────────────────────────────────────────────

const statusMap = {
  active: {
    icon: PlayCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "Ativa",
    border: "border-emerald-100",
  },
  paused: {
    icon: PauseCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Pausada",
    border: "border-amber-200",
  },
  planning: {
    icon: Clock,
    color: "text-slate-400",
    bg: "bg-slate-50",
    label: "Planejamento",
    border: "border-slate-200",
  },
};

// ─── Default funnel / meta / google structures ─────────────────────────────────

function emptyFunnelStage(subtitle: string) {
  return {
    subtitle,
    description: "",
    metricValue: "",
    metricUnit: "impressões/mês",
    channels: [],
  };
}

function emptyCampaign(clientId: string): Omit<Campaign, "id"> {
  return {
    name: "",
    clientId,
    status: "planning",
    budget: 0,
    budgetAllocation: { metaPercent: 65, googlePercent: 35 },
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    objectives: { roas: "", leads: "", reach: "", cac: "" },
    funnel: {
      top: emptyFunnelStage("Conscientização"),
      middle: emptyFunnelStage("Consideração"),
      bottom: emptyFunnelStage("Conversão"),
    },
    meta: { top: [], middle: [], bottom: [] },
    google: { top: [], middle: [], bottom: [] },
  };
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function ClientSelect({
  clients,
  value,
  onChange,
  error,
}: {
  clients: Client[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
        Cliente
      </label>
      {clients.length === 0 ? (
        <p className="text-sm text-red-500">
          Nenhum cliente cadastrado. Crie um cliente primeiro.
        </p>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer ${
            error ? "border-red-300" : "border-slate-200"
          }`}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.company}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function BudgetAndDates({
  budget,
  setBudget,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  errors,
  ringColor = "blue",
}: {
  budget: string;
  setBudget: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  errors: Record<string, string>;
  ringColor?: "blue" | "violet";
}) {
  const ring =
    ringColor === "violet"
      ? "focus:ring-violet-500/10 focus:border-violet-500"
      : "focus:ring-blue-500/10 focus:border-blue-500";
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Budget Mensal (R$)
        </label>
        <input
          type="number"
          value={budget}
          placeholder="Ex: 15000"
          min={0}
          onChange={(e) => setBudget(e.target.value)}
          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 ${ring} ${
            errors.budget ? "border-red-300" : "border-slate-200"
          }`}
        />
        {errors.budget && (
          <p className="text-xs text-red-500">{errors.budget}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Início
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 ${ring} ${
              errors.startDate ? "border-red-300" : "border-slate-200"
            }`}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Término (opcional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 ${ring}`}
          />
        </div>
      </div>
    </>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onSave: (data: Omit<Campaign, "id">) => void;
  onClose: () => void;
  clients: Client[];
}

type ModalMode = "choose" | "manual" | "ai" | "generating" | "error";

function CreateModal({ onSave, onClose, clients }: CreateModalProps) {
  const [mode, setMode] = useState<ModalMode>("choose");

  // Shared fields
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState("");
  const [slug, setSlug] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Manual-only
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Campaign["status"]>("planning");

  // AI-only
  const [instructions, setInstructions] = useState("");
  const [aiError, setAiError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  const validateBase = () => {
    const e: Record<string, string> = {};
    if (!clientId) e.clientId = "Selecione um cliente.";
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0)
      e.budget = "Budget deve ser um valor positivo.";
    if (!startDate) e.startDate = "Data de início é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Manual submit ──────────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome é obrigatório.";
    if (!clientId) e.clientId = "Selecione um cliente.";
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0)
      e.budget = "Budget deve ser um valor positivo.";
    if (!startDate) e.startDate = "Data de início é obrigatória.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const base = emptyCampaign(clientId);
    onSave({ ...base, name: name.trim(), slug: slug.trim(), budget: Number(budget), startDate, endDate, status });
  };

  // ── AI submit ─────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!validateBase()) return;

    const apiKey = getGeminiKey();
    if (!apiKey) {
      setAiError(
        "Chave da API Gemini não configurada. Vá em Configurações → Integração com IA."
      );
      setMode("error");
      return;
    }

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    setMode("generating");
    setAiError("");

    try {
      const result = await generateStrategy({
        client,
        budget: Number(budget),
        startDate,
        endDate,
        instructions,
        apiKey,
      });

      onSave({ ...result, clientId, slug: slug.trim() || slugify(result.name), status: "planning" });
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao gerar estratégia."
      );
      setMode("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={mode === "generating" ? undefined : onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* ── Mode: choose ────────────────────────────────────────────────── */}
        {mode === "choose" && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Nova Campanha</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Como você quer criar a estratégia desta campanha?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode("ai")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-violet-200 bg-violet-50 hover:border-violet-400 hover:bg-violet-100 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">
                    Gerar com IA
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    O Gemini cria toda a estratégia: funil, públicos e copies a partir do briefing do cliente.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("manual")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100 transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">
                    Manual
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Crie a campanha em branco e configure a estratégia manualmente no editor.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Mode: manual ────────────────────────────────────────────────── */}
        {mode === "manual" && (
          <div className="p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("choose")} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4 rotate-180" />
                </button>
                <h3 className="text-xl font-bold text-slate-900">Campanha Manual</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} error={errors.clientId} />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={name}
                  placeholder="Ex: Lançamento Produto Q2"
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 ${
                    errors.name ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Identificador na URL (Slug)
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl">
                  <span className="text-xs text-slate-400 font-mono">dashboard/</span>
                  <input
                    type="text"
                    value={slug}
                    placeholder="nome-da-campanha"
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="flex-1 bg-transparent border-none p-0 text-sm font-mono text-blue-600 focus:ring-0 placeholder:text-slate-300"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Este será o endereço acessível pelo cliente. Use apenas letras, números e hifens.
                </p>
              </div>

              <BudgetAndDates
                budget={budget} setBudget={setBudget}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                errors={errors}
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Status Inicial
                </label>
                <div className="flex gap-2">
                  {(["planning", "active", "paused"] as Campaign["status"][]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        status === s
                          ? `${statusMap[s].bg} ${statusMap[s].color} ${statusMap[s].border}`
                          : "border-slate-200 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {statusMap[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-4">
              Após criar, configure a estratégia completa no Editor de Estratégia.
            </p>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={clients.length === 0}
                className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        )}

        {/* ── Mode: ai ────────────────────────────────────────────────────── */}
        {mode === "ai" && (
          <div className="p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <button onClick={() => setMode("choose")} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4 rotate-180" />
                </button>
                <h3 className="text-xl font-bold text-slate-900">Gerar com IA</h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-md bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-violet-600" />
              </div>
              <p className="text-xs text-slate-500">
                O Gemini vai gerar funil, públicos e copies completos a partir do briefing do cliente.
              </p>
            </div>

            <div className="space-y-5">
              <ClientSelect clients={clients} value={clientId} onChange={setClientId} error={errors.clientId} />

              <BudgetAndDates
                budget={budget} setBudget={setBudget}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                errors={errors}
                ringColor="violet"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Orientações para a IA (opcional)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ex: Focar em conversão para leads qualificados. Evitar público abaixo de 30 anos. Tom de voz mais corporativo. Priorizar Google Search sobre Display..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={clients.length === 0}
                className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Gerar Estratégia
              </button>
            </div>
          </div>
        )}

        {/* ── Mode: generating ────────────────────────────────────────────── */}
        {mode === "generating" && (
          <div className="p-12 flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-violet-400" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-20 h-20 text-violet-500 animate-spin opacity-30" />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 mb-1">
                Gerando sua estratégia...
              </p>
              <p className="text-sm text-slate-500 max-w-xs">
                O Gemini está analisando o briefing e criando públicos, funil e copies. Isso pode levar alguns segundos.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {["Analisando briefing do cliente", "Definindo estratégia de funil", "Criando públicos-alvo", "Escrevendo copies"].map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-3 text-left">
                    <Loader2 className={`w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0`} style={{ animationDelay: `${i * 0.2}s` }} />
                    <span className="text-xs text-slate-500">{step}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ── Mode: error ─────────────────────────────────────────────────── */}
        {mode === "error" && (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 mb-1">
                Erro ao gerar estratégia
              </p>
              <p className="text-sm text-slate-500 max-w-xs">{aiError}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => setMode("ai")}
                className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteModal({
  campaign,
  onConfirm,
  onClose,
}: {
  campaign: Campaign;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-8"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Remover Campanha
            </h3>
            <p className="text-sm text-slate-500">
              Tem certeza que deseja remover{" "}
              <span className="font-bold text-slate-700">{campaign.name}</span>?
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type StatusFilter = "all" | Campaign["status"];

export function CampaignManagement() {
  const { clients, campaigns, addCampaign, deleteCampaign, updateCampaign } =
    useStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [modal, setModal] = useState<"create" | "delete" | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? "Cliente Desconhecido";

  const filtered = campaigns.filter((camp) => {
    const matchSearch =
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(camp.clientId)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" || camp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (data: Omit<Campaign, "id">) => {
    const campaign = addCampaign(data);
    setModal(null);
    navigate(`/admin/campaigns/${campaign.id}`);
  };

  const handleDeleteConfirm = () => {
    if (selectedCampaign) deleteCampaign(selectedCampaign.id);
    setModal(null);
    setSelectedCampaign(null);
  };

  const toggleStatus = (camp: Campaign) => {
    const next: Campaign["status"] =
      camp.status === "active"
        ? "paused"
        : camp.status === "paused"
        ? "active"
        : "active";
    updateCampaign({ ...camp, status: next });
  };

  const filterLabels: Record<StatusFilter, string> = {
    all: "Todos os Status",
    active: "Ativas",
    paused: "Pausadas",
    planning: "Planejamento",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-slate-900" style={{ fontWeight: 700 }}>
            Gestão de Campanhas
          </h1>
          <p className="text-slate-500">
            {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""}{" "}
            cadastrada{campaigns.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome da campanha ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-w-[160px] justify-between"
          >
            <span>{filterLabels[statusFilter]}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilterMenu ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden p-1"
              >
                {(
                  ["all", "active", "paused", "planning"] as StatusFilter[]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors font-medium ${
                      statusFilter === s
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {filterLabels[s]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Campaign list */}
      <div className="space-y-4">
        {filtered.map((camp, i) => {
          const status = statusMap[camp.status];
          const StatusIcon = status.icon;
          return (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Status & Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color} border ${status.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-lg text-slate-900 font-bold leading-tight mb-1 truncate group-hover:text-blue-600 transition-colors">
                    {camp.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      /{camp.slug || camp.id}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {getClientName(camp.clientId)}
                  </p>
                </div>

                {/* Info bar */}
                <div className="flex flex-wrap items-center gap-8 py-4 lg:py-0 border-t lg:border-t-0 border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">
                        Budget Mensal
                      </p>
                      <p className="text-sm text-slate-900 font-bold leading-none">
                        R$ {camp.budget.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">
                        ROAS Alvo
                      </p>
                      <p className="text-sm text-slate-900 font-bold leading-none">
                        {camp.objectives.roas || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest leading-none mb-1">
                        Início
                      </p>
                      <p className="text-sm text-slate-900 font-bold leading-none">
                        {camp.startDate
                          ? new Date(camp.startDate + "T00:00:00").toLocaleDateString("pt-BR", {
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 lg:ml-auto">
                  <button
                    onClick={() => toggleStatus(camp)}
                    title={
                      camp.status === "active" ? "Pausar" : "Ativar"
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      camp.status === "active"
                        ? "border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100"
                        : camp.status === "paused"
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {camp.status === "active" ? (
                      <PauseCircle className="w-4 h-4" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/admin/campaigns/${camp.id}`)}
                    className="flex-1 lg:flex-none py-2.5 px-6 bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    Configurar Estratégia
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setModal("delete");
                    }}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remover campanha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-500 font-medium">
              {campaigns.length === 0
                ? "Nenhuma campanha cadastrada ainda."
                : "Nenhuma campanha encontrada com esse filtro."}
            </p>
            {campaigns.length === 0 && (
              <button
                onClick={() => setModal("create")}
                className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar primeira campanha
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === "create" && (
          <CreateModal
            onSave={handleCreate}
            onClose={() => setModal(null)}
            clients={clients}
          />
        )}
        {modal === "delete" && selectedCampaign && (
          <DeleteModal
            campaign={selectedCampaign}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setModal(null);
              setSelectedCampaign(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
