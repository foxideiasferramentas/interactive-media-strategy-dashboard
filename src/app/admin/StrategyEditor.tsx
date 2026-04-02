import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Layers,
  Share2,
  Globe,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  X,
  TrendingUp,
  Users,
  Target,
  Zap,
  DollarSign,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Search as SearchIcon,
  Link as LinkIcon,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Library,
  Copy,
  ArrowUpDown,
  GitGraph,
  Monitor,
  Menu,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { useIsMobile } from "../components/ui/use-mobile";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { useStore } from "../data/store";
import { toast } from "sonner";
import { normalizeMediaUrl } from "../utils/media";
import { StrategyFlow } from "../components/StrategyFlow";
import { Field, MetaCreativeEditor, GoogleCreativeEditor, SitelinkListEditor, StructuredSnippetEditor, CallExtensionEditor } from "../components/CreativeEditors";
import type { 
  Campaign,
  MetaCreative, 
  GoogleCreative, 
  FunnelStage, 
  MetaAudience, 
  GoogleAudience,
  SavedAudience,
  Sitelink,
  SavedSitelinkSet,
  StageKey,
} from "../data/types";

// Moved from below to ensure availability for all components
const EDITOR_STAGE_LABELS = {
  top: { label: "Topo de Funil", short: "Topo", color: "bg-blue-600" },
  middle: { label: "Meio de Funil", short: "Meio", color: "bg-violet-600" },
  bottom: { label: "Fundo de Funil", short: "Fundo", color: "bg-emerald-600" },
};

