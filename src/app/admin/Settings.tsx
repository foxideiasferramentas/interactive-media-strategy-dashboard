import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  Monitor,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
  Key,
  Download,
  Upload,
  Database,
} from "lucide-react";
import { useStore } from "../data/store";
import { AnimatePresence } from "motion/react";
import {
  getGeminiKey,
  saveGeminiKey,
  getGeminiModel,
  saveGeminiModel,
  GEMINI_MODELS,
} from "../lib/aiStrategy";
import { seedClients, seedCampaigns } from "../data/mockData";



// ─── Main ─────────────────────────────────────────────────────────────────────

export function Settings() {
  const {
    campaigns,
    clients,
    activeCampaignId,
    setActiveCampaignId,
    getActiveCampaign,
  } = useStore();

  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gemini API key + model state
  const [geminiKey, setGeminiKey] = useState(getGeminiKey);
  const [geminiModel, setGeminiModel] = useState(getGeminiModel);
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const keySavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveKey = () => {
    saveGeminiKey(geminiKey.trim());
    saveGeminiModel(geminiModel);
    setKeySaved(true);
    if (keySavedTimerRef.current) clearTimeout(keySavedTimerRef.current);
    keySavedTimerRef.current = setTimeout(() => setKeySaved(false), 2000);
  };

  const activeCampaign = getActiveCampaign();
  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? "Cliente Desconhecido";

  const handleSetActive = (id: string) => {
    setActiveCampaignId(id);
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  };



  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl text-slate-900" style={{ fontWeight: 700 }}>
          Configurações
        </h1>
        <p className="text-slate-500">
          Gerencie as preferências do painel administrativo.
        </p>
      </div>

      {/* ── Campanha em Apresentação ──────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Campanha em Apresentação
            </h2>
            <p className="text-xs text-slate-400">
              Define qual campanha aparece nas páginas públicas (Visão Geral,
              Meta Ads, Google Ads).
            </p>
          </div>
          {saved && (
            <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Salvo
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {campaigns.length === 0 ? (
            <p className="px-8 py-6 text-sm text-slate-400">
              Nenhuma campanha cadastrada ainda.
            </p>
          ) : (
            campaigns.map((camp) => {
              const isActive =
                activeCampaignId === camp.id ||
                (!activeCampaignId && activeCampaign?.id === camp.id);
              return (
                <motion.button
                  key={camp.id}
                  onClick={() => handleSetActive(camp.id)}
                  whileHover={{ backgroundColor: "#f8fafc" }}
                  className="w-full flex items-center gap-4 px-8 py-5 text-left transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {camp.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {getClientName(camp.clientId)} · R${" "}
                      {camp.budget.toLocaleString("pt-BR")}/mês
                    </p>
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Ativa
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </section>

      {/* ── Integração com IA (Gemini) ────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Integração com IA — Gemini
            </h2>
            <p className="text-xs text-slate-400">
              Chave para geração automática de estratégias. Salva apenas no seu
              navegador, nunca enviada a servidores externos.
            </p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
              <Key className="w-3 h-3" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Obtenha sua chave em{" "}
              <span className="font-mono text-violet-600">
                aistudio.google.com
              </span>{" "}
              → Get API Key.
            </p>
          </div>

          {/* Model selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              Modelo
            </label>
            <div className="space-y-2">
              {GEMINI_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setGeminiModel(m.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    geminiModel === m.id
                      ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400/30"
                      : "border-slate-100 bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      geminiModel === m.id
                        ? "border-violet-600 bg-violet-600"
                        : "border-slate-300"
                    }`}
                  >
                    {geminiModel === m.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <span className="text-sm font-bold text-slate-800">
                        {m.label}
                      </span>
                      {m.free ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                          Gratuito
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                          Limite reduzido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveKey}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-xl text-sm font-bold transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Salvar Configurações
            </button>
            <AnimatePresence>
              {keySaved && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Configurações salvas!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>


    </div>
  );
}
