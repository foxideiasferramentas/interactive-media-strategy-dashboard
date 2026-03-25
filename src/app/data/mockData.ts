import type { Client, Campaign } from "./types";

export const seedClients: Client[] = [
  {
    id: "client-1",
    name: "Empresa de Tecnologia Alpha",
    company: "Alpha Tech Solutions",
    color: "#2563eb",
    activeCampaigns: 1,
    briefing:
      "Empresa focada em soluções SaaS para pequenas e médias empresas. O objetivo principal é acelerar a transformação digital através de uma interface intuitiva. Público-alvo: CEOs e gestores de TI.",
  },
  {
    id: "client-2",
    name: "Varejo Moderno",
    company: "Modern Retail S.A.",
    color: "#10b981",
    activeCampaigns: 0,
    briefing:
      "Iniciando expansão para o e-commerce nacional. Necessidade de posicionamento premium com foco em conversão direta e fidelização de clientes recorrentes.",
  },
];

export const seedCampaigns: Campaign[] = [
  {
    id: "camp-1",
    clientId: "client-1",
    name: "Lançamento Software Gestão Q1",
    status: "active",
    budget: 15000,
    budgetAllocation: {
      metaPercent: 65,
      googlePercent: 35,
    },
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    objectives: {
      roas: "4×",
      leads: "200+",
      reach: "500K",
      cac: "−30%",
    },
    funnel: {
      top: {
        subtitle: "Conscientização",
        description:
          "Alcançar novos públicos com mensagens de descoberta e construção de marca. Campanhas de awareness em larga escala.",
        metricValue: "500K",
        metricUnit: "impressões/mês",
        channels: ["Meta Ads · Feed & Reels", "Google Ads · Display & YouTube"],
      },
      middle: {
        subtitle: "Consideração",
        description:
          "Nutrir o interesse de quem já interagiu com a marca. Estratégias de remarketing e conteúdos educativos.",
        metricValue: "15K",
        metricUnit: "visitantes/mês",
        channels: ["Meta Ads · Carousel & Video", "Google Ads · Search & RLSA"],
      },
      bottom: {
        subtitle: "Conversão",
        description:
          "Converter leads qualificados com ofertas direcionadas e provas sociais. Foco em público quente.",
        metricValue: "200",
        metricUnit: "conversões/mês",
        channels: [
          "Meta Ads · Stories & Oferta",
          "Google Ads · Branded & Retargeting",
        ],
      },
    },
    meta: {
      top: [
        {
          id: "meta-top-1",
          title: "Público Amplo por Interesses",
          description:
            "Segmentação por interesses relacionados ao setor, alcançando usuários que demonstram afinidade com temas relevantes.",
          tag: "Frio · Alta escala",
          creatives: [
            {
              id: "mc-1",
              name: "Feed Principal - Awareness",
              format: "Image",
              imageUrl:
                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
              headline: "Transforme a gestão do seu negócio",
              primaryText:
                "Descubra como empresas líderes estão otimizando processos e aumentando produtividade em até 40%. Conheça soluções inovadoras que fazem a diferença.",
              cta: "Saiba Mais",
            },
          ],
        },
        {
          id: "meta-top-2",
          title: "Lookalike 1–3%",
          description:
            "Expansão baseada em características de clientes existentes, focando em perfis similares aos melhores compradores.",
          tag: "Prospecting",
          creatives: [
            {
              id: "mc-2",
              name: "Stories - Lookalike",
              format: "Video",
              imageUrl:
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
              headline: "Produtividade que Inspira",
              primaryText:
                "Trabalhe de forma mais inteligente. Tecnologia que se adapta ao seu ritmo e impulsiona resultados de forma mensurável.",
              cta: "Conheça",
            },
          ],
        },
        {
          id: "meta-top-3",
          title: "Segmentação Demográfica",
          description:
            "Filtros de idade, localização e comportamentos online para descoberta de marca em públicos amplos.",
          tag: "Broadband",
          creatives: [
            {
              id: "mc-3",
              name: "Reels - Demográfico",
              format: "Video",
              imageUrl:
                "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
              headline: "O futuro do trabalho colaborativo",
              primaryText:
                "Veja como equipes de alta performance estão revolucionando a forma de trabalhar. Inovação que conecta pessoas e resultados.",
              cta: "Ver Demo",
            },
          ],
        },
      ],
      middle: [
        {
          id: "meta-mid-1",
          title: "Engajamento com Conteúdo",
          description:
            "Remarketing para usuários que interagiram com posts, vídeos ou visitaram o perfil nos últimos 30 dias.",
          tag: "Morno · Remarketing",
          creatives: [
            {
              id: "mc-4",
              name: "Carrossel - Engajados",
              format: "Carousel",
              imageUrl:
                "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
              headline: "Explore os principais recursos",
              primaryText:
                "Você demonstrou interesse. Agora descubra como nossa solução resolve desafios reais do seu dia a dia.",
              cta: "Explorar Recursos",
            },
          ],
        },
        {
          id: "meta-mid-2",
          title: "Visitantes do Site (30 dias)",
          description:
            "Segmento de usuários que visitaram o site mas não converteram, com mensagens específicas para reengajamento.",
          tag: "Site Visitors",
          creatives: [
            {
              id: "mc-5",
              name: "Vídeo - Visitantes",
              format: "Video",
              imageUrl:
                "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
              headline: "Case de sucesso: +40% produtividade",
              primaryText:
                "Veja como empresas como a sua alcançaram resultados expressivos. Depoimentos reais de clientes.",
              cta: "Ver Cases",
            },
          ],
        },
        {
          id: "meta-mid-3",
          title: "Lookalike de Engajados",
          description:
            "Lookalike baseado em usuários que demonstraram interesse ativo através de interações e tempo de visualização.",
          tag: "Expansão qualificada",
          creatives: [
            {
              id: "mc-6",
              name: "Stories - Lookalike Engajados",
              format: "Image",
              imageUrl:
                "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
              headline: "Por que escolher nossa plataforma?",
              primaryText:
                "Compare os benefícios e entenda por que milhares de profissionais estão migrando para a nossa solução.",
              cta: "Saiba Mais",
            },
          ],
        },
      ],
      bottom: [
        {
          id: "meta-bot-1",
          title: "Carrinho Abandonado",
          description:
            "Usuários que iniciaram processo de compra mas não concluíram, com ofertas específicas de conversão.",
          tag: "Quente · Alta intenção",
          creatives: [
            {
              id: "mc-7",
              name: "Feed - Oferta Exclusiva",
              format: "Image",
              imageUrl:
                "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
              headline: "Última chance: Oferta especial para você",
              primaryText:
                "Notamos seu interesse. Garanta condições exclusivas válidas apenas hoje. Suporte completo + onboarding gratuito inclusos.",
              cta: "Aproveitar Oferta",
            },
          ],
        },
        {
          id: "meta-bot-2",
          title: "Visualizaram Produto / Pricing",
          description:
            "Segmento quente que acessou páginas de produto ou pricing, demonstrando alta intenção de compra.",
          tag: "High Intent",
          creatives: [
            {
              id: "mc-8",
              name: "Stories - Urgência",
              format: "Video",
              imageUrl:
                "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
              headline: "Comece hoje sem compromisso",
              primaryText:
                "14 dias de teste grátis. Sem cartão de crédito. Cancele quando quiser. Junte-se a mais de 5.000 empresas.",
              cta: "Começar Agora",
            },
          ],
        },
        {
          id: "meta-bot-3",
          title: "Engajados com CTAs",
          description:
            "Remarketing direcionado para quem clicou em CTAs de conversão mas não completou a ação desejada.",
          tag: "Retargeting direto",
          creatives: [
            {
              id: "mc-9",
              name: "Reels - Conversão Final",
              format: "Video",
              imageUrl:
                "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80",
              headline: "Não deixe para depois",
              primaryText:
                "Finalize seu cadastro agora e ganhe acesso imediato ao bônus exclusivo de implementação rápida.",
              cta: "Concluir Cadastro",
            },
          ],
        },
      ],
    },
    google: {
      top: [
        {
          id: "google-top-1",
          title: "Termos Genéricos – Awareness",
          description:
            "Palavras-chave amplas relacionadas ao setor, capturando usuários em fase inicial de pesquisa.",
          tag: "Search · Ampla",
          creatives: [
            {
              id: "gc-1",
              name: "RSA - Genérico",
              format: "Search",
              headline: "Software de Gestão Empresarial | Aumente Produtividade",
              description:
                "Soluções completas para otimizar processos. Usado por 5.000+ empresas. Teste gratuito disponível.",
              headlines: [
                "Software de Gestão Empresarial",
                "Aumente sua Produtividade Hoje",
                "Gestão 360° para sua Empresa",
                "Automação Inteligente de Processos",
              ],
              descriptions: [
                "Soluções completas para otimizar processos empresariais. Usado por 5.000+ empresas.",
                "Teste gratuito disponível por 14 dias. Suporte 24/7 incluído para sua equipe.",
                "Ganhe eficiência operacional com nossa tecnologia. Implementação rápida.",
              ],
            },
          ],
        },
        {
          id: "google-top-2",
          title: "Display por Interesses",
          description:
            "Banners em sites parceiros da GDN segmentados por interesses e tópicos relevantes.",
          tag: "Display · GDN",
          creatives: [
            {
              id: "gc-2",
              name: "Banner Responsivo - Display",
              format: "Display",
              imageUrl:
                "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80",
              headline: "Transforme sua Gestão Empresarial",
              description:
                "Descubra como automatizar processos e ganhar eficiência. Tecnologia de ponta ao alcance do seu negócio.",
            },
          ],
        },
        {
          id: "google-top-3",
          title: "YouTube In-Stream",
          description:
            "Vídeos publicitários em conteúdos relacionados ao nicho, gerando conscientização via storytelling.",
          tag: "YouTube · Vídeo",
          creatives: [
            {
              id: "gc-3",
              name: "YouTube Shorts - Demo",
              format: "YouTube",
              imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80",
              videos: ["https://www.youtube.com/shorts/565-Nq_C2_k"],
              headline: "Veja como funciona na prática",
              description: "O software de gestão que cabe no seu bolso e no seu tempo.",
            },
          ],
        },
      ],
      middle: [
        {
          id: "google-mid-1",
          title: "Palavras-chave de Solução",
          description:
            "Termos de média intenção que indicam interesse em comparar soluções e avaliar fornecedores.",
          tag: "Search · Solução",
          creatives: [
            {
              id: "gc-4",
              name: "RSA - Consideração",
              format: "Search",
              headline: "Compare as Melhores Soluções de ERP",
              description:
                "Veja por que somos a escolha #1 entre PMEs. Teste grátis por 14 dias.",
              headlines: [
                "Melhor ERP para sua Empresa",
                "Compare e Escolha o Ideal",
                "Software Premiado de Gestão",
              ],
              descriptions: [
                "Avaliação gratuita sem compromisso. Implantação rápida e suporte dedicado.",
                "Mais de 5.000 empresas confiam na nossa solução. Veja cases de sucesso.",
              ],
            },
          ],
        },
        {
          id: "google-mid-2",
          title: "Remarketing Site (RLSA)",
          description:
            "Visitantes do site reimpactados em campanhas de busca com lances ajustados.",
          tag: "RLSA · Remarketing",
          creatives: [
            {
              id: "gc-5",
              name: "RSA - Remarketing",
              format: "Search",
              headline: "Retome onde Parou",
              description:
                "Você pesquisou recentemente. Aproveite nossa oferta especial de implementação.",
              headlines: [
                "Continue sua Avaliação Gratuita",
                "Oferta Exclusiva para Você",
              ],
              descriptions: [
                "Retome o processo de avaliação com suporte especializado.",
                "Condições especiais disponíveis. Fale com um consultor hoje.",
              ],
            },
          ],
        },
        {
          id: "google-mid-4",
          title: "Performance Max - Retargeting",
          description: "Campanha multicanal (Busca, Display, YouTube) para reimpactar visitantes.",
          tag: "PMax · Omnicanal",
          creatives: [
            {
              id: "gc-pmax-1",
              name: "PMax Retargeting",
              format: "PMax",
              headlines: ["Volte para o Alpha Tech", "Sua Gestão em Outro Nível", "Teste Grátis por 14 Dias"],
              longHeadlines: ["Transforme a eficiência da sua empresa hoje mesmo", "A solução definitiva em gestão empresarial"],
              descriptions: ["Recupere o controle da sua produtividade com nossa plataforma completa.", "Mais de 5.000 empresas já migraram. Venha você também."],
              images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"],
              videos: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
              businessName: "Alpha Tech Pro",
              finalUrl: "https://alphatech.com/br/retargeting"
            }
          ]
        }
      ],
      bottom: [
        {
          id: "google-bot-1",
          title: "Branded Keywords",
          description:
            "Termos de marca e variações para capturar usuários com alta intenção de compra.",
          tag: "Branded · Alta intenção",
          creatives: [
            {
              id: "gc-7",
              name: "RSA - Branded",
              format: "Search",
              headline: "Software Alpha Tech – Acesso Oficial",
              description:
                "Solução completa de gestão. Comece hoje com 14 dias grátis.",
              headlines: [
                "Alpha Tech – Site Oficial",
                "Comece Agora Gratuitamente",
                "Seu ERP Alpha Tech",
              ],
              descriptions: [
                "Acesso imediato. Suporte completo desde o primeiro dia.",
                "Melhor custo-benefício do mercado. Cancele quando quiser.",
              ],
            },
          ],
        },
        {
          id: "google-bot-2",
          title: "Concorrentes",
          description:
            "Campanhas direcionadas a usuários que pesquisam concorrentes diretos.",
          tag: "Conquista · Concorrentes",
          creatives: [
            {
              id: "gc-8",
              name: "RSA - Concorrência",
              format: "Search",
              headline: "Alternativa Superior ao [Concorrente]",
              description:
                "Mais funcionalidades pelo mesmo preço. Migração assistida e gratuita.",
              headlines: [
                "Melhor que o Concorrente",
                "Migração Grátis e Assistida",
                "Teste Comparativo Gratuito",
              ],
              descriptions: [
                "Compare funcionalidades e veja por que somos a escolha inteligente.",
                "Migração sem custo com suporte especializado. Mais por menos.",
              ],
            },
          ],
        },
        {
          id: "google-bot-3",
          title: "Retargeting Conversão",
          description:
            "Remarketing de alta frequência para usuários que visitaram a página de preços.",
          tag: "Retargeting · Conversão",
          creatives: [
            {
              id: "gc-9",
              name: "Display - Conversão Final",
              format: "Display",
              imageUrl:
                "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
              headline: "Última chance de garantir sua vaga",
              description:
                "Oferta exclusiva disponível por tempo limitado. Garanta agora.",
            },
          ],
        },
      ],
    },
  },
];
