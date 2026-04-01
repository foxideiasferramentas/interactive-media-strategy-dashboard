import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Building2, Globe, Save, ExternalLink } from "lucide-react";
import { useStore } from "../data/store";
import { normalizeMediaUrl } from "../utils/media";

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, updateClient } = useStore();

  const client = clients.find((c) => c.id === id);

  const [avatar, setAvatar] = useState(client?.logo ?? "");
  const [saved, setSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Building2 className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium">Cliente não encontrado.</p>
        <button onClick={() => navigate("/admin/clients")} className="mt-4 text-blue-600 text-sm font-bold hover:underline">
          Voltar para Clientes
        </button>
      </div>
    );
  }

  const handleSave = () => {
    updateClient({ ...client, logo: avatar.trim() });
    setSaved(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  const normalized = normalizeMediaUrl(avatar.trim());

  // Mini ad preview — simulates the Meta Feed avatar circle
  const AvatarPreview = ({ size, showLabel }: { size: "sm" | "lg"; showLabel?: boolean }) => {
    const dim = size === "lg" ? "w-16 h-16" : "w-9 h-9";
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`${dim} rounded-full border-2 border-slate-200 overflow-hidden flex items-center justify-center bg-slate-100 shrink-0`}
        >
          {normalized ? (
            <img
              src={normalized}
              alt={client.company}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Globe className={`${size === "lg" ? "w-8 h-8" : "w-4 h-4"} text-slate-300`} />
          )}
        </div>
        {showLabel && (
          <p className="text-[10px] text-slate-400 font-medium">{size === "lg" ? "Tamanho grande" : "Tamanho pequeno"}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/clients")}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.company}</h1>
            <p className="text-slate-400 text-sm">{client.name}</p>
          </div>
        </div>
        {/* Color badge */}
        <div className="ml-0 sm:ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit" style={{ borderColor: client.color + "40", backgroundColor: client.color + "12" }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
          <span className="text-xs font-bold" style={{ color: client.color }}>
            {client.activeCampaigns} campanha{client.activeCampaigns !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50">
          <h2 className="text-base font-bold text-slate-900">Avatar / Logo</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Esta imagem aparece nos previews dos anúncios Meta Ads e Google Ads.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* URL input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              URL da Imagem
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => { setAvatar(e.target.value); setSaved(false); }}
              placeholder="https://exemplo.com/logo.png  ou link do Dropbox"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              Suporta Dropbox, links diretos (.png, .jpg, .webp) e qualquer URL pública de imagem.
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Preview nos Anúncios</p>
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex gap-8">
                <AvatarPreview size="lg" showLabel />
                <AvatarPreview size="sm" showLabel />
              </div>

              {/* Simulated ad header */}
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900 leading-none truncate">{client.company}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Patrocinado · 🌐</p>
                  </div>
                </div>
                <div className="mt-3 h-12 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3 pt-2">
            <motion.button
              onClick={handleSave}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                saved
                  ? "bg-emerald-500 text-white shadow-emerald-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? "Salvo!" : "Salvar Avatar"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Client info summary */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50">
          <h2 className="text-base font-bold text-slate-900">Informações do Cliente</h2>
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Responsável</p>
              <p className="text-sm font-medium text-slate-700">{client.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Empresa</p>
              <p className="text-sm font-medium text-slate-700">{client.company}</p>
            </div>
            {client.website && (
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Site</p>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  {client.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {client.briefing && (
              <div className="space-y-1 col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Briefing</p>
                <p className="text-sm text-slate-500 leading-relaxed">{client.briefing}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
