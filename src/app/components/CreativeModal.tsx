import { X, Copy, CheckCheck, FileText, MousePointerClick, AlignLeft, Globe, Pencil, Check, Plus, Trash2, ChevronLeft, ChevronRight, Pause, Play, Video, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ElementType } from "react";
import { getYouTubeId } from "../utils/youtube";
import { normalizeMediaUrl, isDirectVideoUrl } from "../utils/media";
import { useIsMobile } from "./ui/use-mobile";
import type { MetaCreative, MetaCarouselCard } from "../data/types";

export interface Creative {
  id: string;
  format: string;
  image: string;
  headline: string;
  body: string;
  cta: string;
  headlines?: string[];
  bodies?: string[];
  sitelinks?: { id: string; title: string; description: string }[];
  longHeadlines?: string[];
  images?: string[];
  logos?: string[];
  videos?: string[];
  businessName?: string;
  finalUrl?: string;
  imageFocalPoints?: Record<string, { x: number; y: number }>;
  displayLink?: string;
  primaryText?: string;
  carouselCards?: any[];
  primaryPlacement?: string;
  description?: string;
}

interface CreativeModalProps {
  creative: Creative | null;
  onClose: () => void;
  onSave?: (updated: Creative) => void;
  companyName?: string;
  companyUrl?: string;
  companyLogo?: string;
}

// ─── Editable inline field ────────────────────────────────────────────────────