const STAGES: StageKey[] = ["top", "middle", "bottom"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

// Field moved to CreativeEditors.tsx

// MetaCreativeEditor moved to CreativeEditors.tsx

// ─── Google Creative Editor ───────────────────────────────────────────────────

// GoogleCreativeEditor moved to CreativeEditors.tsx

// ─── Library Picker Modal ─────────────────────────────────────────────────────

function LibraryPickerModal({
  channel,
  savedAudiences,
  onPick,
  onClose,
}: {
  channel: Channel;
  savedAudiences: SavedAudience[];
  onPick: (audience: AnyAudience) => void;
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600`}>
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Biblioteca da Agência</h3>
              <p className="text-xs text-slate-400">Públicos Intercambiáveis · {filtered.length} salvo{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar público em toda a biblioteca..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">
                {savedAudiences.length === 0
                  ? "Nenhum público salvo ainda."
                  : "Nenhum resultado para essa busca."}
              </p>
            </div>
          ) : (
            filtered.map((saved) => (
              <button
                key={saved.id}
                onClick={() => {
                  const isCrossPlatform = saved.type !== channel;
                  const fresh = {
                    ...saved.audience,
                    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    creatives: isCrossPlatform ? [] : (saved.audience.creatives as AnyAudience["creatives"]).map((c: any) => ({
                      ...c,
                      id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    })),
                  };
                  onPick(fresh as AnyAudience);
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${saved.type === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700">
                      {saved.label}
                    </p>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded cursor-default ${saved.type === 'meta' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {saved.type === 'meta' ? 'META' : 'GADS'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{saved.audience.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {saved.audience.tag} · {saved.audience.creatives.length} criativo{saved.audience.creatives.length !== 1 ? "s" : ""} · {new Date(saved.savedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-xs text-violet-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0">
                  Usar
                </span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Creative Library Picker Modal ────────────────────────────────────────────

function CreativePickerModal({
  channel,
  savedCreatives,
  onPick,
  onClose,
}: {
  channel: Channel;
  savedCreatives: import("../data/types").SavedCreative[];
  onPick: (creative: MetaCreative | GoogleCreative) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = savedCreatives.filter(
    (s) =>
      s.platform === channel &&
      s.label.toLowerCase().includes(search.toLowerCase())
  );

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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${channel === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
              <Library className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Biblioteca de Criativos</h3>
              <p className="text-xs text-slate-400">{channel === "meta" ? "Meta Ads" : "Google Ads"} · {filtered.length} criativo{filtered.length !== 1 ? "s" : ""} salvos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar criativo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Library className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">
                {savedCreatives.filter((s) => s.platform === channel).length === 0
                  ? "Nenhum criativo salvo ainda. Use o ícone 🔖 em qualquer criativo para salvá-lo."
                  : "Nenhum resultado para essa busca."}
              </p>
            </div>
          ) : (
            filtered.map((saved) => (
              <button
                key={saved.id}
                onClick={() => {
                  onPick({ ...saved.creative, id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` });
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${channel === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700">
                    {saved.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{saved.creative.name} · {saved.creative.format}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    salvo {new Date(saved.savedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-xs text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0">
                  Usar
                </span>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Move Creative Modal ────────────────────────────────────────────────────

type StageAudiences = { stage: StageKey; audiences: AnyAudience[] };

function MoveCreativeModal({
  channel,
  allStageAudiences,
  onMove,
  onClose,
}: {
  channel: Channel;
  allStageAudiences: StageAudiences[];
  onMove: (targetStage: StageKey, targetAudienceId: string) => void;
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
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${channel === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mover Criativo</h3>
              <p className="text-xs text-slate-400">Escolha o público de destino</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[420px] overflow-y-auto space-y-4">
          {allStageAudiences.map(({ stage, audiences }) => (
            <div key={stage}>
              <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${
                stage === "top" ? "text-blue-500" : stage === "middle" ? "text-violet-500" : "text-emerald-600"
              }`}>
                {stage === "top" ? "Topo de Funil" : stage === "middle" ? "Meio de Funil" : "Fundo de Funil"}
              </p>
              {audiences.length === 0 ? (
                <p className="text-xs text-slate-400 italic pl-1">Nenhum público nesta etapa.</p>
              ) : (
                <div className="space-y-1.5">
                  {audiences.map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => { onMove(stage, aud.id); onClose(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-violet-300 hover:bg-violet-50/50 transition-all text-left group"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${channel === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                        <Users className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-violet-700">{aud.title || "Público sem nome"}</p>
                        <p className="text-[10px] text-slate-400">{aud.tag} · {aud.creatives.length} criativo{aud.creatives.length !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-xs text-violet-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">Mover</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Audience editor (meta or google) ────────────────────────────────────────

type AnyAudience = MetaAudience | GoogleAudience;
type Channel = "meta" | "google";

function AudienceEditor<T extends AnyAudience>({
  audience,
  channel,
  currentStage,
  onChange,
  onRemove,
  onSave,
  onMoveStage,
  allStageAudiences,
  onMoveCreative,
}: {
  audience: T;
  channel: Channel;
  currentStage: StageKey;
  onChange: (a: T) => void;
  onRemove: () => void;
  onSave: () => void;
  onMoveStage: (newStage: StageKey) => void;
  allStageAudiences?: StageAudiences[];
  onMoveCreative?: (creativeIndex: number, targetStage: StageKey, targetAudienceId: string) => void;
}) {
  const { saveCreative, savedCreatives } = useStore();
  const [open, setOpen] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(true);
  const [showCreativeLibrary, setShowCreativeLibrary] = useState(false);
  const [movingCreativeIndex, setMovingCreativeIndex] = useState<number | null>(null);

  const handleSaveToLibrary = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const addCreative = () => {
    if (channel === "meta") {
      const aud = audience as MetaAudience;
      const newC: MetaCreative = {
        id: uid(),
        name: "Novo Criativo",
        format: "Image",
        imageUrl: "",
        headline: "",
        description: "",
        primaryText: "",
        cta: "Saiba Mais",
        displayLink: "",
        carouselCards: [],
        primaryPlacement: "Feed",
      };
      onChange({ ...aud, creatives: [...aud.creatives, newC] } as T);
    } else {
      const aud = audience as GoogleAudience;
      const newC: GoogleCreative = {
        id: uid(),
        name: "Novo Criativo",
        format: "Search",
        headlines: ["Título 1"],
        descriptions: ["Descrição 1"],
      };
      onChange({ ...aud, creatives: [...aud.creatives, newC] } as T);
    }
  };

  const addCreativeFromLibrary = (c: MetaCreative | GoogleCreative) => {
    onChange({ ...audience, creatives: [...(audience.creatives as any[]), c] } as T);
  };

  const updateCreative = (index: number, updated: MetaCreative | GoogleCreative) => {
    const creatives = [...(audience.creatives as any[])];
    creatives[index] = updated;
    onChange({ ...audience, creatives } as T);
  };

  const removeCreative = (index: number) => {
    const creatives = (audience.creatives as any[]).filter((_, i) => i !== index);
    onChange({ ...audience, creatives } as T);
  };

  const duplicateCreative = (index: number) => {
    const original = (audience.creatives as any[])[index];
    const copy = { ...original, id: uid(), name: `Cópia – ${original.name || "Criativo"}` };
    const creatives = [...(audience.creatives as any[])];
    creatives.splice(index + 1, 0, copy);
    onChange({ ...audience, creatives } as T);
  };

  const reorderCreative = (index: number, dir: "up" | "down") => {
    const creatives = [...(audience.creatives as any[])];
    const newIdx = dir === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= creatives.length) return;
    const [item] = creatives.splice(index, 1);
    creatives.splice(newIdx, 0, item);
    onChange({ ...audience, creatives } as T);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      {/* Audience header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            channel === "meta"
              ? "bg-blue-100 text-blue-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          <Users className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {audience.title || "Público sem nome"}
          </p>
          <p className="text-xs text-slate-400">
            {audience.tag} · {audience.creatives.length} criativo
            {audience.creatives.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSaveToLibrary}
            title="Salvar na biblioteca"
            className={`p-1.5 rounded-lg transition-all ${justSaved ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}
          >
            {justSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-200">
              {/* ── Seção: informações do público ─────────────────── */}
              <div className="px-5 pt-4 pb-5 space-y-4 bg-white">

                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Título do Público"
                    value={audience.title}
                    onChange={(v) => onChange({ ...audience, title: v } as T)}
                    placeholder="Ex: Público Amplo por Interesses"
                  />
                  <Field
                    label="Tag / Classificação"
                    value={audience.tag}
                    onChange={(v) => onChange({ ...audience, tag: v } as T)}
                    placeholder="Ex: Frio · Alta escala"
                  />
                </div>
                <Field
                  label="Descrição"
                  value={audience.description}
                  onChange={(v) =>
                    onChange({ ...audience, description: v } as T)
                  }
                  placeholder="Descreva a segmentação deste público..."
                  multiline
                />

                <div className="pt-4 border-t border-slate-200 mt-2">
                  <button
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="w-full flex items-center justify-between py-1 text-[10px] uppercase font-bold text-slate-400 tracking-widest hover:text-slate-600 transition-colors group"
                  >
                    <span>Informações Estruturadas</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-medium normal-case text-slate-400 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {showFullDetails ? "Recolher" : "Expandir detalhes"}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullDetails ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {showFullDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 pt-4 overflow-hidden"
                      >
                        <Field
                          label="Sobre (Short Bio)"
                          value={audience.about || ""}
                          onChange={(v) => onChange({ ...audience, about: v } as T)}
                          placeholder="Resumo rápido da persona..."
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Gênero"
                            value={audience.gender || ""}
                            onChange={(v) => onChange({ ...audience, gender: v } as T)}
                            placeholder="Ex: Ambos / Masc / Fem"
                          />
                          <Field
                            label="Idade"
                            value={audience.ageRange || ""}
                            onChange={(v) => onChange({ ...audience, ageRange: v } as T)}
                            placeholder="Ex: 25-45 anos"
                          />
                        </div>
                        
                        <Field
                          label="Interesses"
                          value={audience.interests || ""}
                          onChange={(v) => onChange({ ...audience, interests: v } as T)}
                          placeholder="Ex: Tecnologia, Imóveis, Decoração"
                        />
                        
                        <Field
                          label="Palavras-chave"
                          value={audience.keywords || ""}
                          onChange={(v) => onChange({ ...audience, keywords: v } as T)}
                          placeholder="Ex: comprar casa, financiar apto..."
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── Faixa separadora colorida ─────────────────────── */}
              <div className={`flex items-center justify-between px-5 py-2.5 border-t border-b border-slate-200 ${
                channel === "meta" ? "bg-blue-50" : "bg-emerald-50"
              }`}>
                <span className={`text-[10px] uppercase font-bold tracking-widest ${
                  channel === "meta" ? "text-blue-500" : "text-emerald-600"
                }`}>Criativos</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreativeLibrary(true)}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      channel === "meta" ? "text-blue-400 hover:text-blue-600" : "text-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    <Library className="w-3 h-3" /> Da Biblioteca
                  </button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    audience.creatives.length > 0
                      ? channel === "meta" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                      : "bg-slate-200 text-slate-400"
                  }`}>
                    {audience.creatives.length}
                  </span>
                </div>
              </div>

              {/* ── Corpo dos criativos ───────────────────────────── */}
              <div className="bg-slate-50 px-5 pt-4 pb-5 space-y-3">
                {channel === "meta"
                  ? (audience as MetaAudience).creatives.map((c, i) => (
                      <div key={c.id} className="group/cr-row flex items-start gap-1.5">
                        <div className="flex flex-col gap-0 pt-3 opacity-0 group-hover/cr-row:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => reorderCreative(i, "up")}
                            disabled={i === 0}
                            className="p-0.5 rounded text-slate-300 hover:text-blue-500 disabled:opacity-20 transition-colors"
                            title="Mover criativo para cima"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => reorderCreative(i, "down")}
                            disabled={i === (audience as MetaAudience).creatives.length - 1}
                            className="p-0.5 rounded text-slate-300 hover:text-blue-500 disabled:opacity-20 transition-colors"
                            title="Mover criativo para baixo"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <MetaCreativeEditor
                            creative={c}
                            onChange={(updated) => updateCreative(i, updated)}
                            onRemove={() => removeCreative(i)}
                            onDuplicate={() => duplicateCreative(i)}
                            onSave={() => saveCreative(c.name || "Criativo Meta", "meta", c)}
                            onMoveCreative={allStageAudiences ? () => setMovingCreativeIndex(i) : undefined}
                          />
                        </div>
                      </div>
                    ))
                  : (audience as GoogleAudience).creatives.map((c, i) => (
                      <div key={c.id} className="group/cr-row flex items-start gap-1.5">
                        <div className="flex flex-col gap-0 pt-3 opacity-0 group-hover/cr-row:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => reorderCreative(i, "up")}
                            disabled={i === 0}
                            className="p-0.5 rounded text-slate-300 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                            title="Mover criativo para cima"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => reorderCreative(i, "down")}
                            disabled={i === (audience as GoogleAudience).creatives.length - 1}
                            className="p-0.5 rounded text-slate-300 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                            title="Mover criativo para baixo"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <GoogleCreativeEditor
                            creative={c}
                            onChange={(updated) => updateCreative(i, updated)}
                            onRemove={() => removeCreative(i)}
                            onDuplicate={() => duplicateCreative(i)}
                            onSave={() => saveCreative(c.name || "Criativo Google", "google", c)}
                            onMoveCreative={allStageAudiences ? () => setMovingCreativeIndex(i) : undefined}
                          />
                        </div>
                      </div>
                    ))}

              {/* ── Modal Mover Criativo ──────────────────────── */}
              <AnimatePresence>
                {movingCreativeIndex !== null && allStageAudiences && (
                  <MoveCreativeModal
                    channel={channel}
                    allStageAudiences={allStageAudiences.map(({ stage, audiences }) => ({
                      stage,
                      // Excluir o próprio público atual para evitar mover para si mesmo
                      audiences: audiences.filter((a) => a.id !== audience.id),
                    }))}
                    onMove={(targetStage, targetAudienceId) => {
                      onMoveCreative?.(movingCreativeIndex, targetStage, targetAudienceId);
                      setMovingCreativeIndex(null);
                    }}
                    onClose={() => setMovingCreativeIndex(null)}
                  />
                )}
              </AnimatePresence>
                <button
                  onClick={addCreative}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 bg-white"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Criativo
                </button>
              </div>

              {/* ── Modal Biblioteca de Criativos ─────────────────── */}
              <AnimatePresence>
                {showCreativeLibrary && (
                  <CreativePickerModal
                    channel={channel}
                    savedCreatives={savedCreatives}
                    onPick={addCreativeFromLibrary}
                    onClose={() => setShowCreativeLibrary(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = "funnel" | "meta" | "google" | "visual";

export function StrategyEditor() {
  const { id, tab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const VALID_TABS: Tab[] = ["funnel", "meta", "google", "visual"];
  const activeTab: Tab = VALID_TABS.includes(tab as Tab) ? (tab as Tab) : "funnel";
  const { getCampaign, getClient, updateCampaign, setActiveCampaignId, saveAudience, savedAudiences } = useStore();

  const originalCampaign = id ? getCampaign(id) : undefined;

  // Local copy of campaign for editing
  const [campaign, setCampaign] = useState<Campaign | null>(
    originalCampaign ?? null
  );
  const [activeStage, setActiveStage] = useState<StageKey>("top");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const savedSnapshot = useRef(JSON.stringify(originalCampaign));
  const [libraryModal, setLibraryModal] = useState<{ channel: Channel; stage?: StageKey } | null>(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Per-channel budget local state ─────────────────────────────────────────
  const [metaEnabled, setMetaEnabled] = useState(
    () => originalCampaign?.budgetAllocation.metaEnabled ?? (originalCampaign?.budgetAllocation.metaPercent ?? 65) > 0
  );
  const [googleEnabled, setGoogleEnabled] = useState(
    () => originalCampaign?.budgetAllocation.googleEnabled ?? (originalCampaign?.budgetAllocation.googlePercent ?? 35) > 0
  );
  const [metaBudgetInput, setMetaBudgetInput] = useState(() => {
    const alloc = originalCampaign?.budgetAllocation;
    if (alloc?.metaBudget != null) return alloc.metaBudget;
    return Math.round(((originalCampaign?.budget ?? 0) * (alloc?.metaPercent ?? 65)) / 100);
  });
  const [googleBudgetInput, setGoogleBudgetInput] = useState(() => {
    const alloc = originalCampaign?.budgetAllocation;
    if (alloc?.googleBudget != null) return alloc.googleBudget;
    return Math.round(((originalCampaign?.budget ?? 0) * (alloc?.googlePercent ?? 35)) / 100);
  });

  const applyChannelBudgets = (
    mEnabled: boolean,
    mBudget: number,
    gEnabled: boolean,
    gBudget: number
  ) => {
    if (!campaign) return;
    const metaAmt = mEnabled ? mBudget : 0;
    const googleAmt = gEnabled ? gBudget : 0;
    const total = metaAmt + googleAmt;
    const metaPct = total > 0 ? Math.round((metaAmt / total) * 100) : 0;
    setCampaign({
      ...campaign,
      budget: total,
      budgetAllocation: {
        metaPercent: metaPct,
        googlePercent: 100 - metaPct,
        metaBudget: mBudget,
        googleBudget: gBudget,
        metaEnabled: mEnabled,
        googleEnabled: gEnabled,
      },
    });
  };

  // Sync if store changes externally
  useEffect(() => {
    if (originalCampaign && !campaign) {
      setCampaign(originalCampaign);
    }
  }, [originalCampaign, campaign]);

  // ─── Explorer State ────────────────────────────────────────────────────────
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({
    meta: true,
    google: true,
  });

  const toggleChannel = (channel: string) => {
    setExpandedChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [expandedAudiences, setExpandedAudiences] = useState<Record<string, boolean>>({});

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleAudienceExp = (audId: string) => {
    setExpandedAudiences((prev) => ({ ...prev, [audId]: !prev[audId] }));
  };

  const handleSelectNav = (tab: Tab, audId: string | null = null, crId: string | null = null) => {
    navigate(`/admin/campaigns/${id}/${tab}`);
    setSelectedAudienceId(audId);
    setSelectedCreativeId(crId);
    if (audId) {
      // Auto-expand stage if needed
      const metaStage = STAGES.find(s => campaign?.meta[s].some(a => a.id === audId));
      const googleStage = STAGES.find(s => campaign?.google[s].some(a => a.id === audId));
      if (metaStage) setExpandedStages(prev => ({ ...prev, [`meta-${metaStage}`]: true }));
      if (googleStage) setExpandedStages(prev => ({ ...prev, [`google-${googleStage}`]: true }));
      setExpandedAudiences(prev => ({ ...prev, [audId]: true }));
    }
  };

  // Track unsaved changes
  useEffect(() => {
    if (campaign) {
      setIsDirty(JSON.stringify(campaign) !== savedSnapshot.current);
    }
  }, [campaign]);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-slate-500 font-medium mb-4">
          Campanha não encontrada.
        </p>
        <button
          onClick={() => navigate("/admin/campaigns")}
          className="text-blue-600 font-bold hover:underline"
        >
          Voltar para Campanhas
        </button>
      </div>
    );
  }

  const client = getClient(campaign.clientId);

  // ─── Update helpers ────────────────────────────────────────────────────────

  const setFunnelStage = (key: StageKey, stage: FunnelStage) => {
    setCampaign({
      ...campaign,
      funnel: { ...campaign.funnel, [key]: stage },
    });
  };

  const setMetaAudiences = (stage: StageKey, audiences: MetaAudience[]) => {
    setCampaign({
      ...campaign,
      meta: { ...campaign.meta, [stage]: audiences },
    });
  };

  const setGoogleAudiences = (stage: StageKey, audiences: GoogleAudience[]) => {
    setCampaign({
      ...campaign,
      google: { ...campaign.google, [stage]: audiences },
    });
  };

  const reorderAudience = (audienceId: string, channel: "meta" | "google", stage: StageKey, dir: "up" | "down") => {
    if (channel === "meta") {
      const list = [...campaign.meta[stage]];
      const idx = list.findIndex((a) => a.id === audienceId);
      if (idx === -1) return;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= list.length) return;
      const [item] = list.splice(idx, 1);
      list.splice(newIdx, 0, item);
      setMetaAudiences(stage, list);
    } else {
      const list = [...campaign.google[stage]];
      const idx = list.findIndex((a) => a.id === audienceId);
      if (idx === -1) return;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= list.length) return;
      const [item] = list.splice(idx, 1);
      list.splice(newIdx, 0, item);
      setGoogleAudiences(stage, list);
    }
  };

  const addMetaAudience = () => {
    const newAud: MetaAudience = {
      id: uid(),
      title: "Novo Público",
      description: "",
      tag: "Segmentação",
      creatives: [],
    };
    setMetaAudiences(activeStage, [
      ...campaign.meta[activeStage],
      newAud,
    ]);
  };

  const addGoogleAudience = () => {
    const newAud: GoogleAudience = {
      id: uid(),
      title: "Novo Público Google",
      description: "",
      tag: "Segmentação",
      creatives: [],
    };
    setGoogleAudiences(activeStage, [
      ...campaign.google[activeStage],
      newAud,
    ]);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCampaign(campaign);
      savedSnapshot.current = JSON.stringify(campaign);
      setIsDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    const identifier = campaign.slug || campaign.id;
    const shareUrl = `${window.location.origin}/share/${identifier}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link público para o cliente copiado!");
  };

  // ─── Progress counters ──────────────────────────────────────────────────────

  const metaTotalAudiences = STAGES.reduce((s, k) => s + campaign.meta[k].length, 0);
  const googleTotalAudiences = STAGES.reduce((s, k) => s + campaign.google[k].length, 0);
  const metaTotalCreatives = STAGES.reduce(
    (s, k) => s + campaign.meta[k].reduce((cs, a) => cs + a.creatives.length, 0), 0
  );
  const googleTotalCreatives = STAGES.reduce(
    (s, k) => s + campaign.google[k].reduce((cs, a) => cs + a.creatives.length, 0), 0
  );
  const hasAudiences = metaTotalAudiences + googleTotalAudiences > 0;
  const hasCreatives = metaTotalCreatives + googleTotalCreatives > 0;

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "funnel", label: "Dashboard & Funil", icon: Layers },
    { id: "visual", label: "Fluxo Estratégico", icon: GitGraph },
    { id: "meta", label: "Meta Ads", icon: Share2 },
    { id: "google", label: "Google Ads", icon: Globe },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden -m-4 md:-m-8">
      {/* ── Secondary Sidebar (Explorer) — Desktop ──────────────────────────── */}
      {!isMobile && (
      <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 mb-4">
            <button
              onClick={() => navigate("/admin/campaigns")}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              title="Voltar para Campanhas"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <h2 className="font-bold text-slate-900 text-sm truncate flex-1">Editor</h2>
            <button
              onClick={handleShare}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
              title="Compartilhar com Cliente (Link Público)"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {[
              { id: "funnel", label: "Visão Geral", icon: Layers },
              { id: "visual", label: "Fluxo Estratégico", icon: GitGraph },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !selectedAudienceId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Meta Ads Channel */}
          <div>
            <button
              onClick={() => toggleChannel("meta")}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 group"
            >
              {expandedChannels.meta ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Meta Ads
              <span className="ml-auto bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[9px] group-hover:bg-slate-300">
                {metaTotalAudiences}
              </span>
            </button>

            {expandedChannels.meta && (
              <div className="mt-1 space-y-0.5 ml-2 border-l-2 border-slate-200 pl-2">
                <button
                  onClick={() => handleSelectNav("meta")}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === "meta" && !selectedAudienceId ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Visão do Canal
                </button>
                {STAGES.map((stage) => {
                  const stageId = `meta-${stage}`;
                  const isStageExpanded = expandedStages[stageId];
                  return (
                    <div key={stage} className="space-y-0.5 pt-1">
                      <button
                        onClick={() => toggleStage(stageId)}
                        className="w-full px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-slate-600 transition-colors"
                      >
                        {isStageExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                        <div className={`w-1 h-3 rounded-full ${EDITOR_STAGE_LABELS[stage].color} opacity-50`} />
                        {EDITOR_STAGE_LABELS[stage].short}
                        <span className="ml-auto opacity-50">{campaign.meta[stage].length}</span>
                      </button>
                      
                      {isStageExpanded && (
                        <div className="space-y-0.5 ml-2 border-l border-slate-100 pl-1">
                          {campaign.meta[stage].map((aud) => {
                            const isAudExpanded = expandedAudiences[aud.id];
                            return (
                              <div key={aud.id} className="space-y-0.5">
                                <div className="flex items-center gap-0.5 group">
                                  <button
                                    onClick={() => toggleAudienceExp(aud.id)}
                                    className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                                  >
                                    {isAudExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSelectNav("meta", aud.id)}
                                    className={`flex-1 flex items-center gap-2 px-1.5 py-1 rounded-lg text-xs font-medium truncate transition-all ${
                                      selectedAudienceId === aud.id
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                                    }`}
                                  >
                                    <span className="truncate">{aud.title || "Sem título"}</span>
                                  </button>
                                </div>
                                
                                {isAudExpanded && (
                                  <div className="ml-4 space-y-0.5 border-l border-slate-50 pl-2">
                                    {aud.creatives.length > 0 ? (
                                      aud.creatives.map((cr) => (
                                        <button
                                          key={cr.id}
                                          onClick={() => handleSelectNav("meta", aud.id, cr.id)}
                                          className={`w-full flex items-center gap-2 px-2 py-1 text-[10px] font-medium transition-all rounded-lg ${
                                            selectedCreativeId === cr.id
                                              ? "text-blue-600 bg-blue-50/80"
                                              : "text-slate-400 italic hover:text-blue-600 hover:bg-blue-50/50"
                                          }`}
                                        >
                                          {cr.format === "Video" ? <Video className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                                          <span className="truncate">{cr.name || "Criativo sem nome"}</span>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-2 py-0.5 text-[9px] text-slate-300 italic">Nenhum criativo</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addMetaAudience}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Público
                </button>
              </div>
            )}
          </div>

          {/* Google Ads Channel */}
          <div>
            <button
              onClick={() => toggleChannel("google")}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 group"
            >
              {expandedChannels.google ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Google Ads
              <span className="ml-auto bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[9px] group-hover:bg-slate-300">
                {googleTotalAudiences}
              </span>
            </button>

            {expandedChannels.google && (
              <div className="mt-1 space-y-0.5 ml-2 border-l-2 border-slate-200 pl-2">
                <button
                  onClick={() => handleSelectNav("google")}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    activeTab === "google" && !selectedAudienceId ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Visão do Canal
                </button>
                {STAGES.map((stage) => {
                  const stageId = `google-${stage}`;
                  const isStageExpanded = expandedStages[stageId];
                  return (
                    <div key={stage} className="space-y-0.5 pt-1">
                      <button
                        onClick={() => toggleStage(stageId)}
                        className="w-full px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-slate-600 transition-colors"
                      >
                        {isStageExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                        <div className={`w-1 h-3 rounded-full ${EDITOR_STAGE_LABELS[stage].color} opacity-50`} />
                        {EDITOR_STAGE_LABELS[stage].short}
                        <span className="ml-auto opacity-50">{campaign.google[stage].length}</span>
                      </button>
                      
                      {isStageExpanded && (
                        <div className="space-y-0.5 ml-2 border-l border-slate-100 pl-1">
                          {campaign.google[stage].map((aud) => {
                            const isAudExpanded = expandedAudiences[aud.id];
                            return (
                              <div key={aud.id} className="space-y-0.5">
                                <div className="flex items-center gap-0.5 group">
                                  <button
                                    onClick={() => toggleAudienceExp(aud.id)}
                                    className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                                  >
                                    {isAudExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => handleSelectNav("google", aud.id)}
                                    className={`flex-1 flex items-center gap-2 px-1.5 py-1 rounded-lg text-xs font-medium truncate transition-all ${
                                      selectedAudienceId === aud.id
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                                    }`}
                                  >
                                    <span className="truncate">{aud.title || "Sem título"}</span>
                                  </button>
                                </div>
                                
                                {isAudExpanded && (
                                  <div className="ml-4 space-y-0.5 border-l border-slate-50 pl-2">
                                    {aud.creatives.length > 0 ? (
                                      aud.creatives.map((cr) => (
                                        <button
                                          key={cr.id}
                                          onClick={() => handleSelectNav("google", aud.id, cr.id)}
                                          className={`w-full flex items-center gap-2 px-2 py-1 text-[10px] font-medium transition-all rounded-lg ${
                                            selectedCreativeId === cr.id
                                              ? "text-emerald-600 bg-emerald-50/80"
                                              : "text-slate-400 italic hover:text-emerald-600 hover:bg-emerald-50/50"
                                          }`}
                                        >
                                          {cr.format === "Search" || cr.format === "Display" ? <SearchIcon className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                                          <span className="truncate">{cr.name || "Criativo sem nome"}</span>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-2 py-0.5 text-[9px] text-slate-300 italic">Nenhum criativo</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addGoogleAudience}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Público
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Action Bar in Sidebar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              saved
                ? "bg-emerald-600 text-white"
                : isDirty
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSaving ? "Salvando..." : saved ? "Salvo!" : "Salvar Estratégia"}
          </button>

          <button
            onClick={() => {
              updateCampaign(campaign);
              setActiveCampaignId(campaign.id);
              const identifier = campaign.slug || campaign.id;
              navigate(`/${identifier}`);
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Apresentação
          </button>
        </div>
      </aside>
      )}

      {/* ── Secondary Sidebar — Mobile Drawer ───────────────────────────────── */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-slate-50 border-r border-slate-200">
            <aside className="h-full flex flex-col bg-slate-50">
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-2.5 mb-4">
                  <button
                    onClick={() => { navigate("/admin/campaigns"); setSidebarOpen(false); }}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                    title="Voltar para Campanhas"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <h2 className="font-bold text-slate-900 text-sm truncate flex-1">Editor</h2>
                  <button
                    onClick={handleShare}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Compartilhar com Cliente (Link Público)"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { id: "funnel", label: "Visão Geral", icon: Layers },
                    { id: "visual", label: "Fluxo Estratégico", icon: GitGraph },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id && !selectedAudienceId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { handleSelectNav(item.id as Tab); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-xs text-slate-400 text-center pt-8">
                <p>Navegue pelos canais acima.</p>
                <p className="mt-1">O editor completo está disponível na versão desktop.</p>
              </div>
              <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${saved ? "bg-emerald-600 text-white" : isDirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                >
                  {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {isSaving ? "Salvando..." : saved ? "Salvo!" : "Salvar Estratégia"}
                </button>
              </div>
            </aside>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-white">
        {/* Secondary Header (Local context) */}
        <header className="h-16 border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {activeTab === "funnel"
                ? "Dashboard & Funil"
                : activeTab === "visual"
                ? "Fluxo Estratégico"
                : activeTab === "meta"
                ? "Meta Ads"
                : "Google Ads"}
            </h1>
            {selectedAudienceId && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-medium text-slate-500">
                  {[
                    ...campaign.meta.top,
                    ...campaign.meta.middle,
                    ...campaign.meta.bottom,
                    ...campaign.google.top,
                    ...campaign.google.middle,
                    ...campaign.google.bottom,
                  ].find((a) => a.id === selectedAudienceId)?.title || "Público"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                campaign.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {campaign.status === "active" ? "Ativo" : "Planejamento"}
            </span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {/* ── FUNNEL TAB ──────────────────────────────────────────────────── */}
          {activeTab === "funnel" && (
            <motion.div
              key="funnel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {/* Campaign Identification */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Identificação da Estratégia</h3>
                    <p className="text-sm text-slate-500">Defina o nome e o endereço URL da apresentação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Nome da Campanha
                    </label>
                    <input
                      type="text"
                      value={campaign.name}
                      onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Slug (URL Amigável)
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl">
                      <span className="text-xs text-slate-400 font-mono">share/</span>
                      <input
                        type="text"
                        value={campaign.slug || ""}
                        placeholder="slug-da-campanha"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                          setCampaign({ ...campaign, slug: val });
                        }}
                        className="flex-1 bg-transparent border-none p-0 text-sm font-mono text-blue-600 focus:ring-0"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Link público (ex: share/{campaign.slug || "slug"})
                    </p>
                  </div>
                </div>
              </div>

              {/* Presentation & Header */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Apresentação & Cabeçalho</h3>
                    <p className="text-sm text-slate-500">Personalize o título e as informações de topo da proposta</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Título Principal</label>
                    <input
                      type="text"
                      placeholder="Estratégia Integrada de Mídia Paga"
                      value={campaign.presentation?.title || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        presentation: { ...(campaign.presentation || {}), title: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Descrição / Abordagem</label>
                    <textarea
                      rows={3}
                      placeholder="Uma abordagem full-funnel..."
                      value={campaign.presentation?.description || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        presentation: { ...(campaign.presentation || {}), description: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Selo da Versão (Badge)</label>
                    <input
                      type="text"
                      placeholder="Proposta Estratégica · 2025"
                      value={campaign.presentation?.badge || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        presentation: { ...(campaign.presentation || {}), badge: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Rótulo de Canais</label>
                    <input
                      type="text"
                      placeholder="Google Ads + Meta Ads"
                      value={campaign.presentation?.channelsLabel || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        presentation: { ...(campaign.presentation || {}), channelsLabel: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Período da Proposta</label>
                    <input
                      type="text"
                      placeholder="Q1–Q2 · 2025"
                      value={campaign.presentation?.periodLabel || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        presentation: { ...(campaign.presentation || {}), periodLabel: e.target.value }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
              {/* KPIs & Budget */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  KPIs e Orçamento Global
                </h3>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    {
                      key: "startDate" as keyof Campaign,
                      label: "Data de Início",
                      icon: Calendar,
                      color: "bg-blue-100 text-blue-600",
                    },
                    {
                      key: "endDate" as keyof Campaign,
                      label: "Previsão de Término",
                      icon: Calendar,
                      color: "bg-violet-100 text-violet-600",
                    },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div
                      key={key}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                          {label}
                        </label>
                        <input
                          type="date"
                          value={campaign[key] as string}
                          onChange={(e) =>
                            setCampaign({ ...campaign, [key]: e.target.value })
                          }
                          className="bg-transparent text-sm font-bold text-slate-900 outline-none w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* KPI metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    {
                      key: "roas",
                      label: "ROAS Alvo",
                      icon: TrendingUp,
                      color: "text-blue-600",
                    },
                    {
                      key: "leads",
                      label: "Meta Leads",
                      icon: Users,
                      color: "text-violet-600",
                    },
                    {
                      key: "reach",
                      label: "Alcance Mensal",
                      icon: Globe,
                      color: "text-emerald-600",
                    },
                    {
                      key: "cac",
                      label: "Redução CAC",
                      icon: Zap,
                      color: "text-amber-600",
                    },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div
                      key={key}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-2xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {label}
                        </label>
                      </div>
                      <input
                        type="text"
                        value={(campaign.objectives as any)[key]}
                        placeholder="Ex: 4×"
                        onChange={(e) =>
                          setCampaign({
                            ...campaign,
                            objectives: {
                              ...campaign.objectives,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Budget */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                          Configuração de Verba
                        </p>
                        <p className="text-xs text-slate-400">Soma automática dos canais ativos</p>
                      </div>
                    </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      R$ {campaign.budget.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">por mês</p>
                  </div>
                  </div>

                  {/* Per-channel rows */}
                  <div className="space-y-2">
                    {([
                      {
                        key: "meta" as const,
                        label: "Meta Ads",
                        sublabel: "Facebook & Instagram",
                        color: "text-blue-600",
                        badgeBg: "bg-blue-50",
                        checkBg: "bg-blue-600 border-blue-600",
                        enabled: metaEnabled,
                        budget: metaBudgetInput,
                        pct: campaign.budgetAllocation.metaPercent,
                        onToggle: () => {
                          const next = !metaEnabled;
                          setMetaEnabled(next);
                          applyChannelBudgets(next, metaBudgetInput, googleEnabled, googleBudgetInput);
                        },
                        onBudget: (v: number) => {
                          setMetaBudgetInput(v);
                          applyChannelBudgets(metaEnabled, v, googleEnabled, googleBudgetInput);
                        },
                      },
                      {
                        key: "google" as const,
                        label: "Google Ads",
                        sublabel: "Search · Display · YouTube",
                        color: "text-emerald-600",
                        badgeBg: "bg-emerald-50",
                        checkBg: "bg-emerald-600 border-emerald-600",
                        enabled: googleEnabled,
                        budget: googleBudgetInput,
                        pct: campaign.budgetAllocation.googlePercent,
                        onToggle: () => {
                          const next = !googleEnabled;
                          setGoogleEnabled(next);
                          applyChannelBudgets(metaEnabled, metaBudgetInput, next, googleBudgetInput);
                        },
                        onBudget: (v: number) => {
                          setGoogleBudgetInput(v);
                          applyChannelBudgets(metaEnabled, metaBudgetInput, googleEnabled, v);
                        },
                      },
                    ]).map((ch) => (
                      <div
                        key={ch.key}
                        className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
                          ch.enabled
                            ? "bg-white border-slate-200"
                            : "bg-slate-50 border-slate-200 opacity-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={ch.onToggle}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            ch.enabled ? ch.checkBg : "border-slate-300 bg-white"
                          }`}
                        >
                          {ch.enabled && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        {/* Label */}
                        <div className="w-28 flex-shrink-0">
                          <p className={`text-[11px] font-bold uppercase tracking-wider leading-none ${ch.color}`}>{ch.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{ch.sublabel}</p>
                        </div>

                        {/* Budget input */}
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-slate-400 text-xs font-bold">R$</span>
                          <input
                            type="number"
                            min={0}
                            disabled={!ch.enabled}
                            value={ch.budget}
                            onChange={(e) => ch.onBudget(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none w-full transition-colors disabled:opacity-30"
                          />
                        </div>

                        {/* Percentage badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          ch.enabled ? `${ch.badgeBg} ${ch.color}` : "text-slate-300"
                        }`}>
                          {ch.enabled ? `${ch.pct}%` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Percentage bar */}
                  {(metaEnabled || googleEnabled) && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-0.5">
                        {metaEnabled && campaign.budgetAllocation.metaPercent > 0 && (
                          <div
                            className="bg-blue-500 transition-all duration-500 rounded-l-full"
                            style={{ width: `${campaign.budgetAllocation.metaPercent}%` }}
                          />
                        )}
                        {googleEnabled && campaign.budgetAllocation.googlePercent > 0 && (
                          <div
                            className="bg-emerald-500 transition-all duration-500 rounded-r-full"
                            style={{ width: `${campaign.budgetAllocation.googlePercent}%` }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs font-semibold text-blue-600">
                          {metaEnabled ? `Meta · ${campaign.budgetAllocation.metaPercent}%` : "Meta desativado"}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600">
                          {googleEnabled ? `Google · ${campaign.budgetAllocation.googlePercent}%` : "Google desativado"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Geolocation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Geolocalização
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Raio de Cobertura"
                    value={campaign.geo?.coverage ?? ""}
                    onChange={(v) =>
                      setCampaign({ ...campaign, geo: { ...campaign.geo, coverage: v } })
                    }
                    placeholder="Ex: 300km — Bauru, Campinas, SP capital..."
                  />
                  <Field
                    label="Futura Expansão (opcional)"
                    value={campaign.geo?.expansion ?? ""}
                    onChange={(v) =>
                      setCampaign({ ...campaign, geo: { ...campaign.geo, coverage: campaign.geo?.coverage ?? "", expansion: v || undefined } })
                    }
                    placeholder="Ex: Nacional após validação dos criativos"
                  />
                </div>
              </div>

              {/* Funnel stages */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Detalhamento das Etapas do Funil
                </h3>
                <div className="space-y-6">
                  {(["top", "middle", "bottom"] as StageKey[]).map(
                    (stageKey) => {
                      const stage = campaign.funnel[stageKey];
                      const sLabel = EDITOR_STAGE_LABELS[stageKey as keyof typeof EDITOR_STAGE_LABELS] || {
                        label: stageKey,
                        short: stageKey,
                        color: "bg-slate-500",
                      };
                      if (!sLabel) return null;
                      return (
                        <div
                          key={stageKey}
                          className="border border-slate-200 rounded-3xl p-8 bg-slate-50/30 hover:border-blue-200 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="flex flex-row md:flex-col items-center gap-2 md:gap-1.5 flex-shrink-0">
                              <div
                                className={`w-12 h-12 rounded-2xl ${sLabel.color} text-white flex items-center justify-center font-bold text-lg shadow-sm`}
                              >
                                {stageKey === "top" ? "01" : stageKey === "middle" ? "02" : "03"}
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center leading-tight">
                                {sLabel.short}
                              </span>
                            </div>
                            <div className="flex-1 w-full space-y-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                  label="Callout / Subtitle"
                                  value={stage.subtitle}
                                  onChange={(v) =>
                                    setFunnelStage(stageKey, {
                                      ...stage,
                                      subtitle: v,
                                    })
                                  }
                                  placeholder="Ex: Conscientização"
                                />
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    Meta de Entrega
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={stage.metricValue}
                                      placeholder="500K"
                                      onChange={(e) =>
                                        setFunnelStage(stageKey, {
                                          ...stage,
                                          metricValue: e.target.value,
                                        })
                                      }
                                      className="w-1/3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/10 outline-none"
                                    />
                                    <select
                                      value={stage.metricUnit}
                                      onChange={(e) =>
                                        setFunnelStage(stageKey, {
                                          ...stage,
                                          metricUnit: e.target.value,
                                        })
                                      }
                                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer appearance-none"
                                    >
                                      {[
                                        "impressões/mês",
                                        "visitantes/mês",
                                        "visualizações/mês",
                                        "cliques/mês",
                                        "leads/mês",
                                        "conversões/mês",
                                        "alcance/mês",
                                      ].map((u) => (
                                        <option key={u} value={u}>
                                          {u}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <Field
                                label="Descrição Estratégica"
                                value={stage.description}
                                onChange={(v) =>
                                  setFunnelStage(stageKey, {
                                    ...stage,
                                    description: v,
                                  })
                                }
                                placeholder="Descreva a abordagem para esta etapa do funil..."
                                multiline
                              />
                              <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                  onClick={() => setLibraryModal({ channel: "meta", stage: stageKey })}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center gap-1.5"
                                >
                                  <Library className="w-3 h-3 text-blue-400" />
                                  Biblioteca Meta
                                </button>
                                <button
                                  onClick={() => setLibraryModal({ channel: "google", stage: stageKey })}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center gap-1.5"
                                >
                                  <Library className="w-3 h-3 text-emerald-400" />
                                  Biblioteca Google
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── VISUAL FLOW TAB ─────────────────────────────────────────────── */}
          {activeTab === "visual" && (
            <motion.div
              key="visual"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <GitGraph className="w-6 h-6 text-blue-600" />
                    Mapa Estratégico Visual
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Visualize e gerencie a estrutura completa da sua campanha em tempo real. Clique nos públicos para ver seus criativos.
                  </p>
                </div>
              </div>

              <StrategyFlow 
                campaign={campaign} 
                onUpdate={(updated) => setCampaign(updated)} 
              />
            </motion.div>
          )}

          {/* ── META ADS TAB ────────────────────────────────────────────────── */}
          {activeTab === "meta" && (
            <motion.div
              key="meta"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              {selectedAudienceId && selectedCreativeId ? (
                // Focused Creative Editor
                (() => {
                  const stage = STAGES.find(s => campaign.meta[s].some(a => a.id === selectedAudienceId));
                  const audIndex = stage ? campaign.meta[stage].findIndex(a => a.id === selectedAudienceId) : -1;
                  const aud = stage && audIndex !== -1 ? campaign.meta[stage][audIndex] : null;
                  const crIndex = aud ? aud.creatives.findIndex(c => c.id === selectedCreativeId) : -1;
                  const cr = aud && crIndex !== -1 ? aud.creatives[crIndex] : null;

                  if (!stage || !aud || !cr) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="font-medium">Criativo não encontrado.</p>
                        <button onClick={() => setSelectedCreativeId(null)} className="text-blue-600 mt-4 font-bold hover:underline">
                          Voltar para Público
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedCreativeId(null)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-all"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Público: {aud.title}
                        </button>
                      </div>
                      
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            {cr.format === "Video" ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{cr.name || "Criativo sem nome"}</h4>
                            <p className="text-[11px] text-slate-500">{cr.format} • Meta Ads</p>
                          </div>
                        </div>

                        <MetaCreativeEditor
                          creative={cr}
                          collapsible={false}
                          onChange={(updated) => {
                            const newCreatives = [...aud.creatives];
                            newCreatives[crIndex] = updated;
                            const newAudiences = [...campaign.meta[stage]];
                            newAudiences[audIndex] = { ...aud, creatives: newCreatives };
                            setMetaAudiences(stage, newAudiences);
                          }}
                          onRemove={() => {
                            const newCreatives = aud.creatives.filter((_, i) => i !== crIndex);
                            const newAudiences = [...campaign.meta[stage]];
                            newAudiences[audIndex] = { ...aud, creatives: newCreatives };
                            setMetaAudiences(stage, newAudiences);
                            setSelectedCreativeId(null);
                          }}
                          onSave={() => saveAudience(cr.name || "Criativo", "meta", aud)} // Reusing save logic
                        />
                      </div>
                    </div>
                  );
                })()
              ) : !selectedAudienceId ? (
                // Channel Overview
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">Meta Ads</h3>
                      <p className="text-xs text-slate-500">Facebook e Instagram · Gestão de Públicos e Criativos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Verba Alocada</p>
                      <p className="text-xl font-bold text-blue-600">R$ {campaign.budgetAllocation.metaBudget?.toLocaleString("pt-BR") || "0"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STAGES.map((s) => (
                      <div key={s} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${EDITOR_STAGE_LABELS[s].color} text-white`}>
                            {EDITOR_STAGE_LABELS[s].short}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{campaign.meta[s].length} Públicos</span>
                        </div>
                        <div className="space-y-1.5">
                          {campaign.meta[s].map((aud, audIdx) => (
                            <div key={aud.id} className="group/aud-row flex items-center gap-1">
                              <div className="flex flex-col gap-0 opacity-0 group-hover/aud-row:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => reorderAudience(aud.id, "meta", s, "up")}
                                  disabled={audIdx === 0}
                                  className="p-0.5 rounded text-slate-300 hover:text-blue-500 disabled:opacity-20 transition-colors"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => reorderAudience(aud.id, "meta", s, "down")}
                                  disabled={audIdx === campaign.meta[s].length - 1}
                                  className="p-0.5 rounded text-slate-300 hover:text-blue-500 disabled:opacity-20 transition-colors"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => setSelectedAudienceId(aud.id)}
                                className="flex-1 flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-400 hover:shadow-sm transition-all text-left group/btn"
                              >
                                <span className="truncate">{aud.title}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover/btn:text-blue-500 transition-colors" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newAud: MetaAudience = {
                                id: uid(),
                                title: "Novo Público",
                                description: "",
                                tag: "Segmentação",
                                creatives: [],
                              };
                              setMetaAudiences(s, [...campaign.meta[s], newAud]);
                              setSelectedAudienceId(newAud.id);
                            }}
                            className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-blue-200 hover:text-blue-500 hover:bg-white transition-all mb-2"
                          >
                            + Adicionar Público
                          </button>
                          <button
                            onClick={() => setLibraryModal({ channel: "meta", stage: s })}
                            className="w-full p-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-amber-200 hover:text-amber-500 hover:bg-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Library className="w-3 h-3" />
                            Biblioteca
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => setLibraryModal({ channel: "meta" })}
                      className="px-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-white transition-all flex items-center gap-2"
                    >
                      <Library className="w-5 h-5" />
                      Importar da Biblioteca de Públicos
                    </button>
                  </div>
                </div>
              ) : (
                // Selected Audience Editor
                (() => {
                  const stage = STAGES.find((s) => campaign.meta[s].some((a) => a.id === selectedAudienceId));
                  const audIndex = stage ? campaign.meta[stage].findIndex((a) => a.id === selectedAudienceId) : -1;
                  const aud = stage && audIndex !== -1 ? campaign.meta[stage][audIndex] : null;

                  if (!stage || !aud) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                          <X className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="font-medium">Público não encontrado nesta visualização.</p>
                        <button 
                          onClick={() => setSelectedAudienceId(null)} 
                          className="text-blue-600 mt-4 font-bold hover:underline"
                        >
                          Voltar para Meta Ads
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedAudienceId(null)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Meta Ads
                        </button>
                        
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${EDITOR_STAGE_LABELS[stage].color} text-white shadow-sm shadow-slate-200`}>
                              {EDITOR_STAGE_LABELS[stage].label}
                           </span>
                        </div>
                      </div>
                      
                      <AudienceEditor
                        key={aud.id}
                        audience={aud}
                        channel="meta"
                        currentStage={stage}
                        onChange={(updated) => {
                          const list = [...campaign.meta[stage]];
                          list[audIndex] = updated as MetaAudience;
                          setMetaAudiences(stage, list);
                        }}
                        onRemove={() => {
                          const list = campaign.meta[stage].filter((_, idx) => idx !== audIndex);
                          setMetaAudiences(stage, list);
                          setSelectedAudienceId(null);
                        }}
                        onSave={() => saveAudience(aud.title || "Público sem nome", "meta", aud)}
                        onMoveStage={(newStage) => {
                          const from = campaign.meta[stage].filter((_, idx) => idx !== audIndex);
                          const to = [...campaign.meta[newStage], aud];
                          setCampaign({ 
                            ...campaign, 
                            meta: { ...campaign.meta, [stage]: from, [newStage]: to } 
                          } as Campaign);
                        }}
                        allStageAudiences={STAGES.map((s) => ({ stage: s, audiences: campaign.meta[s] }))}
                        onMoveCreative={(creativeIndex, targetStage, targetAudienceId) => {
                          const creative = aud.creatives[creativeIndex];
                          const updatedCurrentAud = {
                            ...aud,
                            creatives: aud.creatives.filter((_, ci) => ci !== creativeIndex),
                          };
                          const currentList = campaign.meta[stage].map((a) => (a.id === aud.id ? updatedCurrentAud : a));
                          const targetList = campaign.meta[targetStage].map((a) =>
                            a.id === targetAudienceId
                              ? {
                                  ...a,
                                  creatives: [
                                    ...a.creatives,
                                    { ...creative, id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` },
                                  ],
                                }
                              : a
                          );
                          setCampaign({
                            ...campaign,
                            meta: {
                              ...campaign.meta,
                              [stage]: currentList as MetaAudience[],
                              [targetStage]: targetList as MetaAudience[],
                            },
                          } as Campaign);
                        }}
                      />
                    </div>
                  );
                })()
              )}
            </motion.div>
          )}

          {/* ── GOOGLE ADS TAB ──────────────────────────────────────────────── */}
          {activeTab === "google" && (
            <motion.div
              key="google"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              {selectedAudienceId && selectedCreativeId ? (
                // Focused Creative Editor Google
                (() => {
                  const stage = STAGES.find(s => campaign.google[s].some(a => a.id === selectedAudienceId));
                  const audIndex = stage ? campaign.google[stage].findIndex(a => a.id === selectedAudienceId) : -1;
                  const aud = stage && audIndex !== -1 ? campaign.google[stage][audIndex] : null;
                  const crIndex = aud ? aud.creatives.findIndex(c => c.id === selectedCreativeId) : -1;
                  const cr = aud && crIndex !== -1 ? aud.creatives[crIndex] : null;

                  if (!stage || !aud || !cr) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="font-medium">Criativo não encontrado.</p>
                        <button onClick={() => setSelectedCreativeId(null)} className="text-emerald-600 mt-4 font-bold hover:underline">
                          Voltar para Público
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedCreativeId(null)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-all font-bold"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Público: {aud.title}
                        </button>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            {cr.format === "Search" || cr.format === "Display" ? <SearchIcon className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900">{cr.name || "Criativo sem nome"}</h4>
                            <p className="text-[11px] text-slate-500">{cr.format} • Google Ads</p>
                          </div>
                        </div>
                        
                        <GoogleCreativeEditor
                          creative={cr}
                          collapsible={false}
                          onChange={(updated) => {
                            const newCreatives = [...aud.creatives];
                            newCreatives[crIndex] = updated;
                            const newAudiences = [...campaign.google[stage]];
                            newAudiences[audIndex] = { ...aud, creatives: newCreatives };
                            setGoogleAudiences(stage, newAudiences);
                          }}
                          onRemove={() => {
                            const newCreatives = aud.creatives.filter((_, i) => i !== crIndex);
                            const newAudiences = [...campaign.google[stage]];
                            newAudiences[audIndex] = { ...aud, creatives: newCreatives };
                            setGoogleAudiences(stage, newAudiences);
                            setSelectedCreativeId(null);
                          }}
                          onSave={() => saveAudience(cr.name || "Criativo", "google", aud)}
                        />
                      </div>
                    </div>
                  );
                })()
              ) : !selectedAudienceId ? (
                // Channel Overview
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">Google Ads</h3>
                      <p className="text-xs text-slate-500">Search · Display · YouTube · Discovery</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Verba Alocada</p>
                      <p className="text-xl font-bold text-emerald-600">R$ {campaign.budgetAllocation.googleBudget?.toLocaleString("pt-BR") || "0"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STAGES.map((s) => (
                      <div key={s} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${EDITOR_STAGE_LABELS[s].color} text-white`}>
                            {EDITOR_STAGE_LABELS[s].short}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{campaign.google[s].length} Públicos</span>
                        </div>
                        <div className="space-y-1.5">
                          {campaign.google[s].map((aud, audIdx) => (
                            <div key={aud.id} className="group/aud-row flex items-center gap-1">
                              <div className="flex flex-col gap-0 opacity-0 group-hover/aud-row:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => reorderAudience(aud.id, "google", s, "up")}
                                  disabled={audIdx === 0}
                                  className="p-0.5 rounded text-slate-300 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => reorderAudience(aud.id, "google", s, "down")}
                                  disabled={audIdx === campaign.google[s].length - 1}
                                  className="p-0.5 rounded text-slate-300 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => setSelectedAudienceId(aud.id)}
                                className="flex-1 flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-400 hover:shadow-sm transition-all text-left group/btn"
                              >
                                <span className="truncate">{aud.title}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300 group-hover/btn:text-emerald-500 transition-colors" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newAud: GoogleAudience = {
                                id: uid(),
                                title: "Novo Público Google",
                                description: "",
                                tag: "Segmentação",
                                creatives: [],
                              };
                              setGoogleAudiences(s, [...campaign.google[s], newAud]);
                              setSelectedAudienceId(newAud.id);
                            }}
                            className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-white transition-all mb-2"
                          >
                            + Adicionar Público
                          </button>
                          <button
                            onClick={() => setLibraryModal({ channel: "google", stage: s })}
                            className="w-full p-2 border border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-amber-200 hover:text-amber-500 hover:bg-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Library className="w-3 h-3" />
                            Biblioteca
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-emerald-600" />
                        Sitelinks da Campanha (Globais)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                      Estes links aparecerão em todos os anúncios de Pesquisa e Performance Max desta campanha.
                    </p>
                    <SitelinkListEditor
                      sitelinks={campaign.google.sitelinks ?? []}
                      onChange={(updated) => setCampaign({
                        ...campaign,
                        google: { ...campaign.google, sitelinks: updated }
                      } as Campaign)}
                    />

                    <div className="h-px bg-slate-100 my-8" />

                    <StructuredSnippetEditor
                      snippets={campaign.google.structuredSnippets ?? []}
                      onChange={(updated) => setCampaign({
                        ...campaign,
                        google: { ...campaign.google, structuredSnippets: updated }
                      } as Campaign)}
                    />

                    <div className="h-px bg-slate-100 my-8" />

                    <CallExtensionEditor
                      extension={campaign.google.callExtension}
                      onChange={(updated) => setCampaign({
                        ...campaign,
                        google: { ...campaign.google, callExtension: updated }
                      } as Campaign)}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => setLibraryModal({ channel: "google" })}
                      className="px-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-amber-400 hover:text-amber-500 hover:bg-white transition-all flex items-center gap-2"
                    >
                      <Library className="w-5 h-5" />
                      Importar da Biblioteca de Públicos
                    </button>
                  </div>
                </div>
              ) : (
                // Selected Audience Editor
                (() => {
                  const stage = STAGES.find((s) => campaign.google[s].some((a) => a.id === selectedAudienceId));
                  const audIndex = stage ? campaign.google[stage].findIndex((a) => a.id === selectedAudienceId) : -1;
                  const aud = stage && audIndex !== -1 ? campaign.google[stage][audIndex] : null;

                  if (!stage || !aud) {
                    return (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                          <X className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="font-medium">Público não encontrado nesta visualização.</p>
                        <button 
                          onClick={() => setSelectedAudienceId(null)} 
                          className="text-emerald-600 mt-4 font-bold hover:underline"
                        >
                          Voltar para Google Ads
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedAudienceId(null)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-all font-bold"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Voltar para Google Ads
                        </button>
                        <div className="flex items-center gap-3">
                           <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${EDITOR_STAGE_LABELS[stage].color} text-white shadow-sm shadow-slate-200`}>
                              {EDITOR_STAGE_LABELS[stage].label}
                           </span>
                        </div>
                      </div>
                      
                      <AudienceEditor
                        key={aud.id}
                        audience={aud}
                        channel="google"
                        currentStage={stage}
                        onChange={(updated) => {
                          const list = [...campaign.google[stage]];
                          list[audIndex] = updated as GoogleAudience;
                          setGoogleAudiences(stage, list);
                        }}
                        onRemove={() => {
                          const list = campaign.google[stage].filter((_, idx) => idx !== audIndex);
                          setGoogleAudiences(stage, list);
                          setSelectedAudienceId(null);
                        }}
                        onSave={() => saveAudience(aud.title || "Público sem nome", "google", aud)}
                        onMoveStage={(newStage) => {
                          const from = campaign.google[stage].filter((_, idx) => idx !== audIndex);
                          const to = [...campaign.google[newStage], aud];
                          setCampaign({ 
                            ...campaign, 
                            google: { ...campaign.google, [stage]: from, [newStage]: to } 
                          } as Campaign);
                        }}
                        allStageAudiences={STAGES.map((s) => ({ stage: s, audiences: campaign.google[s] }))}
                        onMoveCreative={(creativeIndex, targetStage, targetAudienceId) => {
                          const creative = aud.creatives[creativeIndex];
                          const updatedCurrentAud = {
                            ...aud,
                            creatives: aud.creatives.filter((_, ci) => ci !== creativeIndex),
                          };
                          const currentList = campaign.google[stage].map((a) => (a.id === aud.id ? updatedCurrentAud : a));
                          const targetList = campaign.google[targetStage].map((a) =>
                            a.id === targetAudienceId
                              ? {
                                  ...a,
                                  creatives: [
                                    ...a.creatives,
                                    { ...creative, id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` },
                                  ],
                                }
                              : a
                          );
                          setCampaign({
                            ...campaign,
                            google: {
                              ...campaign.google,
                              [stage]: currentList as GoogleAudience[],
                              [targetStage]: targetList as GoogleAudience[],
                            },
                          } as Campaign);
                        }}
                      />
                    </div>
                  );
                })()
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* Library picker modal */}
      <AnimatePresence>
        {libraryModal && (
          <LibraryPickerModal
            channel={libraryModal.channel}
            savedAudiences={savedAudiences}
            onPick={(audience) => {
              const channel = libraryModal.channel;
              const targetStage = libraryModal.stage || activeStage;
              if (channel === "meta") {
                setMetaAudiences(targetStage, [
                  ...campaign.meta[targetStage],
                  audience as MetaAudience,
                ]);
              } else {
                setGoogleAudiences(targetStage, [
                  ...campaign.google[targetStage],
                  audience as GoogleAudience,
                ]);
              }
              setLibraryModal(null);
            }}
            onClose={() => setLibraryModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
