import { Pencil, Trash2, Plus, Copy, CheckCheck } from "lucide-react";
import { useState, useRef, useEffect, ElementType } from "react";

export function EditableField({
  value,
  onChange,
  multiline,
  placeholder,
  highlight,
  prefix,
  editMode,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  highlight?: string;
  prefix?: string;
  editMode?: boolean;
  readOnly?: boolean;
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
      className={`group relative text-sm p-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-700 transition-all ${!readOnly ? "cursor-pointer hover:border-blue-200 hover:bg-blue-50/40" : ""}`}
      onClick={() => !readOnly && setEditing(true)}
      title={!readOnly ? "Clique para editar" : undefined}
    >
      {prefix && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mr-1">{prefix}</span>}
      <span className="leading-relaxed">{value || <span className="text-gray-300 italic">{placeholder}</span>}</span>
      {!readOnly && <Pencil className="absolute top-3 right-3 w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />}
    </div>
  );
}

export function EditableList({
  items,
  onChange,
  activeIndices,
  activeColor,
  activeLabel,
  maxLength,
  editMode,
  readOnly,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  activeIndices?: number[];
  activeColor?: string;
  activeLabel?: string;
  maxLength?: number;
  editMode?: boolean;
  readOnly?: boolean;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (i: number) => {
    if (editMode || readOnly) return;
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
    if (readOnly) return;
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
            className={`group relative text-sm p-3 rounded-xl border transition-all ${
              isActive ? (activeColor ?? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm") : "bg-gray-50 border-gray-100 text-gray-500"
            } ${!readOnly ? "cursor-pointer hover:border-blue-200 hover:bg-blue-50/40" : ""}`}
            onClick={() => startEdit(i)}
          >
            {isActive && activeLabel && (
              <span className={`text-[9px] font-bold uppercase tracking-wider mr-1 ${activeColor?.includes("blue") ? "text-blue-400" : activeColor?.includes("emerald") ? "text-emerald-500" : "text-violet-400"}`}>
                {activeLabel}{i + 1}·
              </span>
            )}
            {item || <span className="text-gray-300 italic">vazio</span>}
            {!readOnly && (
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
            )}
          </div>
        );
      })}
      {!readOnly && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-[11px] text-blue-500 hover:text-blue-700 py-1 px-1 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar item
        </button>
      )}
    </div>
  );
}

export function CopyField({ label, value, icon: Icon }: { label: string; value: string; icon: ElementType }) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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
