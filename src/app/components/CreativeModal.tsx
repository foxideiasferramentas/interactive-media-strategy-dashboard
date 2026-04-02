import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { X, FileText, Pencil, Check, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Globe, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getYouTubeId } from "../utils/youtube";
import { normalizeMediaUrl, isDirectVideoUrl, loadedMediaCache } from "../utils/media";
import { useIsMobile } from "./ui/use-mobile";
import type { MetaCreative, MetaCarouselCard } from "../data/types";
import { uid } from "../utils/uid";

// Import extracted components
import { EditableField, EditableList, CopyField } from "./creative/SharedFields";
import { EditableImageList, EditableVideoList } from "./creative/MediaEditors";
import { YouTubePreview, PMaxPreview, PMAX_TABS, PMaxTabId, formatDisplayUrl } from "./creative/Previews";
import { ImageWithSkeleton } from "./CreativeCard";

export interface Creative {
  id: string;
  name?: string;
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
  readOnly?: boolean;
}

const RSA_SLOT_SIZE = 3;

export function CreativeModal({ creative, onClose, onSave, companyName, companyUrl, companyLogo, readOnly }: CreativeModalProps) {
  const isMobile = useIsMobile();
  const [comboIndex, setComboIndex] = useState(0);
  const [bodyIndex, setBodyIndex] = useState(0);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Creative | null>(null);
  const [metaImgIdx, setMetaImgIdx] = useState(0);
  const [metaModalPlacement, setMetaModalPlacement] = useState<"feed" | "stories" | "reels">("feed");

  useEffect(() => {
    if (creative) {
      setDraft((prev) => {
        if (!prev || prev.id !== creative.id) return creative;
        return prev;
      });
      
      const placement = (creative as any)?.primaryPlacement?.toLowerCase();
      setMetaModalPlacement(placement === "stories" || placement === "reels" ? placement : "feed");
      
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
      const newPatch = { ...patch };
      if (patch.body !== undefined) {
        (newPatch as any).primaryText = patch.body;
      }
      return { ...base, ...newPatch };
    });
  };

  const [pmaxTab, setPmaxTab] = useState<PMaxTabId>("search");
  const [pmaxAssetIdx, setPmaxAssetIdx] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (creative) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      
      // Sincronizar aba se vier de um card desmembrado
      if ((creative as any).forcedTab) {
        setPmaxTab((creative as any).forcedTab);
      } else {
        setPmaxTab("search");
      }
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [creative, onClose]);

  const isSearchAd = working?.format?.includes("Search") || working?.format?.includes("Busca");
  const isPMax = working?.format?.includes("Performance Max") || working?.format?.includes("PMax");
  
  const pmaxImages      = working ? (working.images?.length ? working.images : working.image ? [working.image] : []) : [];
  const pmaxHeadlines   = working ? (working.headlines?.length ? working.headlines : working.headline ? [working.headline] : ["Título"]) : [];
  const pmaxLongH       = working ? (working.longHeadlines?.length ? working.longHeadlines : pmaxHeadlines) : [];
  const pmaxBodies      = working ? (working.bodies?.length ? working.bodies : working.body ? [working.body] : [""]) : [];

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const COMBOS_PER_TAB = 3;
  const pmaxComboRef = useRef(0);
  const pmaxDuration = 5000;

  const pmaxNext = useCallback(() => {
    pmaxComboRef.current++;
    setPmaxAssetIdx((i) => i + 1);
    if (pmaxComboRef.current >= COMBOS_PER_TAB) {
      pmaxComboRef.current = 0;
      // Removida a troca automática de abas no modal para manter o foco no formato selecionado
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

  const accentFill = isSearchAd ? "bg-blue-500" : (isPMax ? "bg-emerald-500" : "bg-slate-400");
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-0 lg:p-6"
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
                  <p className="text-gray-900 text-sm font-semibold">{editMode ? "Editando Criativo" : "Visualização do Criativo"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onSave && !editMode && !readOnly && (
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
                <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] overflow-hidden flex-1 min-h-0">
              {/* Left: Preview Area */}
              <div className="bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden w-full p-6">
                  {working && (() => {
                     const isMeta = working.format === "Image" || working.format === "Video" || working.format === "Carousel";
                     if (isMeta) {
                       const meta = working as unknown as MetaCreative;
                       const carouselCards = meta.carouselCards || [];
                       const isCarousel = working.format === "Carousel";
                       const isVideo = working.format === "Video";
                       const metaImgList = meta.videos?.length
                         ? meta.videos
                         : meta.images?.length
                         ? meta.images
                         : meta.imageUrl
                         ? [meta.imageUrl]
                         : [];
                       const currentImg = isCarousel ? carouselCards[carouselIdx]?.imageUrl : metaImgList[metaImgIdx];
                       const normalizedImg = normalizeMediaUrl(currentImg || "");
                       const placements = isCarousel ? ["feed", "stories"] : ["feed", "stories", "reels"];

                       return (
                         <div className="flex flex-col gap-4 max-w-[420px] mx-auto w-full">
                           <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                             {placements.map((p) => (
                               <button
                                 key={p}
                                 onClick={() => setMetaModalPlacement(p as any)}
                                 className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${metaModalPlacement === p ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                               >
                                 {p.charAt(0).toUpperCase() + p.slice(1)}
                               </button>
                             ))}
                           </div>

                           <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                              <MetaPreviewBody
                                placement={metaModalPlacement}
                                creative={meta}
                                companyName={displayCompany}
                                companyLogo={companyLogo}
                                imgIdx={metaImgIdx}
                                carouselIdx={carouselIdx}
                                onPrev={() => isCarousel ? setCarouselIdx(prevCarousel(carouselIdx, carouselCards.length)) : setMetaImgIdx(prevCarousel(metaImgIdx, metaImgList.length))}
                                onNext={() => isCarousel ? setCarouselIdx(nextCarousel(carouselIdx, carouselCards.length)) : setMetaImgIdx(nextCarousel(metaImgIdx, metaImgList.length))}
                                totalItems={isCarousel ? carouselCards.length : metaImgList.length}
                              />
                           </div>
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
                           <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
                             <div className="flex items-center gap-1.5 mb-2.5">
                               <span className="text-[10px] font-semibold text-gray-500 border border-gray-300 rounded px-1 leading-tight">Ad</span>
                               <span className="text-[11px] text-gray-500 truncate">{displayUrl}</span>
                             </div>
                             <div className="flex items-center gap-2 mb-2.5">
                               <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                                 <Globe className="w-3 h-3 text-slate-400" />
                                 {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
                               </div>
                               <span className="text-xs text-gray-900 font-medium">{displayCompany}</span>
                             </div>
                             <AnimatePresence mode="wait">
                               <motion.h3 key={comboIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-base text-blue-700 font-medium leading-snug mb-2">{displayHeadline}</motion.h3>
                             </AnimatePresence>
                             <AnimatePresence mode="wait">
                               <motion.p key={bodyIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-gray-600 leading-relaxed mb-4">{displayBody}</motion.p>
                             </AnimatePresence>
                             <div className="mb-4">
                               <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-200">{working.cta}</span>
                             </div>
                             {working.sitelinks?.length ? (
                               <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                                 {working.sitelinks.slice(0, 4).map((sl) => (
                                   <div key={sl.id}>
                                     <p className="text-[12px] text-blue-700 font-medium">{sl.title}</p>
                                     <p className="text-[10px] text-gray-500">{sl.description}</p>
                                   </div>
                                 ))}
                               </div>
                             ) : null}
                           </div>
                           {/* Controls */}
                           {canRotate && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button onClick={rsaPrev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft className="w-4 h-4"/></button>
                              <button onClick={() => setPaused(!paused)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">{paused ? <Play className="w-4 h-4 ml-0.5"/> : <Pause className="w-4 h-4"/>}</button>
                              <button onClick={rsaNext} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                           )}
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
                             companyLogo={companyLogo}
                           />
                           {canRotate && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button onClick={pmaxPrev} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronLeft className="w-4 h-4"/></button>
                              <button onClick={() => setPaused(!paused)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">{paused ? <Play className="w-4 h-4 ml-0.5"/> : <Pause className="w-4 h-4"/>}</button>
                              <button onClick={pmaxNext} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><ChevronRight className="w-4 h-4"/></button>
                            </div>
                           )}
                         </div>
                       );
                     }

                     return null;
                  })()}
                </div>
              </div>

              {/* Right: Info/Edit */}
              <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 space-y-6 bg-white">
                {!readOnly && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-6">Configurações Gerais</h4>
                    <div className="grid gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold text-gray-400">Nome do Criativo</label>
                         <EditableField
                           value={working.name || ""}
                           onChange={(v) => updateDraft({ name: v } as any)}
                           placeholder="Ex: Awareness - Feed"
                           editMode={editMode}
                           readOnly={readOnly}
                         />
                      </div>
                    </div>
                  </div>
                )}

                {isSearchAd ? (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Títulos (Headlines)</h4>
                      <EditableList
                        items={working.headlines || []}
                        onChange={(headlines) => updateDraft({ headlines })}
                        activeIndices={activeIndices}
                        activeLabel="Slot "
                        maxLength={30}
                        editMode={editMode}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Descrições</h4>
                      <EditableList
                        items={working.bodies || []}
                        onChange={(bodies) => updateDraft({ bodies })}
                        activeIndices={[bodyIndex]}
                        activeColor="border-emerald-200 bg-emerald-50/30"
                        activeLabel="Ativa "
                        maxLength={90}
                        editMode={editMode}
                        readOnly={readOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Chamada para Ação (CTA)</label>
                      <EditableField
                        value={working.cta || ""}
                        onChange={(v) => updateDraft({ cta: v })}
                        placeholder="Ex: Saiba Mais"
                        editMode={editMode}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                ) : isPMax ? (
                    <div className="space-y-8">
                    {!readOnly && (
                      <div>
                        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Ativos Visuais</h4>
                        <div className="grid gap-6">
                           <EditableImageList
                             label="Imagens"
                             images={working.images || []}
                             onChange={(images) => updateDraft({ images })}
                             focalPoints={working.imageFocalPoints}
                             onFocalChange={(url, pt) => updateDraft({ imageFocalPoints: { ...(working.imageFocalPoints || {}), [url]: pt } })}
                             readOnly={readOnly}
                           />
                           <EditableImageList
                             label="Logos"
                             images={working.logos || []}
                             onChange={(logos) => updateDraft({ logos })}
                             readOnly={readOnly}
                           />
                           <EditableVideoList
                             videos={working.videos || []}
                             onChange={(videos) => updateDraft({ videos })}
                             readOnly={readOnly}
                           />
                        </div>
                      </div>
                    )}
                       <div>
                         <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Textos</h4>
                         <div className="grid gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Títulos Curtos (30 carac.)</label>
                              <EditableList
                                items={working.headlines || []}
                                onChange={(headlines) => updateDraft({ headlines })}
                                activeIndices={pmaxHIndices}
                                activeLabel="Ativo "
                                maxLength={30}
                                editMode={editMode}
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Títulos Longos (90 carac.)</label>
                              <EditableList
                                items={working.longHeadlines || []}
                                 activeIndices={[pmaxLongH.length > 0 ? n % pmaxLongH.length : 0]}
                                 activeLabel="Ativa "
                                 activeColor="border-violet-200 bg-violet-50/30"
                                onChange={(longHeadlines) => updateDraft({ longHeadlines })}
                                maxLength={90}
                                editMode={editMode}
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Descrições (90 carac.)</label>
                              <EditableList
                                items={working.bodies || []}
                                 activeIndices={[pmaxBodies.length > 0 ? n % pmaxBodies.length : 0]}
                                 activeLabel="Ativa "
                                 activeColor="border-emerald-200 bg-emerald-50/30"
                                onChange={(bodies) => updateDraft({ bodies })}
                                maxLength={90}
                                editMode={editMode}
                                readOnly={readOnly}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Chamada para Ação (CTA)</label>
                              <EditableField
                                value={working.cta || ""}
                                onChange={(v) => updateDraft({ cta: v })}
                                placeholder="Ex: Saiba Mais"
                                editMode={editMode}
                                readOnly={readOnly}
                              />
                            </div>
                         </div>
                       </div>
                    </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Título</label>
                      <EditableField value={working.headline || ""} onChange={(v) => updateDraft({ headline: v })} editMode={editMode} readOnly={readOnly} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Texto Principal</label>
                      <EditableField value={working.body || working.primaryText || ""} onChange={(v) => updateDraft({ body: v })} multiline editMode={editMode} readOnly={readOnly} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Chamada para Ação (CTA)</label>
                      <EditableField value={working.cta || ""} onChange={(v) => updateDraft({ cta: v })} placeholder="Ex: Saiba Mais" editMode={editMode} readOnly={readOnly} />
                    </div>
                    {!readOnly && (
                      working.format === "Carousel" ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold text-gray-400">Cards do Carrossel ({working.carouselCards?.length || 0})</label>
                            <button onClick={() => updateDraft({ carouselCards: [...(working.carouselCards || []), { id: uid(), imageUrl: "", headline: "" }] })} className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">+ Adicionar Card</button>
                          </div>
                          <div className="grid gap-3">
                            {(working.carouselCards || []).map((card, idx) => (
                              <div key={idx} className={`p-3 rounded-xl border transition-all ${carouselIdx === idx ? "border-blue-200 bg-blue-50/30 shadow-sm" : "bg-gray-50 border-gray-100"}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Card {idx + 1}</span>
                                    {carouselIdx === idx && <span className="text-[8px] bg-blue-500 text-white px-1 rounded uppercase font-bold">Ativo</span>}
                                  </div>
                                  <button onClick={() => updateDraft({ carouselCards: working.carouselCards?.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600"><X className="w-3 h-3"/></button>
                                </div>
                                <div className="space-y-2">
                                  <input type="text" value={card.imageUrl} onChange={(e) => {
                                    const cards = [...(working.carouselCards || [])];
                                    cards[idx] = { ...card, imageUrl: e.target.value };
                                    updateDraft({ carouselCards: cards });
                                  }} className="w-full text-xs font-mono p-2 border rounded" placeholder="URL da Imagem" disabled={readOnly} />
                                  <input type="text" value={card.headline} onChange={(e) => {
                                    const cards = [...(working.carouselCards || [])];
                                    cards[idx] = { ...card, headline: e.target.value };
                                    updateDraft({ carouselCards: cards });
                                  }} className="w-full text-xs font-bold p-2 border rounded" placeholder="Título do Card" disabled={readOnly} />
                                </div>
                              </div>
                            ))}
                            {working.carouselCards?.length === 0 && (
                              <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 text-xs italic">Nenhum card adicionado</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <EditableVideoList 
                            videos={working.videos || []} 
                            onChange={(vids) => {
                              updateDraft({ 
                                videos: vids,
                                format: vids.length > 0 ? "Video" : "Image"
                              } as any);
                            }} 
                            readOnly={readOnly} 
                          />
                          <EditableImageList 
                            label="Imagens / Thumbnails" 
                            images={working.images || (working.image ? [working.image] : [])} 
                            onChange={(imgs) => updateDraft({ images: imgs, image: imgs[0] })} 
                            readOnly={readOnly} 
                          />
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Internal Meta Preview Helper ─────────────────────────────────────────────

const MetaPreviewBody = React.memo(function MetaPreviewBody({ placement, creative, companyName, companyLogo, imgIdx, carouselIdx, onPrev, onNext, totalItems }: any) {
  const isCarousel = creative.format === "Carousel";
  const currentCard = isCarousel ? creative.carouselCards[carouselIdx] : null;
  const images = creative.videos?.length
    ? creative.videos
    : creative.images?.length
    ? creative.images
    : creative.imageUrl
    ? [creative.imageUrl]
    : [];
  const src = isCarousel ? currentCard?.imageUrl : images[imgIdx];
  const normalized = useMemo(() => normalizeMediaUrl(src || ""), [src]);
  const [muted, setMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isYT = getYouTubeId(src || "");
  const isDirectVideo = isDirectVideoUrl(src || "");
  const isVideo = creative.format !== "Image" && (isDirectVideo || !!isYT);
  
  const primaryText = creative.primaryText || creative.body || "";
  const needsTruncation = primaryText.length > 120;

  useEffect(() => {
    if (placement === "reels" && totalItems > 1) {
      const timer = setInterval(() => {
        onNext();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [placement, totalItems, onNext]);

  const Nav = () => (totalItems > 1 && placement !== "reels") ? (
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none z-10 transition-opacity opacity-0 group-hover:opacity-100">
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center pointer-events-auto hover:bg-white transition-colors"><ChevronLeft className="w-5 h-5 text-gray-700"/></button>
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center pointer-events-auto hover:bg-white transition-colors"><ChevronRight className="w-5 h-5 text-gray-700"/></button>
    </div>
  ) : null;

  const renderStories = () => (
    <div className="relative overflow-hidden bg-black group" style={{ aspectRatio: "9 / 16" }}>
      <Media isYT={isYT} isDirectVideo={isDirectVideo} normalized={normalized} muted={muted} src={src} isReels={false} />
      <Nav />
      {isVideo && isDirectVideo && (
        <button onClick={() => setMuted(!muted)} className="absolute bottom-20 right-3 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          {muted ? <VolumeX className="w-4 h-4 text-white"/> : <Volume2 className="w-4 h-4 text-white"/>}
        </button>
      )}
      <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
        <div className="flex gap-1 mb-2">
          {Array.from({ length: totalItems }).map((_, i) => (
            <div key={i} className={`flex-1 h-[2px] rounded-full transition-colors ${i <= imgIdx ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
            <Globe className="w-3.5 h-3.5 text-white/40" />
            {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">{companyName}</p>
            <p className="text-[9px] text-white/60 mt-0.5">Patrocinado</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent z-20 pointer-events-none flex flex-col items-center gap-2">
        <p className="text-[11px] text-white font-semibold text-center line-clamp-2 drop-shadow">
          {isCarousel ? currentCard?.headline : creative.headline}
        </p>
        <div className="flex flex-col items-center gap-1">
          <div className="w-px h-3 bg-white/60" />
          <p className="text-[10px] text-white font-bold uppercase tracking-wide">{creative.cta}</p>
        </div>
      </div>
    </div>
  );

  const renderReels = () => (
    <div className="relative overflow-hidden bg-black" style={{ aspectRatio: "9 / 16" }}>
      <Media isYT={isYT} isDirectVideo={isDirectVideo} normalized={normalized} muted={muted} src={src} isReels={true} />
      <Nav />
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-20 pointer-events-none">
        {["♥", "💬", "↗"].map((icon, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-[13px]">{icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 inset-x-0 px-3 pb-4 pt-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20 pointer-events-none">
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0 relative">
                <Globe className="w-2.5 h-2.5 text-white/40" />
                {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" />}
              </div>
              <span className="text-[10px] font-bold text-white">{companyName}</span>
              <span className="text-[9px] text-white/50">· Patrocinado</span>
            </div>
            <p className="text-[11px] text-white line-clamp-2 leading-snug whitespace-pre-wrap">{creative.primaryText || creative.body}</p>
          </div>
        </div>
        <div className="mt-2.5 flex justify-center">
          <div className="px-5 py-1.5 bg-white/15 border border-white/30 backdrop-blur-sm rounded-full">
            <span className="text-[11px] font-bold text-white">{creative.cta}</span>
          </div>
        </div>
      </div>
      {isVideo && isDirectVideo && (
        <button onClick={() => setMuted(!muted)} className="absolute bottom-4 right-3 z-30 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          {muted ? <VolumeX className="w-4 h-4 text-white"/> : <Volume2 className="w-4 h-4 text-white"/>}
        </button>
      )}
    </div>
  );

  const renderFeed = () => (
    <div className="flex flex-col group">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
            <Globe className="w-4 h-4 text-slate-300" />
            {companyLogo && <img src={normalizeMediaUrl(companyLogo)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }} />}
          </div>
          <div>
            <p className="text-[12px] font-bold text-gray-900 leading-none">{companyName}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Patrocinado · <span className="text-gray-300">🌐</span></p>
          </div>
        </div>
        <div className="flex gap-[3px]">
          <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
          <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
          <div className="w-[3px] h-[3px] rounded-full bg-gray-300" />
        </div>
      </div>
      <div className="px-3 pb-2">
        <p className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
          {isExpanded || !needsTruncation 
            ? primaryText 
            : `${primaryText.trimEnd().substring(0, 95)}...`}
          {!isExpanded && needsTruncation && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} 
              className="ml-0.5 text-gray-500 font-semibold hover:text-gray-700 hover:underline text-[12px]"
            >
              Ver mais
            </button>
          )}
        </p>
      </div>
      <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: "4 / 5" }}>
        <Media isYT={isYT} isDirectVideo={isDirectVideo} normalized={normalized} muted={muted} src={src} isReels={false} />
        <Nav />
        {isVideo && isDirectVideo && (
          <button onClick={() => setMuted(!muted)} className="absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
            {muted ? <VolumeX className="w-4 h-4 text-white"/> : <Volume2 className="w-4 h-4 text-white"/>}
          </button>
        )}
      </div>
      <div className="px-3 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-gray-400 uppercase tracking-tight truncate">{creative.displayLink || "www.site.com"}</p>
          <p className="text-[12px] font-bold text-gray-900 leading-snug truncate">
            {(isCarousel ? currentCard?.headline : creative.headline) || creative.headline}
          </p>
        </div>
        <div className="px-3 py-1.5 bg-gray-200 rounded-md shrink-0">
          <span className="text-[11px] font-bold text-gray-700">{creative.cta}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xl">
      {placement === "stories" ? renderStories() : placement === "reels" ? renderReels() : renderFeed()}
    </div>
  );
});

const Media = ({ 
  isYT, 
  isDirectVideo, 
  normalized, 
  muted, 
  src, 
  isReels = false 
}: { 
  isYT: string | null; 
  isDirectVideo: boolean; 
  normalized: string; 
  muted: boolean; 
  src: string; 
  isReels?: boolean;
}) => {
  const isCached = loadedMediaCache.has(normalized);
  const [hasFirstFrame, setHasFirstFrame] = useState(isCached);
  const [isBuffering, setIsBuffering] = useState(!isCached);

  useEffect(() => {
    if (loadedMediaCache.has(normalized)) {
      setHasFirstFrame(true);
      setIsBuffering(false);
    } else {
      setHasFirstFrame(false);
      setIsBuffering(true);
    }
  }, [normalized]);

  if (isYT) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${isYT}?autoplay=1&mute=1&controls=0&loop=1&playlist=${isYT}`}
        className="w-full h-full border-0 pointer-events-none bg-black"
        allow="autoplay; encrypted-media"
      />
    );
  }
  if (isDirectVideo) {
    return (
      <>
        {(isBuffering || !hasFirstFrame) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all duration-300">
            <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-transparent animate-spin" />
          </div>
        )}
        <video
          src={normalized}
          className="w-full h-full object-cover bg-black/10 relative z-0"
          muted={muted}
          autoPlay
          loop
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          onLoadedData={() => {
            loadedMediaCache.add(normalized);
            setHasFirstFrame(true);
          }}
          onCanPlay={() => {
            loadedMediaCache.add(normalized);
            setIsBuffering(false);
          }}
          onPlaying={() => {
            loadedMediaCache.add(normalized);
            setIsBuffering(false);
          }}
          onWaiting={() => setIsBuffering(true)}
          style={{ opacity: hasFirstFrame ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      </>
    );
  }
  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={src}
          initial={isReels ? { x: "100%", opacity: 1 } : { opacity: 0 }}
          animate={isReels ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          exit={isReels ? { x: "-100%", opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 w-full h-full overflow-hidden"
        >
          <ImageWithSkeleton
            src={normalized}
            className={`w-full h-full object-cover ${isReels ? "animate-ken-burns" : ""}`}
            skeletonBg="bg-slate-800"
            spinnerBorder="border-slate-600"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function nextCarousel(curr: number, total: number) { return total > 0 ? (curr + 1) % total : 0; }
function prevCarousel(curr: number, total: number) { return total > 0 ? (curr - 1 + total) % total : 0; }
