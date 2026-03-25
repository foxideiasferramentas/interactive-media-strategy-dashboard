import { X, Pencil, Trash2, Plus, AlignLeft, Video, VideoIcon as ImageIcon, Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { normalizeMediaUrl } from "../../utils/media";

// ─── Focal point editor ───────────────────────────────────────────────────────

export function FocalPointEditor({
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
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          <div
            className="absolute pointer-events-none"
            style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70" style={{ transform: "translateX(-50%)", height: "100vh", top: "-50vh" }} />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/70" style={{ transform: "translateY(-50%)", width: "100vw", left: "-50vw" }} />
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

export function EditableImageList({
  images,
  onChange,
  label,
  focalPoints,
  onFocalChange,
  readOnly,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  label: string;
  focalPoints?: Record<string, { x: number; y: number }>;
  onFocalChange?: (url: string, pt: { x: number; y: number }) => void;
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [editingFocalUrl, setEditingFocalUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const remove = (i: number) => {
    if (window.confirm("Deseja remover esta imagem?")) {
      onChange(images.filter((_, idx) => idx !== i));
    }
  };

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
              {!readOnly && (
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
              )}
              {onFocalChange && (fp.x !== 50 || fp.y !== 50) && (
                <div
                  className="absolute w-2 h-2 rounded-full bg-blue-400 border border-white shadow pointer-events-none"
                  style={{ left: `${fp.x}%`, top: `${fp.y}%`, transform: "translate(-50%,-50%)" }}
                />
              )}
            </div>
          );
        })}
        {!readOnly && (
          <div
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-4 h-4 text-gray-300" />
            <span className="text-[9px] text-gray-300 font-medium">Adicionar</span>
          </div>
        )}
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

export function EditableVideoList({
  videos,
  onChange,
  readOnly,
}: {
  videos: string[];
  onChange: (vids: string[]) => void;
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const remove = (i: number) => {
    if (window.confirm("Deseja remover este vídeo?")) {
      onChange(videos.filter((_, idx) => idx !== i));
    }
  };

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
            {!readOnly && (
              <button
                onClick={() => remove(i)}
                className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow shrink-0"
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <div
            className="h-10 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-4 h-4 text-gray-300" />
            <span className="text-[9px] text-gray-300 font-medium">Adicionar vídeo</span>
          </div>
        )}
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
