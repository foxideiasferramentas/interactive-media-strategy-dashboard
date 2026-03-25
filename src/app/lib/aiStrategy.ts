import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Campaign, Client } from "../data/types";

// ─── Key + model storage ──────────────────────────────────────────────────────

const GEMINI_KEY = "fx_gemini_key";
const GEMINI_MODEL = "fx_gemini_model";

export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY) ?? "";
}

export function saveGeminiKey(key: string): void {
  localStorage.setItem(GEMINI_KEY, key);
}

export function getGeminiModel(): string {
  return localStorage.getItem(GEMINI_MODEL) ?? "gemini-2.5-flash";
}

// default kept in sync with first item in GEMINI_MODELS

export function saveGeminiModel(model: string): void {
  localStorage.setItem(GEMINI_MODEL, model);
}

// ─── Available models ─────────────────────────────────────────────────────────

export interface GeminiModelOption {
  id: string;
  label: string;
  description: string;
  free: boolean;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Mais recente. Melhor raciocínio e qualidade de resposta.",
    free: true,
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    description: "Versão compacta do 2.5. Mais veloz, mantém boa qualidade.",
    free: true,
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Rápido, multimodal, ótimo custo-benefício.",
    free: true,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash Lite",
    description: "Versão mais leve e veloz. Ideal para testes rápidos.",
    free: true,
  },
  {
    id: "gemini-1.5-flash-latest",
    label: "Gemini 1.5 Flash",
    description: "Equilibrado, confiável para tarefas de texto longas.",
    free: true,
  },
  {
    id: "gemini-1.5-flash-8b-latest",
    label: "Gemini 1.5 Flash 8B",
    description: "Modelo compacto e muito rápido.",
    free: true,
  },
  {
    id: "gemini-1.5-pro-latest",
    label: "Gemini 1.5 Pro",
    description: "Melhor raciocínio e qualidade. Limite gratuito reduzido.",
    free: false,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIStrategyInput {
  client: Client;
  budget: number;
  startDate: string;
  endDate: string;
  instructions: string;
  apiKey: string;
  model?: string;
}

export type AIStrategyResult = Omit<Campaign, "id" | "clientId" | "status">;

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um especialista sênior em estratégia de mídia digital e performance marketing.
Sua tarefa é gerar uma estratégia completa de campanha com públicos-alvo detalhados e copies persuasivos.

REGRAS OBRIGATÓRIAS:
- Responda APENAS com JSON válido, sem markdown, sem texto extra.
- Escreva tudo em português brasileiro.
- Copies devem ser específicos ao negócio do cliente, não genéricos.
- Para criativos Meta (Image/Video/Carousel): use "headline" e "primaryText".
- Para criativos Google Search: use "headlines" (array de 3-5 strings) e "descriptions" (array de 2-3 strings).
- Para criativos Google Display/YouTube/Discovery: use "headline" e "description" (strings únicas).
- Sempre deixe "imageUrl" e "videoUrl" como string vazia "".
- metaPercent + googlePercent devem somar 100.
- Gere IDs únicos usando prefixos: "m-t-1" (meta topo público 1), "mc-t-1-1" (meta criativo), "g-t-1" (google topo), "gc-t-1-1" (google criativo).

SCHEMA JSON ESPERADO:
{
  "name": "string — nome criativo da campanha",
  "budgetAllocation": { "metaPercent": number, "googlePercent": number },
  "objectives": { "roas": "string", "leads": "string", "reach": "string", "cac": "string" },
  "funnel": {
    "top": { "subtitle": "string", "description": "string", "metricValue": "string", "metricUnit": "string", "channels": ["string"] },
    "middle": { "subtitle": "string", "description": "string", "metricValue": "string", "metricUnit": "string", "channels": ["string"] },
    "bottom": { "subtitle": "string", "description": "string", "metricValue": "string", "metricUnit": "string", "channels": ["string"] }
  },
  "meta": {
    "top": [
      {
        "id": "m-t-1", "title": "string", "description": "string", "tag": "string",
        "creatives": [
          { "id": "mc-t-1-1", "name": "string", "format": "Image", "imageUrl": "", "headline": "string", "primaryText": "string", "cta": "string" }
        ]
      }
    ],
    "middle": [ ... ],
    "bottom": [ ... ]
  },
  "google": {
    "top": [
      {
        "id": "g-t-1", "title": "string", "description": "string", "tag": "string",
        "creatives": [
          { "id": "gc-t-1-1", "name": "string", "format": "Search", "imageUrl": "", "headlines": ["string", "string", "string"], "descriptions": ["string", "string"] }
        ]
      }
    ],
    "middle": [ ... ],
    "bottom": [ ... ]
  }
}`;

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateStrategy(
  input: AIStrategyInput
): Promise<AIStrategyResult> {
  const genAI = new GoogleGenerativeAI(input.apiKey);

  const model = genAI.getGenerativeModel({
    model: input.model ?? getGeminiModel(),
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  const clientBriefing = input.client.briefing
    ? `Briefing: ${input.client.briefing}`
    : "Briefing: Não informado — use o nome e segmento da empresa para inferir o contexto.";

  const userPrompt = `Gere uma estratégia completa de mídia paga para:

CLIENTE: ${input.client.name}
EMPRESA: ${input.client.company}
${clientBriefing}

PARÂMETROS DA CAMPANHA:
- Budget mensal: R$ ${input.budget.toLocaleString("pt-BR")}
- Início: ${input.startDate}
- Término: ${input.endDate || "em aberto"}

ORIENTAÇÕES ADICIONAIS DO GESTOR:
${input.instructions || "Nenhuma orientação adicional fornecida."}

Gere:
- 2 a 3 públicos por etapa do funil (topo, meio, fundo) para Meta Ads
- 2 a 3 públicos por etapa do funil para Google Ads
- 2 criativos por público
- Copies detalhados, específicos e persuasivos para este cliente`;

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "A IA retornou uma resposta inválida. Tente novamente ou ajuste as instruções."
    );
  }

  return {
    name: String(parsed.name ?? "Campanha Gerada por IA"),
    budget: input.budget,
    startDate: input.startDate,
    endDate: input.endDate,
    budgetAllocation: parsed.budgetAllocation as AIStrategyResult["budgetAllocation"],
    objectives: parsed.objectives as AIStrategyResult["objectives"],
    funnel: parsed.funnel as AIStrategyResult["funnel"],
    meta: parsed.meta as AIStrategyResult["meta"],
    google: parsed.google as AIStrategyResult["google"],
  };
}
