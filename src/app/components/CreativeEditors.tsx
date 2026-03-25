import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Image as ImageIcon,
  Video,
  Trash2,
  Edit2,
  X,
  Target,
  Zap,
  Link as LinkIcon,
  Bookmark,
  BookmarkCheck,
  Library,
  Copy,
  ArrowUpDown,
  Plus,
  Search as SearchIcon,
} from "lucide-react";
import { useStore } from "../data/store";
import { normalizeMediaUrl } from "../utils/media";
import type {
  MetaCreative,
  GoogleCreative,
  Sitelink,
  SavedSitelinkSet,
  MetaCarouselCard,
} from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Inline editable field ────────────────────────────────────────────────────

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none"
        />
      )}
    </div>
  );
}

// ─── Meta Creative Editor ─────────────────────────────────────────────────────

export function MetaCreativeEditor({
  creative,
  onChange,
  onRemove,
  onSave,
  onDuplicate,
  onMoveCreative,
  collapsible = true,
  initialOpen = false,
}: {
  creative: MetaCreative;
  onChange: (c: MetaCreative) => void;
  onRemove: () => void;
  onSave?: () => void;
  onDuplicate?: () => void;
  onMoveCreative?: () => void;
  collapsible?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible || initialOpen);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const formatIcons: Record<MetaCreative["format"], React.ElementType> = {
    Image: ImageIcon,
    Video: Video,
    Carousel: Layers,
  };
  const Icon = formatIcons[creative.format];

  return (
    <div className={`border border-slate-200 rounded-2xl overflow-hidden bg-white ${!collapsible ? 'border-none shadow-none' : ''}`}>
      {/* Header */}
      {collapsible && (
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {creative.name || "Sem nome"}
            </p>
            <p className="text-xs text-slate-400">{creative.format}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              title="Salvar criativo na biblioteca"
              className={`p-1.5 rounded-lg transition-all ${
                justSaved ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
              }`}
            >
              {justSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
              title="Duplicar criativo"
              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveCreative?.(); }}
              title="Mover para outro público/etapa"
              className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
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
            <Edit2
              className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
            />
          </div>
        </div>
      )}

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 space-y-4 ${collapsible ? 'border-t border-slate-100 pt-4' : ''}`}>
              <Field
                label="Nome do Criativo"
                value={creative.name}
                onChange={(v) => onChange({ ...creative, name: v })}
                placeholder="Ex: Feed Principal - Awareness"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Plataforma / Posicionamento Principal
                </label>
                <div className="flex gap-2">
                  {(["Feed", "Stories", "Reels"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => onChange({ ...creative, primaryPlacement: p })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        creative.primaryPlacement === p
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "border-slate-100 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {creative.format !== "Carousel" && (
                <div className="pt-2 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" />
                      Imagens (variações)
                    </label>
                    {(creative.images ?? (creative.imageUrl ? [creative.imageUrl] : [])).map((img, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        {img && (
                          <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                            <img
                              src={normalizeMediaUrl(img)}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                        <input
                          type="url"
                          value={img}
                          placeholder="https://exemplo.com/imagem.jpg"
                          onChange={(e) => {
                            const imgs = [...(creative.images ?? (creative.imageUrl ? [creative.imageUrl] : []))];
                            imgs[i] = e.target.value;
                            onChange({ ...creative, images: imgs, imageUrl: imgs[0] ?? "" });
                          }}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                        <button
                          onClick={() => {
                            const imgs = (creative.images ?? (creative.imageUrl ? [creative.imageUrl] : [])).filter((_, idx) => idx !== i);
                            onChange({ ...creative, images: imgs, imageUrl: imgs[0] ?? "" });
                          }}
                          className="text-red-400 hover:text-red-600 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const imgs = [...(creative.images ?? (creative.imageUrl ? [creative.imageUrl] : [])), ""];
                        onChange({ ...creative, images: imgs });
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Imagem
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                      <Video className="w-3 h-3" />
                      Vídeos (URLs/YouTube)
                    </label>
                    {(creative.videos ?? []).map((vid, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={vid}
                          placeholder="https://youtube.com/watch?v=..."
                          onChange={(e) => {
                            const vids = [...(creative.videos ?? [])];
                            vids[i] = e.target.value;
                            onChange({ ...creative, videos: vids });
                          }}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                        <button
                          onClick={() => {
                            const vids = (creative.videos ?? []).filter((_, idx) => idx !== i);
                            onChange({ ...creative, videos: vids });
                          }}
                          className="text-red-400 hover:text-red-600 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => onChange({ ...creative, videos: [...(creative.videos ?? []), ""] })}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Vídeo
                    </button>
                  </div>
                </div>
              )}

               <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Headline / Título"
                  value={creative.headline}
                  onChange={(v) => onChange({ ...creative, headline: v })}
                  placeholder="Ex: Transforme a gestão do seu negócio"
                />
                <Field
                  label="Descrição (Abaixo do Título)"
                  value={creative.description || ""}
                  onChange={(v) => onChange({ ...creative, description: v })}
                  placeholder="Ex: Frete grátis para todo o Brasil"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Texto Principal (copy)"
                  value={creative.primaryText}
                  onChange={(v) => onChange({ ...creative, primaryText: v })}
                  placeholder="Descreva a proposta de valor do anúncio..."
                  multiline
                />
                <div className="space-y-4">
                  <Field
                    label="Link Visível (Display URL)"
                    value={creative.displayLink || ""}
                    onChange={(v) => onChange({ ...creative, displayLink: v })}
                    placeholder="Ex: br.sm-madeiras.com"
                  />
                  <Field
                    label="CTA"
                    value={creative.cta}
                    onChange={(v) => onChange({ ...creative, cta: v })}
                    placeholder="Ex: Saiba Mais"
                  />
                </div>
              </div>

              {creative.format === "Carousel" && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Cards do Carrossel (mín. 2)
                    </label>
                    <button
                      onClick={() => {
                        const newCard: MetaCarouselCard = {
                          id: uid(),
                          imageUrl: "",
                          headline: "Novo Card",
                          description: "",
                          cta: creative.cta,
                        };
                        onChange({
                          ...creative,
                          carouselCards: [...(creative.carouselCards || []), newCard],
                        });
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Card
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(creative.carouselCards || []).map((card, idx) => (
                      <div key={card.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">#0{idx + 1}</span>
                          <button
                            onClick={() => {
                              const cards = (creative.carouselCards || []).filter((_, i) => i !== idx);
                              onChange({ ...creative, carouselCards: cards });
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          <input
                             type="url"
                             value={card.imageUrl}
                             placeholder="URL da Imagem do Card"
                             onChange={(e) => {
                               const cards = [...(creative.carouselCards || [])];
                               cards[idx] = { ...card, imageUrl: e.target.value };
                               onChange({ ...creative, carouselCards: cards });
                             }}
                             className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/10"
                          />
                          {card.imageUrl && (
                            <div className="h-20 rounded-lg overflow-hidden border border-slate-200">
                              <img src={normalizeMediaUrl(card.imageUrl)} className="w-full h-full object-cover" alt="" />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={card.headline}
                            placeholder="Título do Card"
                            onChange={(e) => {
                              const cards = [...(creative.carouselCards || [])];
                              cards[idx] = { ...card, headline: e.target.value };
                              onChange({ ...creative, carouselCards: cards });
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                          />
                          <input
                            type="text"
                            value={card.description || ""}
                            placeholder="Descrição (opcional)"
                            onChange={(e) => {
                              const cards = [...(creative.carouselCards || [])];
                              cards[idx] = { ...card, description: e.target.value };
                              onChange({ ...creative, carouselCards: cards });
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/10"
                          />
                        </div>
                      </div>
                    ))}
                    {(creative.carouselCards?.length || 0) === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-xs text-slate-400 font-medium">Adicione cards para configurar seu carrossel.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Google Creative Editor ───────────────────────────────────────────────────

export function GoogleCreativeEditor({
  creative,
  onChange,
  onRemove,
  onSave,
  onDuplicate,
  onMoveCreative,
  collapsible = true,
  initialOpen = false,
}: {
  creative: GoogleCreative;
  onChange: (c: GoogleCreative) => void;
  onRemove: () => void;
  onSave?: () => void;
  onDuplicate?: () => void;
  onMoveCreative?: () => void;
  collapsible?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible || initialOpen);
  const [justSaved, setJustSaved] = useState(false);
  const [showSitelinkLibrary, setShowSitelinkLibrary] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };
  const [saveSlLabel, setSaveSlLabel] = useState("");
  const [showSaveSlForm, setShowSaveSlForm] = useState(false);
  const { savedSitelinkSets, saveSitelinkSet, deleteSavedSitelinkSet } = useStore();
  const isSearch = creative.format === "Search";
  const isPMax = creative.format === "PMax";

  const formatIcons: Partial<Record<string, React.ElementType>> = {
    Search: SearchIcon,
    Display: ImageIcon,
    YouTube: Video,
    Discovery: Target,
    PMax: Zap,
  };
  const Icon = formatIcons[creative.format] ?? SearchIcon;

  const updateArrayItem = (
    field: "headlines" | "descriptions" | "longHeadlines" | "images" | "logos" | "videos",
    index: number,
    value: string
  ) => {
    const list = [...(creative[field] ?? [])];
    list[index] = value;
    onChange({ ...creative, [field]: list });
  };

  const addArrayItem = (field: "headlines" | "descriptions" | "longHeadlines" | "images" | "logos" | "videos") => {
    const list = [
      ...(creative[field] ?? []),
      field === "headlines" || field === "longHeadlines" ? "Novo Título" : 
      field === "descriptions" ? "Nova Descrição" : "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    ];
    onChange({ ...creative, [field]: list });
  };

  const removeArrayItem = (
    field: "headlines" | "descriptions" | "longHeadlines" | "images" | "logos" | "videos",
    index: number
  ) => {
    const list = (creative[field] ?? []).filter((_, i) => i !== index);
    onChange({ ...creative, [field]: list });
  };

  const sitelinks = creative.sitelinks ?? [];

  const addSitelink = () => {
    const sl: Sitelink = { id: uid(), title: "Novo Link", description: "Descrição do link" };
    onChange({ ...creative, sitelinks: [...sitelinks, sl] });
  };

  const updateSitelink = (index: number, field: keyof Sitelink, value: string) => {
    const updated = sitelinks.map((sl, i) => i === index ? { ...sl, [field]: value } : sl);
    onChange({ ...creative, sitelinks: updated });
  };

  const removeSitelink = (index: number) => {
    onChange({ ...creative, sitelinks: sitelinks.filter((_, i) => i !== index) });
  };

  const loadSitelinkSet = (set: SavedSitelinkSet) => {
    onChange({ ...creative, sitelinks: set.sitelinks.map(sl => ({ ...sl, id: uid() })) });
    setShowSitelinkLibrary(false);
  };

  return (
    <div className={`border border-slate-200 rounded-2xl overflow-hidden bg-white ${!collapsible ? 'border-none shadow-none' : ''}`}>
      {collapsible && (
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {creative.name || "Sem nome"}
            </p>
            <p className="text-xs text-slate-400">{creative.format}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              title="Salvar criativo na biblioteca"
              className={`p-1.5 rounded-lg transition-all ${
                justSaved ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
              }`}
            >
              {justSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
              title="Duplicar criativo"
              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveCreative?.(); }}
              title="Mover para outro público/etapa"
              className="p-1.5 text-slate-400 hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
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
            <Edit2
              className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-5 pb-5 space-y-4 ${collapsible ? 'border-t border-slate-100 pt-4' : ''}`}>
              <Field
                label="Nome do Criativo"
                value={creative.name}
                onChange={(v) => onChange({ ...creative, name: v })}
                placeholder="Ex: RSA - Genérico Awareness"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Formato
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(
                    ["Search", "Display", "YouTube", "Discovery", "PMax"] as GoogleCreative["format"][]
                  ).map((f) => (
                    <button
                      key={f}
                      onClick={() => onChange({ ...creative, format: f })}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        creative.format === f
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "border-slate-100 text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {isSearch ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Títulos RSA (até 15)
                    </label>
                    {(creative.headlines ?? []).map((h, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) =>
                            updateArrayItem("headlines", i, e.target.value)
                          }
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                        <button
                          onClick={() => removeArrayItem("headlines", i)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(creative.headlines?.length ?? 0) < 15 && (
                      <button
                        onClick={() => addArrayItem("headlines")}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Título
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Descrições RSA (até 4)
                    </label>
                    {(creative.descriptions ?? []).map((d, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={d}
                          onChange={(e) =>
                            updateArrayItem("descriptions", i, e.target.value)
                          }
                          className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                        <button
                          onClick={() => removeArrayItem("descriptions", i)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(creative.descriptions?.length ?? 0) < 4 && (
                      <button
                        onClick={() => addArrayItem("descriptions")}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Descrição
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Extensões de Sitelink (até 4)
                      </label>
                      <button
                        onClick={() => setShowSitelinkLibrary(true)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <Library className="w-3 h-3" /> Da Biblioteca
                      </button>
                    </div>

                    {sitelinks.map((sl, i) => (
                      <div key={sl.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sl.title}
                            placeholder="Título do link"
                            onChange={(e) => updateSitelink(i, "title", e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 outline-none font-medium"
                          />
                          <button
                            onClick={() => removeSitelink(i)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={sl.description}
                          placeholder="Descrição curta"
                          onChange={(e) => updateSitelink(i, "description", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 outline-none text-slate-500"
                        />
                      </div>
                    ))}

                    {sitelinks.length < 4 && (
                      <button
                        onClick={addSitelink}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Sitelink
                      </button>
                    )}

                    {sitelinks.length > 0 && (
                      <div className="pt-1">
                        {showSaveSlForm ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={saveSlLabel}
                              onChange={(e) => setSaveSlLabel(e.target.value)}
                              placeholder="Nome do conjunto (ex: Serviços Principais)"
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none"
                            />
                            <button
                              onClick={() => {
                                if (saveSlLabel.trim()) {
                                  saveSitelinkSet(saveSlLabel.trim(), sitelinks);
                                  setSaveSlLabel("");
                                  setShowSaveSlForm(false);
                                }
                              }}
                              className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => { setShowSaveSlForm(false); setSaveSlLabel(""); }}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowSaveSlForm(true)}
                            className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors"
                          >
                            <Bookmark className="w-3 h-3" /> Salvar conjunto na Biblioteca
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {showSitelinkLibrary && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowSitelinkLibrary(false)}
                          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                        >
                          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Library className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">Biblioteca de Sitelinks</p>
                                <p className="text-xs text-slate-400">{savedSitelinkSets.length} conjunto(s) salvo(s)</p>
                              </div>
                            </div>
                            <button onClick={() => setShowSitelinkLibrary(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                            {savedSitelinkSets.length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-8">Nenhum conjunto salvo ainda.</p>
                            ) : (
                              savedSitelinkSets.map((set) => (
                                <div key={set.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{set.label}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{set.sitelinks.length} sitelink(s)</p>
                                    <div className="mt-2 space-y-0.5">
                                      {set.sitelinks.slice(0, 3).map((sl) => (
                                        <p key={sl.id} className="text-[11px] text-slate-500 truncate">· {sl.title}</p>
                                      ))}
                                      {set.sitelinks.length > 3 && (
                                        <p className="text-[11px] text-slate-400">+{set.sitelinks.length - 3} mais</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                      onClick={() => loadSitelinkSet(set)}
                                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                      Usar
                                    </button>
                                    <button
                                      onClick={() => deleteSavedSitelinkSet(set.id)}
                                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              ) : isPMax ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Títulos Curtos (até 15)
                      </label>
                      {(creative.headlines ?? []).map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => updateArrayItem("headlines", i, e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                          />
                          <button onClick={() => removeArrayItem("headlines", i)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(creative.headlines?.length ?? 0) < 15 && (
                        <button onClick={() => addArrayItem("headlines")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Adicionar Título Curto
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Títulos Longos (até 5)
                      </label>
                      {(creative.longHeadlines ?? []).map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => updateArrayItem("longHeadlines", i, e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                          />
                          <button onClick={() => removeArrayItem("longHeadlines", i)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(creative.longHeadlines?.length ?? 0) < 5 && (
                        <button onClick={() => addArrayItem("longHeadlines")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Adicionar Título Longo
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                        Descrições (até 5)
                      </label>
                      {(creative.descriptions ?? []).map((d, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={d}
                            onChange={(e) => updateArrayItem("descriptions", i, e.target.value)}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                          />
                          <button onClick={() => removeArrayItem("descriptions", i)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(creative.descriptions?.length ?? 0) < 5 && (
                        <button onClick={() => addArrayItem("descriptions")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Adicionar Descrição
                        </button>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Imagens (URLs)</label>
                        {(creative.images ?? []).map((img, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            {img && (
                              <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                                <img
                                  src={normalizeMediaUrl(img)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </div>
                            )}
                            <input type="url" value={img} onChange={(e) => updateArrayItem("images", i, e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" />
                            <button onClick={() => removeArrayItem("images", i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addArrayItem("images")} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Imagem</button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Vídeos (YouTube IDs/URLs)</label>
                        {(creative.videos ?? []).map((vid, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input type="text" value={vid} onChange={(e) => updateArrayItem("videos", i, e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" />
                            <button onClick={() => removeArrayItem("videos", i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addArrayItem("videos")} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Vídeo</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                   <Field
                    label="Headline / Título"
                    value={creative.headline || (creative.headlines?.[0] || "")}
                    onChange={(v) => onChange({ ...creative, headline: v })}
                    placeholder="Ex: Título chamativo"
                  />
                  <Field
                    label="Texto / Descrição"
                    value={creative.description || (creative.descriptions?.[0] || "")}
                    onChange={(v) => onChange({ ...creative, description: v })}
                    placeholder="Conteúdo do anúncio..."
                    multiline
                  />
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
                      <LinkIcon className="w-3 h-3" />
                      URL da Mídia
                    </label>
                    <input
                      type="url"
                      value={creative.imageUrl || (creative.images?.[0] || "")}
                      placeholder="https://exemplo.com/imagem.jpg"
                      onChange={(e) =>
                        onChange({ ...creative, imageUrl: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 outline-none font-mono text-xs"
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
