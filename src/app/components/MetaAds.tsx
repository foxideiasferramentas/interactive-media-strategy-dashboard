import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Plus, X, Library, Search as SearchIcon, Users, BookmarkCheck, Pencil, Trash2 } from "lucide-react";
import { MetaIcon } from "./BrandIcons";
import { FunnelSidebar } from "./FunnelSidebar";
import { CreativeCard } from "./CreativeCard";
import { CreativeModal, type Creative } from "./CreativeModal";
import { MetaCreativeEditor } from "./CreativeEditors";
import { useStore } from "../data/store";
import type { MetaAudience, MetaCreative, SavedAudience, SavedCreative } from "../data/types";

type FunnelStep = "top" | "middle" | "bottom";

// ─── uid helper ───────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

// ─── Library Picker Modal (públicos) ─────────────────────────────────────────

function LibraryPickerModal({
  savedAudiences,
  onPick,
  onClose,
}: {
  savedAudiences: SavedAudience[];
  onPick: (audience: MetaAudience) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = savedAudiences.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.audience.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Biblioteca da Agência</h3>
              <p className="text-xs text-slate-400">Públicos · {filtered.length} salvo{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar público na biblioteca..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" autoFocus />
          </div>
        </div>
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">{savedAudiences.length === 0 ? "Nenhum público salvo ainda." : "Nenhum resultado para essa busca."}</p>
            </div>
          ) : (
            filtered.map((saved) => (
              <button key={saved.id} onClick={() => {
                const isCrossPlatform = saved.type !== "meta";
                const fresh: MetaAudience = {
                  ...saved.audience as MetaAudience,
                  id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                  creatives: isCrossPlatform ? [] : (saved.audience.creatives as MetaCreative[]).map((c) => ({ ...c, id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
                };
                onPick(fresh);
                onClose();
              }} className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${saved.type === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700">{saved.label}</p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${saved.type === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>{saved.type === "meta" ? "META" : "GADS"}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{saved.audience.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{saved.audience.tag} · {saved.audience.creatives.length} criativo{saved.audience.creatives.length !== 1 ? "s" : ""} · {new Date(saved.savedAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className="text-xs text-violet-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0">Usar</span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Audience Edit Modal ──────────────────────────────────────────────────────

function AudienceEditModal({
  audience,
  onSave,
  onClose,
}: {
  audience: MetaAudience;
  onSave: (updated: MetaAudience) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MetaAudience>({ ...audience });

  const field = (key: keyof MetaAudience) => (
    <input
      type="text"
      value={(draft[key] as string) ?? ""}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
    />
  );

  const textarea = (key: keyof MetaAudience) => (
    <textarea
      value={(draft[key] as string) ?? ""}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
      rows={3}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Editar Público</h3>
              <p className="text-xs text-slate-400">Meta Ads</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Título</label>
            {field("title")}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Tag / Segmentação</label>
            {field("tag")}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Descrição</label>
            {textarea("description")}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Sobre o público</label>
            {textarea("about")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Gênero</label>
              {field("gender")}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Faixa etária</label>
              {field("ageRange")}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Interesses</label>
            {textarea("interests")}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Keywords</label>
            {textarea("keywords")}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancelar</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">Salvar</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Creative Edit Modal ───────────────────────────────────────────────────────

function CreativeEditModal({
  creative,
  onSave,
  onClose,
}: {
  creative: MetaCreative;
  onSave: (updated: MetaCreative) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MetaCreative>({ ...creative });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-bold text-slate-900">Editar Criativo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <MetaCreativeEditor
            creative={draft}
            onChange={setDraft}
            onRemove={onClose}
            collapsible={false}
            initialOpen={true}
          />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancelar</button>
          <button onClick={() => { onSave(draft); onClose(); }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">Salvar</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Creative Library Picker Modal ────────────────────────────────────────────

function CreativePickerModal({
  savedCreatives,
  onPick,
  onClose,
}: {
  savedCreatives: SavedCreative[];
  onPick: (creative: MetaCreative) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = savedCreatives.filter(
    (s) => s.platform === "meta" && s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Biblioteca de Criativos</h3>
              <p className="text-xs text-slate-400">Meta Ads · {filtered.length} criativo{filtered.length !== 1 ? "s" : ""} salvos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar criativo..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" autoFocus />
          </div>
        </div>
        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">{savedCreatives.filter((s) => s.platform === "meta").length === 0 ? "Nenhum criativo salvo ainda." : "Nenhum resultado para essa busca."}</p>
            </div>
          ) : (
            filtered.map((saved) => (
              <button key={saved.id} onClick={() => {
                onPick({ ...saved.creative as MetaCreative, id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` });
                onClose();
              }} className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-100 text-blue-600">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700">{saved.label}</p>
                  <p className="text-xs text-slate-500 truncate">{saved.creative.name} · {saved.creative.format}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">salvo {new Date(saved.savedAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className="text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0">Usar</span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Convert MetaCreative → Creative (for CreativeCard/Modal) ─────────────────

function toCreative(c: MetaCreative): Creative {
  const isVideo = c.format === "Video";
  return {
    id: c.id,
    format: c.format,
    image: isVideo ? (c.videos?.[0] ?? c.imageUrl) : (c.images?.[0] ?? c.imageUrl),
    headline: c.headline,
    body: c.primaryText,
    cta: c.cta,
    displayLink: c.displayLink,
    primaryText: c.primaryText,
    carouselCards: c.carouselCards,
    primaryPlacement: c.primaryPlacement,
    description: c.description,
    imageFocalPoints: c.imageFocalPoints,
    images: isVideo
      ? (c.videos?.length ? c.videos : (c.imageUrl ? [c.imageUrl] : []))
      : (c.images?.length ? c.images : (c.imageUrl ? [c.imageUrl] : [])),
    videos: c.videos,
  };
}

// ─── Step colors ──────────────────────────────────────────────────────────────

const stepColors: Record<
  FunnelStep,
  { badge: string; accent: string; ring: string; text: string }
> = {
  top: {
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    accent: "bg-blue-600",
    ring: "border-blue-500 ring-2 ring-blue-500/20 shadow-md",
    text: "text-blue-700",
  },
  middle: {
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    accent: "bg-violet-600",
    ring: "border-violet-500 ring-2 ring-violet-500/20 shadow-md",
    text: "text-violet-700",
  },
  bottom: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    accent: "bg-emerald-600",
    ring: "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md",
    text: "text-emerald-700",
  },
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ step }: { step: FunnelStep }) {
  const labels: Record<FunnelStep, string> = {
    top: "Topo de Funil",
    middle: "Meio de Funil",
    bottom: "Fundo de Funil",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 md:px-8 py-10 md:py-16 text-center">
      <p className="text-gray-400 font-medium text-lg">
        Nenhum público cadastrado para o {labels[step]}.
      </p>
      <p className="text-base text-gray-300 mt-2">
        Adicione públicos e criativos no Painel Admin → Editor de Estratégia.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MetaAds() {
  const { campaignId } = useParams();
  const { getActiveCampaign, getCampaign, getClient, updateCampaign, isAuthenticated, savedAudiences, savedCreatives } = useStore();
  const campaign = campaignId ? getCampaign(campaignId) : getActiveCampaign();
  const client = campaign ? getClient(campaign.clientId) : undefined;
  const companyName = client?.company;
  const companyUrl = client?.website;
  const companyLogo = client?.logo;

  const allSteps: FunnelStep[] = ["top", "middle", "bottom"];
  const filledSteps = allSteps.filter((s) => (campaign?.meta[s]?.length ?? 0) > 0);
  const defaultStep = filledSteps[0] ?? "top";

  const [activeStep, setActiveStep] = useState<FunnelStep>(defaultStep);
  const [selectedAudienceIndex, setSelectedAudienceIndex] = useState(0);
  const [expandedAudienceIndex, setExpandedAudienceIndex] = useState<number | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [showAudienceLibrary, setShowAudienceLibrary] = useState(false);
  const [showCreativeLibrary, setShowCreativeLibrary] = useState(false);
  const [editingAudience, setEditingAudience] = useState<MetaAudience | null>(null);
  const [editingCreative, setEditingCreative] = useState<MetaCreative | null>(null);

  const addAudience = () => {
    if (!campaign) return;
    const newAud: MetaAudience = { id: uid(), title: "Novo Público", description: "", tag: "Segmentação", creatives: [] };
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: [...campaign.meta[activeStep], newAud] } });
    setSelectedAudienceIndex(campaign.meta[activeStep].length);
  };

  const addAudienceFromLibrary = (aud: MetaAudience) => {
    if (!campaign) return;
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: [...campaign.meta[activeStep], aud] } });
    setSelectedAudienceIndex(campaign.meta[activeStep].length);
  };

  const addCreativeFromLibrary = (creative: MetaCreative) => {
    if (!campaign || !selectedAudience) return;
    const updatedAud = { ...selectedAudience, creatives: [...selectedAudience.creatives, creative] };
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: campaign.meta[activeStep].map((a) => a.id === updatedAud.id ? updatedAud : a) } });
  };

  const updateAudience = (updated: MetaAudience) => {
    if (!campaign) return;
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: campaign.meta[activeStep].map((a) => a.id === updated.id ? updated : a) } });
  };

  const removeAudience = (id: string) => {
    if (!campaign) return;
    const next = campaign.meta[activeStep].filter((a) => a.id !== id);
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: next } });
    setSelectedAudienceIndex(0);
  };

  const addCreative = () => {
    if (!campaign || !selectedAudience) return;
    const newCr: MetaCreative = { id: `cr-${uid()}`, name: "Novo Criativo", format: "Image", imageUrl: "", headline: "", primaryText: "", cta: "Saiba Mais" };
    const updatedAud = { ...selectedAudience, creatives: [...selectedAudience.creatives, newCr] };
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: campaign.meta[activeStep].map((a) => a.id === updatedAud.id ? updatedAud : a) } });
    setEditingCreative(newCr);
  };

  const updateCreative = (updated: MetaCreative) => {
    if (!campaign || !selectedAudience) return;
    const updatedAud = { ...selectedAudience, creatives: selectedAudience.creatives.map((c) => c.id === updated.id ? updated : c) };
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: campaign.meta[activeStep].map((a) => a.id === updatedAud.id ? updatedAud : a) } });
  };

  const removeCreative = (id: string) => {
    if (!campaign || !selectedAudience) return;
    const updatedAud = { ...selectedAudience, creatives: selectedAudience.creatives.filter((c) => c.id !== id) };
    updateCampaign({ ...campaign, meta: { ...campaign.meta, [activeStep]: campaign.meta[activeStep].map((a) => a.id === updatedAud.id ? updatedAud : a) } });
  };

  const handleSaveCreative = (updated: Creative) => {
    if (!campaign) return;
    const steps: FunnelStep[] = ["top", "middle", "bottom"];
    const newMeta = { ...campaign.meta };
    for (const step of steps) {
      newMeta[step] = campaign.meta[step].map((aud) => ({
        ...aud,
        creatives: aud.creatives.map((c) => {
          if (c.id !== updated.id) return c;
          const updatedCreative: MetaCreative = {
            ...c,
            headline: updated.headline,
            primaryText: updated.body, // Use the edited body directly
            cta: updated.cta,
            imageUrl: updated.images?.[0] ?? updated.image ?? c.imageUrl,
            images: updated.images,
            videos: updated.videos,
            carouselCards: updated.carouselCards,
            displayLink: updated.displayLink,
            primaryPlacement: (updated as any).primaryPlacement,
            description: updated.description,
          };
          return updatedCreative;
        }),
      }));
    }
    updateCampaign({ ...campaign, meta: newMeta });
    setSelectedCreative(updated);
  };

  useEffect(() => {
    setSelectedAudienceIndex(0);
  }, [activeStep]);

  const colors = stepColors[activeStep];

  // Audiences for the current step from the active campaign
  const audiences: MetaAudience[] = campaign?.meta[activeStep] ?? [];
  const funnelStage = campaign?.funnel[activeStep];
  const tagline = funnelStage?.subtitle ?? activeStep;
  const objective = funnelStage?.description ?? "";
  const objectiveList = objective
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const selectedAudience = audiences[selectedAudienceIndex];

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 flex-shrink-0">
          <MetaIcon className="w-5 h-5 md:w-6 md:h-6" color="white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h1
              className="text-gray-900"
              style={{ fontWeight: 700, fontSize: "clamp(1.1rem, 4vw, 1.4rem)" }}
            >
              Meta Ads
            </h1>
            <span className="text-xs md:text-sm text-blue-600 bg-blue-50 border border-blue-100 px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium whitespace-nowrap">
              Facebook & Instagram
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-400 leading-snug">
            Segmentação avançada por interesses, comportamentos e remarketing
            multi-etapa
          </p>
        </div>
      </div>

      {/* No campaign */}
      {!campaign && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 md:px-8 py-10 md:py-16 text-center">
          <p className="text-gray-400 font-medium">
            Nenhuma campanha ativa encontrada.
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Configure uma campanha no Painel Admin e defina-a como ativa em
            Configurações.
          </p>
        </div>
      )}

      {campaign && (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Funnel Sidebar */}
          <div className="md:sticky md:top-24 z-10">
            <FunnelSidebar active={activeStep} onChange={setActiveStep} filledSteps={filledSteps.length > 0 ? filledSteps : undefined} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Stage header */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-5 rounded-full ${colors.accent}`} />
                      <p className="text-gray-900 font-semibold text-lg">{tagline}</p>
                    </div>
                    {objectiveList.length > 0 && (
                      <div className="pl-[26px] mt-1.5 space-y-1">
                        {objectiveList.map((obj, i) => (
                          <div key={i} className="flex items-center gap-x-2 text-[15px] text-gray-400 leading-tight">
                            <div className={`w-1 h-1 rounded-full ${colors.accent} opacity-60 flex-shrink-0`} />
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audiences */}
                {audiences.length === 0 && !isAuthenticated ? (
                  <EmptyState step={activeStep} />
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-sm uppercase tracking-widest text-gray-400 font-medium">
                          Públicos-Alvo
                        </p>
                        {isAuthenticated && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowAudienceLibrary(true)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Library className="w-3.5 h-3.5" />
                              Biblioteca
                            </button>
                            <button
                              onClick={addAudience}
                              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Novo Público
                            </button>
                          </div>
                        )}
                      </div>
                      {audiences.length === 0 ? (
                        <div className="bg-white rounded-xl border border-dashed border-gray-200 px-4 md:px-8 py-8 md:py-10 text-center">
                          <p className="text-gray-400 font-medium">Nenhum público nesta etapa.</p>
                          <p className="text-sm text-gray-300 mt-1">Clique em "Novo Público" para começar.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                          {audiences.map((audience, index) => (
                            <AudiencePresentationCard
                              key={audience.id}
                              audience={audience}
                              index={index}
                              isSelected={selectedAudienceIndex === index}
                              isExpanded={expandedAudienceIndex === index}
                              onToggleExpand={(expand) => {
                                setSelectedAudienceIndex(index);
                                setExpandedAudienceIndex(expand ? index : null);
                              }}
                              onClick={() => setSelectedAudienceIndex(index)}
                              colors={colors}
                              isAdmin={isAuthenticated}
                              onEdit={(e) => { e.stopPropagation(); setEditingAudience(audience); }}
                              onDelete={(e) => { e.stopPropagation(); removeAudience(audience.id); }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Creatives */}
                    {selectedAudience && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activeStep}-${selectedAudienceIndex}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm uppercase tracking-widest text-gray-400 font-bold px-1">
                              Criativos
                            </p>
                            {isAuthenticated && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowCreativeLibrary(true)}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Library className="w-3.5 h-3.5" />
                                  Da Biblioteca
                                </button>
                                <button
                                  onClick={addCreative}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Novo Criativo
                                </button>
                              </div>
                            )}
                          </div>

                          {selectedAudience.creatives.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                              Nenhum criativo cadastrado para este público.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedAudience.creatives.map((creative, i) => {
                                const c = toCreative(creative);
                                return (
                                  <motion.div
                                    key={creative.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.05 + i * 0.05 }}
                                    className="relative group/cr"
                                  >
                                    {isAuthenticated && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); removeCreative(creative.id); }}
                                        className="absolute top-2 right-2 z-10 p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm opacity-0 group-hover/cr:opacity-100"
                                        title="Remover criativo"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    <CreativeCard
                                      creative={c}
                                      onClick={() => setSelectedCreative(c)}
                                      accentClass={colors.accent}
                                      companyName={companyName}
                                      companyUrl={companyUrl}
                                      companyLogo={companyLogo}
                                    />
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      <CreativeModal
        creative={selectedCreative}
        onClose={() => setSelectedCreative(null)}
        onSave={isAuthenticated ? handleSaveCreative : undefined}
        companyName={companyName}
        companyUrl={companyUrl}
        companyLogo={companyLogo}
        readOnly={!isAuthenticated}
      />

      <AnimatePresence>
        {editingAudience && (
          <AudienceEditModal
            audience={editingAudience}
            onSave={updateAudience}
            onClose={() => setEditingAudience(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAudienceLibrary && (
          <LibraryPickerModal
            savedAudiences={savedAudiences}
            onPick={addAudienceFromLibrary}
            onClose={() => setShowAudienceLibrary(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreativeLibrary && (
          <CreativePickerModal
            savedCreatives={savedCreatives}
            onPick={addCreativeFromLibrary}
            onClose={() => setShowCreativeLibrary(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function AudiencePresentationCard({
  audience,
  index,
  isSelected,
  isExpanded,
  onToggleExpand,
  onClick,
  colors,
  isAdmin,
  onEdit,
  onDelete,
}: {
  audience: MetaAudience;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (expand: boolean) => void;
  onClick: () => void;
  colors: any;
  isAdmin?: boolean;
  onEdit?: (e: { stopPropagation: () => void }) => void;
  onDelete?: (e: { stopPropagation: () => void }) => void;
}) {
  const hasDetails = !!(audience.gender || audience.ageRange || audience.interests || audience.keywords || audience.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`group/aud-card bg-white rounded-xl border px-4 py-3.5 transition-all cursor-pointer relative overflow-hidden flex flex-col ${
        isSelected
          ? colors.ring
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {isAdmin && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/aud-card:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"><Pencil className="w-3 h-3" /></button>
          <button onClick={onDelete} className="p-1 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shadow-sm"><Trash2 className="w-3 h-3" /></button>
        </div>
      )}
      <div className="flex-1">
        <h4 className="text-[15px] mb-1 text-gray-900 font-bold leading-tight">
          {audience.title}
        </h4>
        <AnimatePresence>
          {isExpanded && audience.description && (
            <motion.p 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 6 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="text-sm leading-relaxed text-gray-500 whitespace-pre-wrap overflow-hidden"
            >
              {audience.description}
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (audience.gender || audience.ageRange || audience.interests || audience.keywords) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1 overflow-hidden"
            >
              {audience.gender && (
                <span className="text-xs px-2 py-1 bg-blue-50/50 text-blue-600 rounded-md font-medium">
                  {audience.gender}
                </span>
              )}
              {audience.ageRange && (
                <span className="text-xs px-2 py-1 bg-violet-50/50 text-violet-700 rounded-md font-medium">
                  {audience.ageRange}
                </span>
              )}
              {audience.interests && (
                <div className="w-full mt-2">
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Interesses</p>
                  <p className="text-xs text-gray-600 leading-tight">{audience.interests}</p>
                </div>
              )}
              {audience.keywords && (
                <div className="w-full mt-2">
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Keywords</p>
                  <p className="text-xs text-emerald-600 leading-tight">🔑 {audience.keywords}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasDetails && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(!isExpanded); }}
          className="mt-2 text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors self-start flex items-center gap-1"
        >
          {isExpanded ? "Ver menos" : "Ver detalhes"}
        </button>
      )}
    </motion.div>
  );
}
