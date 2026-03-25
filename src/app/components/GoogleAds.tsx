import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Globe, Target, TrendingUp } from "lucide-react";
import type { ElementType } from "react";
import { FunnelSidebar } from "./FunnelSidebar";
import { CreativeCard } from "./CreativeCard";
import { CreativeModal, type Creative } from "./CreativeModal";
import { useStore } from "../data/store";
import type { GoogleAudience, GoogleCreative } from "../data/types";
import { getYouTubeId } from "../utils/youtube";

type FunnelStep = "top" | "middle" | "bottom";

// ─── Icon cycle per audience index ────────────────────────────────────────────

const ICONS: ElementType[] = [Search, Globe, Target, TrendingUp];
const iconFor = (i: number): ElementType => ICONS[i % ICONS.length];

// ─── Convert GoogleCreative → Creative (for CreativeCard/Modal) ───────────────

function toCreative(c: GoogleCreative): Creative {
  const isSearch = c.format === "Search";
  const isPMax = c.format === "PMax";
  
  // Create unified arrays with aggressive detection
  const allImages = [
    ...(c.images || []),
    ...([c.imageUrl].filter(img => img && !getYouTubeId(img))),
    ...(c.logos || [])
  ].filter(Boolean) as string[];

  const allVideos = [
    ...(c.videos || []),
    ...(c.videoUrl ? [c.videoUrl] : []),
    ...([c.imageUrl].filter(img => img && getYouTubeId(img))) // Catch YouTube links in image field
  ].filter(Boolean) as string[];
  
  return {
    id: c.id,
    format: isSearch ? `Search Ad · ${c.name}` : isPMax ? `Performance Max · ${c.name}` : `${c.format} · ${c.name}`,
    image: allVideos.length > 0 ? (allVideos[0]) : (allImages[0] || c.imageUrl || ""),
    headline: c.headline ?? c.headlines?.[0] ?? "",
    body: c.description ?? c.descriptions?.[0] ?? "",
    cta: "Saiba Mais",
    headlines: c.headlines || (c.headline ? [c.headline] : []),
    bodies: c.descriptions || (c.description ? [c.description] : []),
    sitelinks: c.sitelinks,
    longHeadlines: c.longHeadlines,
    images: allImages,
    videos: allVideos,
    businessName: c.businessName,
    finalUrl: c.finalUrl,
    imageFocalPoints: c.imageFocalPoints,
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
    <div className="bg-white rounded-xl border border-gray-100 px-8 py-16 text-center">
      <p className="text-gray-400 font-medium">
        Nenhum público cadastrado para o {labels[step]}.
      </p>
      <p className="text-sm text-gray-300 mt-1">
        Adicione públicos e criativos no Painel Admin → Editor de Estratégia.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function GoogleAds() {
  const { getActiveCampaign, getClient, updateCampaign } = useStore();
  const campaign = getActiveCampaign();
  const client = campaign ? getClient(campaign.clientId) : undefined;
  const companyName = client?.company;
  const companyUrl = client?.website;
  const companyLogo = client?.logo;

  const allSteps: FunnelStep[] = ["top", "middle", "bottom"];
  const filledSteps = allSteps.filter((s) => (campaign?.google[s]?.length ?? 0) > 0);
  const defaultStep = filledSteps[0] ?? "top";

  const [activeStep, setActiveStep] = useState<FunnelStep>(defaultStep);
  const [selectedAudienceIndex, setSelectedAudienceIndex] = useState(0);
  const [expandedAudienceIndex, setExpandedAudienceIndex] = useState<number | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  const handleSaveCreative = (updated: Creative) => {
    if (!campaign) return;
    const steps: FunnelStep[] = ["top", "middle", "bottom"];
    const newGoogle = { ...campaign.google };
    for (const step of steps) {
      newGoogle[step] = campaign.google[step].map((aud) => ({
        ...aud,
        creatives: aud.creatives.map((c) => {
          if (c.id !== updated.id) return c;
          return {
            ...c,
            headline: updated.headline,
            description: updated.body,
            headlines: updated.headlines,
            descriptions: updated.bodies,
            longHeadlines: updated.longHeadlines,
            businessName: updated.businessName,
            cta: updated.cta,
            imageUrl: updated.images?.[0] ?? updated.image ?? c.imageUrl,
            images: updated.images,
            logos: updated.logos,
            imageFocalPoints: updated.imageFocalPoints,
          };
        }),
      }));
    }
    updateCampaign({ ...campaign, google: newGoogle });
    setSelectedCreative(updated);
  };

  useEffect(() => {
    setSelectedAudienceIndex(0);
  }, [activeStep]);

  const colors = stepColors[activeStep];

  const audiences: GoogleAudience[] = campaign?.google[activeStep] ?? [];
  const funnelStage = campaign?.funnel[activeStep];
  const tagline = funnelStage?.subtitle ?? activeStep;
  const objective = funnelStage?.description ?? "";

  const selectedAudience = audiences[selectedAudienceIndex];

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 md:px-0">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-200 flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1
              className="text-gray-900"
              style={{ fontWeight: 700, fontSize: "1.4rem" }}
            >
              Google Ads
            </h1>
            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
              Search · Display · YouTube
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Captura de intenção por palavras-chave, rede de display e vídeo
          </p>
        </div>
      </div>

      {/* No campaign */}
      {!campaign && (
        <div className="bg-white rounded-xl border border-gray-100 px-8 py-16 text-center">
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
          <FunnelSidebar active={activeStep} onChange={setActiveStep} filledSteps={filledSteps.length > 0 ? filledSteps : undefined} />

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
                <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${colors.accent}`} />
                    <div>
                      <p className="text-gray-900 font-semibold">{tagline}</p>
                      {objective && (
                        <p className="text-sm text-gray-400">{objective}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audiences */}
                {audiences.length === 0 ? (
                  <EmptyState step={activeStep} />
                ) : (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 px-1">
                        Públicos-Alvo
                      </p>
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
                          />
                        ))}
                      </div>
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
                          <div className="flex items-center gap-2 mb-4">
                            <p className="text-xs uppercase tracking-widest text-gray-500">
                              Criativos para:
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-medium ${colors.badge}`}
                            >
                              {selectedAudience.title}
                            </span>
                          </div>

                          {selectedAudience.creatives.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                              Nenhum criativo cadastrado para este público.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                              {selectedAudience.creatives.map((creative, i) => {
                                const c = toCreative(creative);
                                return (
                                  <motion.div
                                    key={creative.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.05 + i * 0.05 }}
                                  >
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
        onSave={handleSaveCreative}
        companyName={companyName}
        companyUrl={companyUrl}
        companyLogo={companyLogo}
      />
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
  colors
}: {
  audience: GoogleAudience;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (expand: boolean) => void;
  onClick: () => void;
  colors: any;
}) {
  const hasDetails = !!(audience.gender || audience.ageRange || audience.interests || audience.keywords || (audience.description && audience.description.length > 80));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col ${
        isSelected
          ? colors.ring
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex-1">
        <h4 className="text-sm mb-1.5 text-gray-900 font-semibold">
          {audience.title}
        </h4>
        <p className={`text-xs leading-relaxed text-gray-500 ${!isExpanded ? "line-clamp-2" : ""}`}>
          {audience.description}
        </p>

        <AnimatePresence>
          {isExpanded && (audience.gender || audience.ageRange || audience.interests || audience.keywords) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1 overflow-hidden"
            >
              {audience.gender && (
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-50/50 text-blue-600 rounded-md font-medium">
                  {audience.gender}
                </span>
              )}
              {audience.ageRange && (
                <span className="text-[9px] px-1.5 py-0.5 bg-violet-50/50 text-violet-600 rounded-md font-medium">
                  {audience.ageRange}
                </span>
              )}
              {audience.interests && (
                <div className="w-full mt-1">
                  <p className="text-[8px] uppercase text-gray-400 font-bold mb-1">Interesses</p>
                  <p className="text-[10px] text-gray-600 leading-tight">{audience.interests}</p>
                </div>
              )}
              {audience.keywords && (
                <div className="w-full mt-1">
                  <p className="text-[8px] uppercase text-gray-400 font-bold mb-1">Keywords</p>
                  <p className="text-[10px] text-emerald-600 leading-tight">🔑 {audience.keywords}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hasDetails && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(!isExpanded); }}
          className="mt-3 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors self-start flex items-center gap-1"
        >
          {isExpanded ? "Ver menos" : "Ver detalhes"}
        </button>
      )}
    </motion.div>
  );
}
