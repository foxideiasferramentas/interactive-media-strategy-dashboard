// ─── Creatives ────────────────────────────────────────────────────────────────

export interface MetaCarouselCard {
  id: string;
  imageUrl: string;
  headline: string;
  description?: string;
  cta?: string;
}

export interface MetaCreative {
  id: string;
  name: string;
  format: "Image" | "Video" | "Carousel";
  imageUrl: string;
  headline: string;
  description?: string;
  primaryText: string;
  cta: string;
  displayLink?: string;
  carouselCards?: MetaCarouselCard[];
  primaryPlacement?: "Feed" | "Stories" | "Reels";
  imageFocalPoints?: Record<string, { x: number; y: number }>;
  images?: string[];
  videos?: string[];
  destinationIds?: string[];
}

export interface Sitelink {
  id: string;
  title: string;
  description: string;
}

export interface StructuredSnippet {
  id: string;
  header: string;
  values: string[];
}

export interface CallExtension {
  phone: string;
  country: string;
}

export interface GoogleCreative {
  id: string;
  name: string;
  format: "Search" | "Display" | "YouTube" | "Discovery" | "PMax";
  imageUrl?: string;
  videoUrl?: string;
  headline?: string;
  description?: string;
  headlines?: string[];
  descriptions?: string[];
  sitelinks?: Sitelink[];
  // PMax specific
  longHeadlines?: string[];
  images?: string[];
  logos?: string[];
  videos?: string[];
  businessName?: string;
  finalUrl?: string;
  imageFocalPoints?: Record<string, { x: number; y: number }>;
  destinationIds?: string[];
}

// ─── Sitelink Library ─────────────────────────────────────────────────────────

export interface SavedSitelinkSet {
  id: string;
  label: string;
  sitelinks: Sitelink[];
  savedAt: string;
}

// ─── Creative Library ─────────────────────────────────────────────────────────

export interface SavedCreative {
  id: string;
  label: string;
  platform: "meta" | "google";
  creative: MetaCreative | GoogleCreative;
  savedAt: string;
}

// ─── Audiences ────────────────────────────────────────────────────────────────

export interface MetaAudience {
  id: string;
  title: string;
  description: string;
  tag: string;
  creatives: MetaCreative[];
  showInFlow?: boolean;
  // Novos campos estruturados
  about?: string;
  gender?: string;
  ageRange?: string;
  interests?: string;
  keywords?: string;
}

export interface GoogleAudience {
  id: string;
  title: string;
  description: string;
  tag: string;
  creatives: GoogleCreative[];
  showInFlow?: boolean;
  // Novos campos estruturados
  about?: string;
  gender?: string;
  ageRange?: string;
  interests?: string;
  keywords?: string;
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export interface FunnelStage {
  subtitle: string;
  description: string;
  metricValue: string;
  metricUnit: string;
  channels: string[];
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface ConversionDestination {
  id: string;
  label: string;
  url: string;
  type?: "conversion" | "retargeting";
  event?: string; // ex: "Purchase", "Lead", "ViewContent"
  note?: string;
  parentId?: string; // Para criar a hierarquia/vínculo entre destinos
}

export interface Campaign {
  id: string;
  name: string;
  slug?: string;
  clientId: string;
  status: "active" | "paused" | "planning";
  budget: number;
  destinations?: ConversionDestination[];
  budgetAllocation: {
    metaPercent: number;
    googlePercent: number;
    metaBudget?: number;
    googleBudget?: number;
    metaEnabled?: boolean;
    googleEnabled?: boolean;
  };
  startDate: string;
  endDate: string;
  objectives: {
    roas: string;
    leads: string;
    reach: string;
    cac: string;
  };
  geo?: {
    coverage: string;
    expansion?: string;
  };
  funnel: {
    top: FunnelStage;
    middle: FunnelStage;
    bottom: FunnelStage;
  };
  meta: {
    top: MetaAudience[];
    middle: MetaAudience[];
    bottom: MetaAudience[];
  };
  google: {
    sitelinks?: Sitelink[];
    structuredSnippets?: StructuredSnippet[];
    callExtension?: CallExtension;
    top: GoogleAudience[];
    middle: GoogleAudience[];
    bottom: GoogleAudience[];
  };
}

export type StageKey = "top" | "middle" | "bottom";

// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  company: string;
  logo?: string;
  color: string;
  activeCampaigns: number;
  briefing?: string;
  website?: string;
}

// ─── Audience Library ─────────────────────────────────────────────────────────

export interface SavedAudience {
  id: string;
  label: string;
  type: "meta" | "google";
  audience: MetaAudience | GoogleAudience;
  savedAt: string;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string; // ISO string
}