function EditableField({
  value,
  onChange,
  multiline,
  placeholder,
  highlight,
  prefix,
  editMode,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  highlight?: string;
  prefix?: string;
  editMode?: boolean;
}) {
  if (editMode) {
    return (
      <div className={`relative rounded-xl border-2 p-3 transition-all ${highlight ?? "border-blue-200 bg-blue-50/30"}`}>
        {prefix && <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mr-1">{prefix}</span>}
        {multiline ? (
          <textarea
            className="w-full text-sm bg-transparent resize-none outline-none text-gray-800 leading-relaxed"
            value={value}
            rows={3}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            className="w-full text-sm bg-transparent outline-none text-gray-800"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    );
  }

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  const commit = () => {
    onChange(draft.trim() || value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  useEffect(() => { setDraft(value); }, [value]);

  if (editing) {
    return (
      <div className={`relative rounded-xl border-2 p-3 ${highlight ?? "border-blue-300 bg-blue-50"}`}>
        {prefix && <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mr-1">{prefix}</span>}
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            className="w-full text-sm bg-transparent resize-none outline-none text-gray-800 leading-relaxed"
            value={draft}
            rows={3}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) commit(); if (e.key === "Escape") cancel(); }}
            autoFocus
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            className="w-full text-sm bg-transparent outline-none text-gray-800"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            autoFocus
          />
        )}
        <div className="flex gap-1 mt-2 justify-end">
          <button onClick={cancel} className="text-[10px] px-2 py-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/60">Cancelar</button>
          <button onClick={commit} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative text-sm p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 cursor-pointer hover:border-blue-200 hover:bg-blue-50/40 transition-all"
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      {prefix && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mr-1">{prefix}</span>}
      <span className="leading-relaxed">{value || <span className="text-gray-300 italic">{placeholder}</span>}</span>
      <Pencil className="absolute top-3 right-3 w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
    </div>
  );
}

// ─── Editable list (headlines / descriptions) ─────────────────────────────────

function EditableList({
  items,
  onChange,
  activeIndices,
  activeColor,
  activeLabel,
  maxLength,
  editMode,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  activeIndices?: number[];
  activeColor?: string;
  activeLabel?: string;
  maxLength?: number;
  editMode?: boolean;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (i: number) => {
    if (editMode) return; // In editMode we edit directly if we want, but let's keep consistency
    setEditIdx(i);
    setDraft(items[i]);
  };

  const commit = (i: number) => {
    const updated = [...items];
    updated[i] = draft.trim() || items[i];
    onChange(updated);
    setEditIdx(null);
  };

  const updateItem = (i: number, val: string) => {
    const updated = [...items];
    updated[i] = val;
    onChange(updated);
  };

  const remove = (i: number) => { onChange(items.filter((_, idx) => idx !== i)); };
  const add = () => {
    const newList = [...items, ""];
    onChange(newList);
    if (!editMode) {
      setEditIdx(items.length);
      setDraft("");
    }
  };

  return (
    <div className="grid gap-1.5">
      {items.map((item, i) => {
        const isActive = activeIndices?.includes(i);

        if (editMode) {
          return (
            <div key={i} className="group relative">
              <div className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition-all ${isActive ? (activeColor ?? "border-blue-200 bg-blue-50/30") : "border-gray-100 bg-white"}`}>
                {isActive && activeLabel && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${activeColor?.includes("blue") ? "text-blue-400" : activeColor?.includes("emerald") ? "text-emerald-500" : "text-violet-400"}`}>
                    {activeLabel}{i + 1}
                  </span>
                )}
                <input
                  className="flex-1 text-sm bg-transparent outline-none text-gray-800"
                  value={item}
                  onChange={(e) => updateItem(i, e.target.value)}
                  placeholder={`Item ${i + 1}`}
                  maxLength={maxLength}
                />
                {items.length > 1 && (
                  <button onClick={() => remove(i)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {maxLength && item.length > maxLength * 0.8 && (
                <p className="text-[9px] text-gray-400 px-2 mt-0.5">{item.length}/{maxLength}</p>
              )}
            </div>
          );
        }

        if (editIdx === i) {
          return (
            <div key={i} className="relative rounded-xl border-2 border-blue-300 bg-blue-50 p-3">
              <input
                className="w-full text-sm bg-transparent outline-none text-gray-800"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commit(i); if (e.key === "Escape") setEditIdx(null); }}
                autoFocus
                maxLength={maxLength}
              />
              {maxLength && <p className="text-[9px] text-gray-400 mt-1 text-right">{draft.length}/{maxLength}</p>}
              <div className="flex gap-1 mt-2 justify-end">
                <button onClick={() => setEditIdx(null)} className="text-[10px] px-2 py-0.5 rounded-md text-gray-400 hover:text-gray-600">Cancelar</button>
                <button onClick={() => commit(i)} className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium">Salvar</button>
              </div>
            </div>
          );
        }
        return (
          <div
            key={i}
            className={`group relative text-sm p-3 rounded-xl border transition-all cursor-pointer ${
              isActive ? (activeColor ?? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm") : "bg-gray-50 border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-blue-50/40"
            }`}
            onClick={() => startEdit(i)}
          >
            {isActive && activeLabel && (
              <span className={`text-[9px] font-bold uppercase tracking-wider mr-1 ${activeColor?.includes("blue") ? "text-blue-400" : activeColor?.includes("emerald") ? "text-emerald-500" : "text-violet-400"}`}>
                {activeLabel}{i + 1}·
              </span>
            )}
            {item || <span className="text-gray-300 italic">vazio</span>}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); startEdit(i); }} className="p-1 rounded hover:bg-white/80">
                <Pencil className="w-3 h-3 text-gray-400" />
              </button>
              {items.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); remove(i); }} className="p-1 rounded hover:bg-white/80">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-700 py-1 px-1 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-3 h-3" /> Adicionar item
      </button>
    </div>
  );
}

function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: ElementType }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        <label className="text-[10px] uppercase tracking-widest text-gray-400">{label}</label>
      </div>
      <div className="relative bg-gray-50 rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
        <p className="text-sm text-gray-700 leading-relaxed pr-8">{value}</p>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm"
          title="Copiar"
        >
          {copied ? (
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Focal point editor ───────────────────────────────────────────────────────

function FocalPointEditor({
  src,
  focal,
  onChange,
  onClose,
}: {
  src: string;
  focal: { x: number; y: number };
  onChange: (pt: { x: number; y: number }) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState(focal);
  const dragging = useRef(false);

  const updateFromEvent = (e: React.MouseEvent | MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    setPoint({ x, y });
  };

  useEffect(() => {
    const up = () => { dragging.current = false; };
    const move = (e: MouseEvent) => { if (dragging.current) updateFromEvent(e); };
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mouseup", up); window.removeEventListener("mousemove", move); };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Ajustar enquadramento</p>
            <p className="text-xs text-gray-400 mt-0.5">Clique ou arraste para definir o ponto focal</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div
          ref={containerRef}
          className="relative w-full cursor-crosshair select-none"
          style={{ maxHeight: "60vh", overflow: "hidden" }}
          onMouseDown={(e) => { dragging.current = true; updateFromEvent(e); }}
          onClick={updateFromEvent}
        >
          <img src={normalizeMediaUrl(src)} alt="" className="w-full h-auto block pointer-events-none" />
          {/* Dimming overlay with hole at focal point */}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          {/* Crosshair */}
          <div
            className="absolute pointer-events-none"
            style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {/* Lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70" style={{ transform: "translateX(-50%)", height: "100vh", top: "-50vh" }} />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/70" style={{ transform: "translateY(-50%)", width: "100vw", left: "-50vw" }} />
            {/* Dot */}
            <div className="w-5 h-5 rounded-full bg-white shadow-lg border-2 border-blue-500" />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400">Focal: {point.x}% · {point.y}%</span>
          <div className="flex gap-2">
            <button
              onClick={() => { setPoint({ x: 50, y: 50 }); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white transition-colors"
            >
              Centralizar
            </button>
            <button
              onClick={() => { onChange(point); onClose(); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Editable image list ──────────────────────────────────────────────────────

function EditableImageList({
  images,
  onChange,
  label,
  focalPoints,
  onFocalChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  label: string;
  focalPoints?: Record<string, { x: number; y: number }>;
  onFocalChange?: (url: string, pt: { x: number; y: number }) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [editingFocalUrl, setEditingFocalUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  const commitUrl = () => {
    const trimmed = newUrl.trim();
    if (trimmed) onChange([...images, trimmed]);
    setNewUrl("");
    setAdding(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) onChange([...images, reader.result as string]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const focalFor = (src: string) => focalPoints?.[src] ?? { x: 50, y: 50 };

  return (
    <>
    {editingFocalUrl && (
      <FocalPointEditor
        src={editingFocalUrl}
        focal={focalFor(editingFocalUrl)}
        onChange={(pt) => onFocalChange?.(editingFocalUrl, pt)}
        onClose={() => setEditingFocalUrl(null)}
      />
    )}
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
        <label className="text-[10px] uppercase tracking-widest text-gray-400">{label} ({images.length})</label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => {
          const fp = focalFor(src);
          return (
            <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={normalizeMediaUrl(src)}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: `${fp.x}% ${fp.y}%` }}
              />
              {/* Action buttons */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onFocalChange && (
                  <button
                    onClick={() => setEditingFocalUrl(src)}
                    className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow"
                    title="Ajustar enquadramento"
                  >
                    <Pencil className="w-2.5 h-2.5 text-white" />
                  </button>
                )}
                <button
                  onClick={() => remove(i)}
                  className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                  title="Remover"
                >
                  <Trash2 className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              {/* Focal indicator dot */}
              {onFocalChange && (fp.x !== 50 || fp.y !== 50) && (
                <div
                  className="absolute w-2 h-2 rounded-full bg-blue-400 border border-white shadow pointer-events-none"
                  style={{ left: `${fp.x}%`, top: `${fp.y}%`, transform: "translate(-50%,-50%)" }}
                />
              )}
            </div>
          );
        })}
        {/* Add button */}
        <div
          className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-4 h-4 text-gray-300" />
          <span className="text-[9px] text-gray-300 font-medium">Adicionar</span>
        </div>
      </div>
      {adding && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium">Adicionar imagem</p>
          <input
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300"
            placeholder="Cole uma URL de imagem..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); if (e.key === "Escape") setAdding(false); }}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 hover:bg-white text-gray-500 transition-colors"
            >
              Arquivo local
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div className="flex-1" />
            <button onClick={() => setAdding(false)} className="text-[10px] px-2 py-1 rounded-lg text-gray-400 hover:text-gray-600">Cancelar</button>
            <button onClick={commitUrl} className="text-[10px] px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">Adicionar</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Editable video list ──────────────────────────────────────────────────────

function EditableVideoList({
  videos,
  onChange,
}: {
  videos: string[];
  onChange: (vids: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const remove = (i: number) => onChange(videos.filter((_, idx) => idx !== i));

  const commitUrl = () => {
    const trimmed = newUrl.trim();
    if (trimmed) onChange([...videos, trimmed]);
    setNewUrl("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Video className="w-3.5 h-3.5 text-gray-400" />
        <label className="text-[10px] uppercase tracking-widest text-gray-400">Vídeos ({videos.length})</label>
      </div>
      <div className="space-y-2">
        {videos.map((vid, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-7 h-7 rounded-md bg-gray-200 flex items-center justify-center shrink-0">
              <Video className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="flex-1 text-[10px] font-mono text-gray-500 truncate">{vid || "—"}</span>
            <button
              onClick={() => remove(i)}
              className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow shrink-0"
            >
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
        <div
          className="h-10 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          onClick={() => setAdding(true)}
        >
          <Plus className="w-4 h-4 text-gray-300" />
          <span className="text-[9px] text-gray-300 font-medium">Adicionar vídeo</span>
        </div>
      </div>
      {adding && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-[10px] text-gray-500 font-medium">URL do vídeo (YouTube, Reels, MP4...)</p>
          <input
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300 font-mono"
            placeholder="https://youtube.com/watch?v=..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitUrl(); if (e.key === "Escape") setAdding(false); }}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-[10px] px-2 py-1 rounded-lg text-gray-400 hover:text-gray-600">Cancelar</button>
            <button onClick={commitUrl} className="text-[10px] px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">Adicionar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// How many headlines Google combines in one RSA slot
const RSA_SLOT_SIZE = 3;


function YouTubePreview({ url, businessName, cta, logo }: { url?: string; businessName?: string; cta?: string; logo?: string }) {
  const videoId = getYouTubeId(url);
  const isShort = !!(url && url.includes("/shorts/"));
  const isDirect = isDirectVideoUrl(url);
  const directUrl = normalizeMediaUrl(url);
  const [ytMuted, setYtMuted] = useState(true);

  const Overlay = () => (
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-5">
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt="" className="w-9 h-9 rounded-full border-2 border-white/20 object-cover shadow-lg" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              {businessName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-white text-[11px] font-bold drop-shadow-md">{businessName || "Sua Empresa"}</span>
            <span className="text-white/70 text-[9px] font-medium uppercase tracking-wider">Patrocinado</span>
          </div>
        </div>
        {cta && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-lg transition-transform active:scale-95">
            {cta}
          </button>
        )}
      </div>
    </div>
  );

  if (isDirect) {
    return (
      <div className="relative w-full bg-black flex items-center justify-center overflow-hidden">
        <video src={directUrl} className="w-full h-auto max-h-[500px] block" muted={ytMuted} playsInline loop autoPlay />
        <Overlay />
        <button
          onClick={() => setYtMuted((m) => !m)}
          className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {ytMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-gray-500 italic text-xs border border-gray-800">
        Vídeo Automático (Baseado em ativos)
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-black overflow-hidden ${isShort ? "aspect-[9/16]" : "aspect-video"}`}>
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=0&modestbranding=1&rel=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      <Overlay />
    </div>
  );
}

function formatDisplayUrl(url?: string): string {
  if (!url) return "www.suaempresa.com.br";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ─── PMax Preview (combinações dinâmicas de ativos) ───────────────────────────

const PMAX_TABS = [
  { id: "search",    label: "Search"   },
  { id: "display_h", label: "Display"  },
  { id: "display_v", label: "Card"     },
  { id: "discovery", label: "Feed"     },
  { id: "youtube",   label: "YouTube"  },
] as const;
type PMaxTabId = (typeof PMAX_TABS)[number]["id"];

interface PMaxPreviewProps {
  creative: Creative;
  companyName: string;
  displayUrl: string;
  activeTab: PMaxTabId;
  setActiveTab: (t: PMaxTabId) => void;
  assetIdx: number;
  img: string;
  h: string;
  lh: string;
  body: string;
  totalImages: number;
}

function PMaxPreview({ creative, companyName, displayUrl, activeTab, setActiveTab, assetIdx, img, h, lh, body, totalImages }: PMaxPreviewProps) {
  const logo     = creative.logos?.[0];
  const videos   = creative.videos ?? [];
  const videoUrl = videos[assetIdx % Math.max(videos.length, 1)]; // cycles through all videos
  const cta      = creative.cta || "Saiba Mais";

  const LogoMark = () =>
    logo ? (
      <img src={logo} alt="" className="w-6 h-6 object-contain rounded shrink-0" />
    ) : (
      <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 shrink-0">
        {companyName.slice(0, 2).toUpperCase()}
      </div>
    );

  // natural=true → renderiza na proporção real da imagem (sem corte)
  const fp = creative.imageFocalPoints?.[img] ?? { x: 50, y: 50 };
  const ImageBox = ({ aspect, natural }: { aspect?: string; natural?: boolean }) =>
    img ? (
      <div className={`bg-gray-100 overflow-hidden ${natural ? "w-full" : aspect}`}>
        <img
          src={normalizeMediaUrl(img)}
          alt=""
          className={natural ? "w-full h-auto block" : "w-full h-full object-cover"}
          style={natural ? undefined : { objectPosition: `${fp.x}% ${fp.y}%` }}
        />
      </div>
    ) : (
      <div className={`bg-gray-50 flex items-center justify-center ${natural ? "aspect-[4/3]" : aspect}`}>
        <Globe className="w-8 h-8 text-gray-200" />
      </div>
    );

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-1">
        {PMAX_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indicador de combinação ativa */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest">Combinação dinâmica</p>
        <div className="flex gap-1">
          {Array.from({ length: Math.min(totalImages, 4) }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${assetIdx % Math.max(totalImages, 1) === i ? "bg-blue-500" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      {/* Preview animado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${assetIdx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >

          {/* ── Search ── */}
          {activeTab === "search" && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-semibold text-gray-500 border border-gray-300 rounded px-1 leading-tight">Patrocinado</span>
                <span className="text-[10px] text-gray-500 truncate">{displayUrl}</span>
              </div>
              <h3 className="text-sm text-blue-700 font-medium leading-snug mb-2">
                {h}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{body}</p>
              {creative.sitelinks && creative.sitelinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                  {creative.sitelinks.slice(0, 4).map((sl) => (
                    <span key={sl.id} className="text-[11px] text-blue-700 border border-blue-100 rounded-full px-2 py-0.5 font-medium">{sl.title}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Display horizontal (banner) ── */}
          {activeTab === "display_h" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <ImageBox aspect="aspect-video" />
              <div className="px-3 py-2.5 flex items-start gap-2.5">
                <LogoMark />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{lh}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{companyName}</p>
                </div>
                <span className="text-[11px] text-blue-700 font-semibold whitespace-nowrap shrink-0 mt-0.5">{cta} ›</span>
              </div>
            </div>
          )}

          {/* ── Display card vertical ── */}
          {activeTab === "display_v" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-[200px] mx-auto">
              <ImageBox natural />
              <div className="p-3">
                {logo && <img src={logo} alt="" className="h-5 w-auto object-contain mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                <p className="text-sm font-bold text-gray-900 leading-snug mb-1 line-clamp-2">{lh}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-1.5 line-clamp-2">{body}</p>
                <p className="text-[10px] text-gray-400 mb-2.5">{companyName}</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-[11px] text-blue-700 font-semibold">{cta} ›</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Discovery / Demand Gen ── */}
          {activeTab === "discovery" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="relative">
                <ImageBox natural />
                <div className="absolute top-2 right-2 w-5 h-5 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-[9px] text-gray-500 font-bold">i</span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  <LogoMark />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{lh}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{body}</p>
                  </div>
                  <span className="text-gray-300 text-base leading-none shrink-0">⋮</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Patrocinado · {companyName}</p>
                <p className="text-[11px] text-blue-700 font-semibold mt-1">{cta} ›</p>
              </div>
            </div>
          )}

          {/* ── YouTube ── */}
          {activeTab === "youtube" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <YouTubePreview url={videoUrl} businessName={companyName} cta={cta} logo={logo} />
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CreativeModal({ creative, onClose, onSave, companyName, companyUrl, companyLogo }: CreativeModalProps) {
  const isMobile = useIsMobile();
  const [comboIndex, setComboIndex] = useState(0);
  const [bodyIndex, setBodyIndex] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Creative | null>(null);
  const [metaImgIdx, setMetaImgIdx] = useState(0);
  const [metaModalPlacement, setMetaModalPlacement] = useState<"feed" | "stories" | "reels">("feed");

  // Sync draft and other states when creative changes
  useEffect(() => {
    if (creative) {
      setDraft((prev) => {
        // Only reset draft if it's a DIFFERENT creative or if we are not editing
        if (!prev || prev.id !== creative.id) return creative;
        return prev;
      });
      
      const placement = (creative as any)?.primaryPlacement?.toLowerCase();
      setMetaModalPlacement(placement === "stories" || placement === "reels" ? placement : "feed");
      
      // Reset navigation states only on ID change
      if (!draft || draft.id !== creative.id) {
        setComboIndex(0);
        setBodyIndex(0);
        setCarouselIdx(0);
        setMetaImgIdx(0);
      }
    } else {
      setDraft(null);
      setEditMode(false);
    }
  }, [creative, draft?.id]);

  const working = (editMode && draft) ? draft : (creative || ({} as Creative));

  const handleSave = () => {
    if (draft && onSave) {
      onSave(draft);
    }
    setEditMode(false);
  };

  const updateDraft = (patch: Partial<Creative>) => {
    setDraft((prev) => {
      const base = prev || creative;
      if (!base) return null;
      // Sync primaryText with body for Meta Ads compatibility
      const newPatch = { ...patch };
      if (patch.body !== undefined) {
        (newPatch as any).primaryText = patch.body;
      }
      return { ...base, ...newPatch };
    });
  };

  // PMax state (lifted so right panel can highlight active assets)
  const [pmaxTab, setPmaxTab] = useState<PMaxTabId>("search");
  const [pmaxAssetIdx, setPmaxAssetIdx] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (creative) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [creative, onClose]);

  const isSearchAd = working?.format?.includes("Search") || working?.format?.includes("Busca");
  const isPMax = working?.format?.includes("Performance Max") || working?.format?.includes("PMax");
  const isYouTubeAd = working?.format?.includes("YouTube");

  // PMax asset arrays
  const pmaxImages      = working ? (working.images?.length ? working.images : working.image ? [working.image] : []) : [];
  const pmaxHeadlines   = working ? (working.headlines?.length ? working.headlines : working.headline ? [working.headline] : ["Título"]) : [];
  const pmaxLongH       = working ? (working.longHeadlines?.length ? working.longHeadlines : pmaxHeadlines) : [];
  const pmaxBodies      = working ? (working.bodies?.length ? working.bodies : working.body ? [working.body] : [""]) : [];

  // ── Shared rotation state (Modal) ──────────────────────────────────
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── PMax rotation logic ───────────────────────────────────────────
  const COMBOS_PER_TAB = 3;
  const pmaxComboRef = useRef(0);
  const pmaxDuration = 5000;

  const pmaxNext = useCallback(() => {
    pmaxComboRef.current++;
    setPmaxAssetIdx((i) => i + 1);
    if (pmaxComboRef.current >= COMBOS_PER_TAB) {
      pmaxComboRef.current = 0;
      setPmaxTab((prev) => {
        const idx = PMAX_TABS.findIndex((t) => t.id === prev);
        return PMAX_TABS[(idx + 1) % PMAX_TABS.length].id;
      });
    }
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, []);

  const pmaxPrev = useCallback(() => {
    pmaxComboRef.current = Math.max(0, pmaxComboRef.current - 1);
    setPmaxAssetIdx((i) => Math.max(0, i - 1));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, []);

  // ── RSA rotation logic ───────────────────────────────────────────
  const rsaDuration = 3500;
  const hCount = working?.headlines?.length || 0;
  const bCount = working?.bodies?.length || 0;
  const rsaCanRotate = isSearchAd && (hCount > RSA_SLOT_SIZE || bCount > 1);
  const maxCombo = hCount > RSA_SLOT_SIZE ? hCount - RSA_SLOT_SIZE + 1 : 1;

  const rsaNext = useCallback(() => {
    setComboIndex((prev) => (hCount > RSA_SLOT_SIZE ? (prev + 1) % maxCombo : 0));
    setBodyIndex((prev) => (bCount > 1 ? (prev + 1) % bCount : 0));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, [hCount, bCount, maxCombo]);

  const rsaPrev = useCallback(() => {
    setComboIndex((prev) => (hCount > RSA_SLOT_SIZE ? (prev - 1 + maxCombo) % maxCombo : 0));
    setBodyIndex((prev) => (bCount > 1 ? (prev - 1 + bCount) % bCount : 0));
    progressRef.current = 0;
    lastTimeRef.current = null;
  }, [hCount, bCount, maxCombo]);

  // ── Progress Loop (Modal) ────────────────────────────────────────
  const doNext = isSearchAd ? rsaNext : pmaxNext;
  const canRotate = isSearchAd ? rsaCanRotate : isPMax;
  const activeDuration = isSearchAd ? rsaDuration : pmaxDuration;

  useEffect(() => {
    if (!canRotate || !creative) return;

    const tick = (ts: number) => {
      if (!paused) {
        if (lastTimeRef.current === null) lastTimeRef.current = ts;
        const delta = ts - lastTimeRef.current;
        lastTimeRef.current = ts;
        progressRef.current = Math.min(100, progressRef.current + (delta / activeDuration) * 100);
        setProgress(progressRef.current);
        if (progressRef.current >= 100) {
          doNext();
        }
      } else {
        lastTimeRef.current = null;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [canRotate, creative, paused, doNext, activeDuration]);

  // ── Shared UI sub-components ──────────────────────────────────────
  const accentFill = isSearchAd ? "bg-blue-500" : (isPMax ? "bg-emerald-500" : "bg-slate-400");

  // All assets derived from the same counter — everything changes together
  const n = pmaxAssetIdx;
  const pmaxImg  = pmaxImages[n % Math.max(pmaxImages.length, 1)]     || "";
  const pmaxLH   = pmaxLongH[n % Math.max(pmaxLongH.length, 1)]       || "";
  const pmaxBody = pmaxBodies[n % Math.max(pmaxBodies.length, 1)]     || "";

  const pmaxHIndices = pmaxHeadlines.length > 0
    ? (pmaxTab === "search"
        ? Array.from({ length: Math.min(3, pmaxHeadlines.length) }, (_, i) => (n + i) % pmaxHeadlines.length)
        : [n % pmaxHeadlines.length])
    : [];
  const pmaxDisplayH = pmaxHIndices.map(i => pmaxHeadlines[i]).join(" · ");

  const allHeadlines = working?.headlines ?? [];
  const activeIndices: number[] = allHeadlines.length > 0
    ? Array.from({ length: Math.min(RSA_SLOT_SIZE, allHeadlines.length) }, (_, i) => (comboIndex + i) % allHeadlines.length)
    : [];
  const displayHeadline = activeIndices.map((i) => allHeadlines[i]).join(" · ") || working?.headline || "";

  // Show ONE description at a time (Google typically shows 1–2; single is cleaner for preview)
  const allBodies = working?.bodies ?? [];
  const displayBody = allBodies[bodyIndex] || working?.body || "";

  const displayCompany = companyName || "Sua Empresa";
  const displayUrl = formatDisplayUrl(companyUrl);

  return (
    <AnimatePresence>
      {creative && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-white rounded-none lg:rounded-2xl max-w-4xl w-full h-[100dvh] lg:h-auto lg:max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editMode ? "bg-blue-100" : "bg-gray-100"}`}>
                  {editMode ? <Pencil className="w-4 h-4 text-blue-600" /> : <FileText className="w-4 h-4 text-gray-500" />}
                </div>
                <div>
                  <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{editMode ? "Editando Criativo" : "Visualização do Criativo"}</p>
                  <p className="text-xs text-gray-400">{working?.format}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onSave && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                )}
                {editMode && (
                  <>
                    <button
                      onClick={() => { setDraft(creative ? { ...creative } : null); setEditMode(false); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
                    >
                      <Check className="w-3.5 h-3.5" /> Salvar
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden flex-1">
              {/* Left: preview */}
              <div className="w-full lg:w-2/5 flex-shrink-0 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col">
                <div className="flex-1 overflow-y-auto w-full p-6">
                  {working && (() => {
                    const isVideoUrl = getYouTubeId(working.videos?.[0] || working.image);

                    const isMeta = working.format === "Image" || working.format === "Video" || working.format === "Carousel";
                    const meta = working as unknown as MetaCreative;
                    const carouselCards = meta.carouselCards || [];

                    const nextCarousel = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setCarouselIdx((i) => (i + 1) % Math.max(carouselCards.length, 1));
                    };
                    const prevCarousel = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setCarouselIdx((i) => (i - 1 + carouselCards.length) % Math.max(carouselCards.length, 1));
                    };

                    if (isMeta) {
                      const isCarousel = working.format === "Carousel";
                      const isVideo = working.format === "Video";
                      const currentCard = isCarousel ? carouselCards[carouselIdx] : null;
                      const modalMetaImages = meta.images?.length ? meta.images : (meta.imageUrl ? [meta.imageUrl] : []);
                      const modalCurrentImgUrl = isCarousel
                        ? (currentCard?.imageUrl || "")
                        : (modalMetaImages[metaImgIdx] || "");
                      const displayCompanyModal = companyName || "Sua Empresa";
                      const placements = isCarousel
                        ? [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }]
                        : [{ id: "feed", label: "Feed" }, { id: "stories", label: "Stories" }, { id: "reels", label: "Reels" }];

                      const ModalMediaNav = () => (
                        <>
                          {isCarousel && carouselCards.length > 1 && (
                            <>
                              <button onClick={prevCarousel} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10">
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button onClick={nextCarousel} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {carouselCards.map((_, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${carouselIdx === i ? "bg-white scale-110" : "bg-white/50"}`} />
                                ))}
                              </div>
                            </>
                          )}
                          {!isCarousel && modalMetaImages.length > 1 && (
                            <>
                              <button onClick={() => setMetaImgIdx((i) => (i - 1 + modalMetaImages.length) % modalMetaImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10">
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                              <button onClick={() => setMetaImgIdx((i) => (i + 1) % modalMetaImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-700 hover:bg-white transition-all z-10">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {modalMetaImages.map((_, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${metaImgIdx === i ? "bg-white scale-110" : "bg-white/50"}`} />
                                ))}
                              </div>
                            </>
                          )}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[9px] border-t-transparent border-l-[16px] border-l-white border-b-[9px] border-b-transparent ml-1" />
                              </div>
                            </div>
                          )}
                        </>
                      );

                      const ModalMediaContent = () => {
                        const [modalMuted, setModalMuted] = useState(true);

                        // Busca URL de vídeo de todas as fontes, independente do formato declarado
                        const rawVideoUrl =
                          working.videos?.find(isDirectVideoUrl) ??
                          working.videos?.[0] ??
                          (isDirectVideoUrl(modalCurrentImgUrl) ? modalCurrentImgUrl : null) ??
                          null;

                        const normalized = rawVideoUrl
                          ? normalizeMediaUrl(rawVideoUrl)
                          : normalizeMediaUrl(modalCurrentImgUrl);

                        if (rawVideoUrl && normalized) {
                          return (
                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                              <video
                                key={normalized}
                                src={normalized}
                                className="w-full h-full object-cover"
                                muted={modalMuted}
                                playsInline
                                loop
                                autoPlay
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setModalMuted((m) => !m); }}
                                className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                              >
                                {modalMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                              </button>
                            </div>
                          );
                        }

                        return (
                          <AnimatePresence mode="wait">
                            <motion.img
                              key={isCarousel ? (currentCard?.id || carouselIdx) : `${working.id}-${metaImgIdx}`}
                              src={normalized}
                              alt=""
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                            />
                          </AnimatePresence>
                        );
                      };

                      return (
                        <div className="flex flex-col gap-4 max-w-[420px] mx-auto w-full">
                          {/* Placement tabs */}
                          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            {placements.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => setMetaModalPlacement(p.id as "feed" | "stories" | "reels")}
                                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all duration-200 ${
                                  metaModalPlacement === p.id
                                    ? "bg-white text-gray-800 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={metaModalPlacement}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* ── Feed ── */}
                              {metaModalPlacement === "feed" && (
                                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                                        <Globe className="w-5 h-5 text-slate-300 pointer-events-none" />
                                        {companyLogo && (
                                          <img
                                            src={normalizeMediaUrl(companyLogo)}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                          />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[14px] font-bold text-gray-900 leading-none">{displayCompanyModal}</p>
                                        <p className="text-[12px] text-gray-400 mt-0.5">Patrocinado · <span className="text-gray-300">🌐</span></p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1.5 opacity-40">
                                      <div className="w-1 h-1 rounded-full bg-gray-900" />
                                      <div className="w-1 h-1 rounded-full bg-gray-900" />
                                      <div className="w-1 h-1 rounded-full bg-gray-900" />
                                    </div>
                                  </div>
                                  <div className="px-4 pb-3">
                                    <p className="text-[14px] text-gray-800 leading-relaxed">{meta.primaryText || working.body}</p>
                                  </div>
                                  <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: "4 / 5" }}>
                                    <ModalMediaContent />
                                    <ModalMediaNav />
                                  </div>
                                  <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[9px] text-gray-400 uppercase tracking-tight truncate">{meta.displayLink || formatDisplayUrl(companyUrl)}</p>
                                      <p className="text-[12px] font-bold text-gray-900 leading-snug truncate">
                                        {(isCarousel ? currentCard?.headline : meta.headline) || working.headline}
                                      </p>
                                      {(meta.description || (isCarousel && currentCard?.description)) && (
                                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                          {isCarousel ? currentCard?.description : meta.description}
                                        </p>
                                      )}
                                    </div>
                                    <button className="px-3 py-2 bg-gray-200 text-gray-800 text-[12px] font-bold rounded-xl shrink-0">{meta.cta}</button>
                                  </div>
                                </div>
                              )}

                              {/* ── Stories ── */}
                              {metaModalPlacement === "stories" && (
                                <div className="relative overflow-hidden rounded-3xl bg-black shadow-sm mx-auto" style={{ aspectRatio: "9 / 16", maxHeight: "520px" }}>
                                  <ModalMediaContent />
                                  <ModalMediaNav />
                                  {/* Top */}
                                  <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-20 pointer-events-none">
                                    <div className="flex gap-1 mb-3">
                                      {[0,1,2].map((i) => <div key={i} className="flex-1 h-[2px] rounded-full bg-white/40" />)}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
                                        <Globe className="w-4 h-4 text-white/40 pointer-events-none" />
                                        {companyLogo && (
                                          <img
                                            src={normalizeMediaUrl(companyLogo)}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                          />
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-[13px] font-bold text-white leading-none">{displayCompanyModal}</p>
                                        <p className="text-[10px] text-white/60 mt-0.5">Patrocinado</p>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Bottom */}
                                  <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-10 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none flex flex-col items-center gap-2">
                                    <p className="text-[14px] text-white font-semibold text-center line-clamp-2 drop-shadow">{meta.headline || working.headline}</p>
                                    <p className="text-[12px] text-white/70 text-center line-clamp-2">{meta.primaryText || working.body}</p>
                                    <div className="mt-2 flex flex-col items-center gap-1">
                                      <div className="w-px h-3 bg-white/60" />
                                      <p className="text-[11px] text-white font-bold uppercase tracking-widest">{meta.cta}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ── Reels ── */}
                              {metaModalPlacement === "reels" && (
                                <div className="relative overflow-hidden rounded-3xl bg-black shadow-sm mx-auto" style={{ aspectRatio: "9 / 16", maxHeight: "520px" }}>
                                  <ModalMediaContent />
                                  <ModalMediaNav />
                                  {/* Right actions */}
                                  <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20 pointer-events-none">
                                    {["♥", "💬", "↗"].map((icon, i) => (
                                      <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                          <span className="text-white text-[15px]">{icon}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Bottom */}
                                  <div className="absolute bottom-0 inset-x-0 px-4 pb-5 pt-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-20 pointer-events-none">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
                                        <Globe className="w-3 h-3 text-white/40 pointer-events-none" />
                                        {companyLogo && (
                                          <img
                                            src={normalizeMediaUrl(companyLogo)}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                          />
                                        )}
                                      </div>
                                      <p className="text-[12px] font-bold text-white">{displayCompanyModal}</p>
                                      <span className="text-[10px] text-white/50">· Patrocinado</span>
                                    </div>
                                    <p className="text-[13px] text-white line-clamp-2 leading-snug mb-3">{working.body || meta.primaryText}</p>
                                    <div className="flex justify-center">
                                      <div className="px-6 py-2 bg-white/15 border border-white/30 backdrop-blur-sm rounded-full">
                                        <span className="text-[13px] font-bold text-white">{meta.cta}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      );
                    }

                    if (isSearchAd) {
                      return (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                          {canRotate && (
                            <div className="h-[3px] w-full bg-gray-100 overflow-hidden mb-3 rounded-full">
                              <div className={`h-full ${accentFill} transition-none`} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                          
                          {canRotate && (
                            <div className="flex items-center justify-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={rsaPrev}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Anterior"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaused((p) => !p)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title={paused ? "Retomar" : "Pausar"}
                              >
                                {paused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={rsaNext}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Próximo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
                            {/* Ad marker + URL */}
                            <div className="flex items-center gap-1.5 mb-2.5">
                              <span className="text-[10px] font-semibold text-gray-500 border border-gray-300 rounded px-1 leading-tight">Ad</span>
                              <span className="text-[11px] text-gray-500 truncate">{displayUrl}</span>
                            </div>

                            {/* Company row */}
                            <div className="flex items-center gap-2 mb-2.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                                <Globe className="w-3 h-3 text-slate-400 pointer-events-none" />
                                {companyLogo && (
                                  <img
                                    src={normalizeMediaUrl(companyLogo)}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
                                  />
                                )}
                              </div>
                              <span className="text-xs text-gray-900 font-medium leading-tight">{displayCompany}</span>
                            </div>

                            {/* Headline combo (animated) */}
                            <AnimatePresence mode="wait">
                              <motion.h3
                                key={comboIndex}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                className="text-base text-blue-700 font-medium leading-snug mb-2 hover:underline decoration-blue-700 cursor-pointer"
                              >
                                {displayHeadline}
                              </motion.h3>
                            </AnimatePresence>

                            {/* Description (animated, one at a time) */}
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={bodyIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="text-[13px] text-gray-600 leading-relaxed mb-4"
                              >
                                {displayBody}
                              </motion.p>
                            </AnimatePresence>

                            {/* CTA */}
                            <div className="mb-4">
                              <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-200">
                                {working.cta}
                              </span>
                            </div>

                            {/* Sitelinks */}
                            {working.sitelinks && working.sitelinks.length > 0 && (
                              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-3 gap-y-3">
                                {working.sitelinks.slice(0, 4).map((sl) => (
                                  <div key={sl.id}>
                                    <p className="text-[12px] text-blue-700 hover:underline cursor-pointer font-medium leading-tight">{sl.title}</p>
                                    <p className="text-[10px] text-gray-500 leading-tight">{sl.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (isPMax) {
                      return (
                        <div className="space-y-4">
                          {canRotate && (
                            <div className="h-[3px] w-full bg-gray-100 overflow-hidden mb-3 rounded-full">
                              <div className={`h-full ${accentFill} transition-none`} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                          
                          <PMaxPreview
                            creative={working}
                            companyName={displayCompany}
                            displayUrl={displayUrl}
                            activeTab={pmaxTab}
                            setActiveTab={setPmaxTab}
                            assetIdx={pmaxAssetIdx}
                            img={pmaxImg}
                            h={pmaxDisplayH}
                            lh={pmaxLH}
                            body={pmaxBody}
                            totalImages={pmaxImages.length}
                          />

                          {canRotate && (
                            <div className="flex items-center justify-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={pmaxPrev}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Anterior"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaused((p) => !p)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title={paused ? "Retomar" : "Pausar"}
                              >
                                {paused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={pmaxNext}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                                title="Próximo"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (isYouTubeAd || isVideoUrl) {
                      return (
                        <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                          <YouTubePreview url={working.videos?.[0] || working.image} businessName={displayCompany} cta={working.cta} />
                        </div>
                      );
                    }

                    return (
                      <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center bg-gray-50">
                        {(working.image || working.images?.[0]) ? (
                          <img
                            src={normalizeMediaUrl(working.image || working.images?.[0])}
                            alt={working.headline}
                            className="w-full object-cover"
                            style={(() => { const u = working.image || working.images?.[0] || ""; const fp = working.imageFocalPoints?.[u] ?? { x: 50, y: 50 }; return { objectPosition: `${fp.x}% ${fp.y}%` }; })()}
                          />
                        ) : (
                          <div className="p-12 text-center opacity-40">
                            <Globe className="w-12 h-12 mx-auto mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">Sem Imagem</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right: copy panel */}
              {working && <div className="w-full lg:flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-widest text-gray-300">Estrutura Responsiva</p>
                    {isSearchAd && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium animate-pulse">
                        Combinação RSA
                      </span>
                    )}
                    {isPMax && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-medium animate-pulse">
                        Combinação PMax
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {isSearchAd && working.headlines ? (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                            <label className="text-[10px] uppercase tracking-widest text-gray-400">Títulos ({working.headlines.length}) — Google combina {RSA_SLOT_SIZE} por vez</label>
                          </div>
                          {editMode ? (
                            <EditableList
                              items={working.headlines}
                              onChange={(items) => updateDraft({ headlines: items })}
                              activeIndices={activeIndices}
                              activeColor="bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                              activeLabel="T"
                              maxLength={30}
                              editMode={editMode}
                            />
                          ) : (
                            <div className="grid gap-2">
                              {working.headlines.map((h, i) => (
                                <div key={i} className={`text-sm p-3 rounded-xl border transition-all ${activeIndices.includes(i) ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                                  {activeIndices.includes(i) && (
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mr-1">
                                      T{activeIndices.indexOf(i) + 1}·
                                    </span>
                                  )}
                                  {h}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {working.bodies && working.bodies.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                              <label className="text-[10px] uppercase tracking-widest text-gray-400">Descrições ({working.bodies.length})</label>
                            </div>
                            {editMode ? (
                              <EditableList
                                items={working.bodies}
                                onChange={(items) => updateDraft({ bodies: items })}
                                activeIndices={[bodyIndex]}
                                activeColor="bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                                activeLabel="D"
                                maxLength={90}
                                editMode={editMode}
                              />
                            ) : (
                              <div className="grid gap-2">
                                {working.bodies.map((b, i) => (
                                  <div key={i} className={`text-sm p-3 rounded-xl border transition-all ${i === bodyIndex ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
                                    {i === bodyIndex && (
                                      <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mr-1">
                                        D{i + 1}·
                                      </span>
                                    )}
                                    {b}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : isPMax ? (
                      <>
                        {/* Títulos curtos */}
                        {pmaxHeadlines.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                              <label className="text-[10px] uppercase tracking-widest text-gray-400">Títulos curtos ({pmaxHeadlines.length})</label>
                            </div>
                            {editMode ? (
                              <EditableList
                                items={working.headlines ?? []}
                                onChange={(items) => updateDraft({ headlines: items })}
                                activeIndices={pmaxHIndices}
                                activeColor="bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                activeLabel="Ativo"
                                maxLength={30}
                                editMode={editMode}
                              />
                            ) : (
                              <div className="grid gap-1.5">
                                {pmaxHeadlines.map((h, i) => (
                                  <div key={i} className={`text-sm p-3 rounded-xl border transition-all ${pmaxHIndices.includes(i) ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                                    {pmaxHIndices.includes(i) && <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mr-1">Ativo·</span>}
                                    {h}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Títulos longos */}
                        {pmaxLongH.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                              <label className="text-[10px] uppercase tracking-widest text-gray-400">Títulos longos ({pmaxLongH.length})</label>
                            </div>
                            {editMode ? (
                              <EditableList
                                items={working.longHeadlines ?? []}
                                onChange={(items) => updateDraft({ longHeadlines: items })}
                                activeIndices={[n % Math.max(pmaxLongH.length, 1)]}
                                activeColor="bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm"
                                activeLabel="Ativo"
                                maxLength={90}
                                editMode={editMode}
                              />
                            ) : (
                              <div className="grid gap-1.5">
                                {pmaxLongH.map((h, i) => (
                                  <div key={i} className={`text-sm p-3 rounded-xl border transition-all ${i === n % Math.max(pmaxLongH.length, 1) ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-700"}`}>
                                    {i === n % Math.max(pmaxLongH.length, 1) && <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mr-1">Ativo·</span>}
                                    {h}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Descrições */}
                        {pmaxBodies.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                              <label className="text-[10px] uppercase tracking-widest text-gray-400">Descrições ({pmaxBodies.length})</label>
                            </div>
                            {editMode ? (
                              <EditableList
                                items={working.bodies ?? []}
                                onChange={(items) => updateDraft({ bodies: items })}
                                activeIndices={[n % Math.max(pmaxBodies.length, 1)]}
                                activeColor="bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                                activeLabel="Ativo"
                                maxLength={90}
                                editMode={editMode}
                              />
                            ) : (
                              <div className="grid gap-1.5">
                                {pmaxBodies.map((b, i) => (
                                  <div key={i} className={`text-sm p-3 rounded-xl border transition-all ${i === n % Math.max(pmaxBodies.length, 1) ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm" : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                                    {i === n % Math.max(pmaxBodies.length, 1) && <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mr-1">Ativo·</span>}
                                    {b}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Nome da empresa */}
                        {working.businessName !== undefined && (
                          editMode ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                                <label className="text-[10px] uppercase tracking-widest text-gray-400">Nome da Empresa</label>
                              </div>
                              <EditableField
                                value={working.businessName ?? ""}
                                onChange={(v) => updateDraft({ businessName: v })}
                                placeholder="Nome da empresa"
                                editMode={editMode}
                              />
                            </div>
                          ) : (
                            <CopyField label="Nome da Empresa" value={working.businessName ?? ""} icon={AlignLeft} />
                          )
                        )}
                      </>
                    ) : (
                      <>
                        {editMode ? (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                                <label className="text-[10px] uppercase tracking-widest text-gray-400">Headline / Título</label>
                              </div>
                              <EditableField
                                value={working.headline}
                                onChange={(v) => updateDraft({ headline: v })}
                                placeholder="Título do anúncio"
                                editMode={editMode}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <AlignLeft className="w-3.5 h-3.5 text-gray-400" />
                                <label className="text-[10px] uppercase tracking-widest text-gray-400">Texto Principal / Copy</label>
                              </div>
                              <EditableField
                                value={working.body}
                                onChange={(v) => updateDraft({ body: v })}
                                multiline
                                placeholder="Descrição do anúncio"
                                editMode={editMode}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <CopyField label="Headline / Título" value={working.headline} icon={AlignLeft} />
                            <CopyField label="Texto Principal / Copy" value={working.body} icon={AlignLeft} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-[10px] uppercase tracking-widest text-gray-400">CTA – Chamada para Ação</label>
                  </div>
                  {editMode ? (
                    <EditableField
                      value={working.cta}
                      onChange={(v) => updateDraft({ cta: v })}
                      placeholder="Ex: Saiba Mais"
                      editMode={editMode}
                    />
                  ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-sm shadow-blue-200" style={{ fontWeight: 600 }}>
                      {working.cta}
                    </div>
                    <span className="text-xs text-gray-300">Botão de conversão</span>
                  </div>
                  )}
                </div>

                {/* Images — only shown in edit mode */}
                {editMode && (
                  <>
                    {(working.images && working.images.length > 0 || !isSearchAd) && (
                      <EditableImageList
                        images={working.images?.length ? working.images : working.image ? [working.image] : []}
                        onChange={(imgs) => updateDraft({ images: imgs, image: imgs[0] ?? "" })}
                        label="Imagens"
                        focalPoints={working.imageFocalPoints}
                        onFocalChange={(url, pt) => updateDraft({ imageFocalPoints: { ...working.imageFocalPoints, [url]: pt } })}
                      />
                    )}
                    {working.logos !== undefined && (
                      <EditableImageList
                        images={working.logos ?? []}
                        onChange={(imgs) => updateDraft({ logos: imgs })}
                        label="Logos"
                      />
                    )}
                    {/* Videos for Meta and YouTube/Display formats */}
                    {!isSearchAd && !isPMax && (
                      <EditableVideoList
                        videos={working.videos ?? []}
                        onChange={(vids) => updateDraft({ videos: vids })}
                      />
                    )}
                  </>
                )}

              </div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
