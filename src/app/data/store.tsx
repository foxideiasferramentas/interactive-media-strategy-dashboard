import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Client,
  Campaign,
  ActivityLog,
  SavedAudience,
  MetaAudience,
  GoogleAudience,
  SavedSitelinkSet,
  Sitelink,
  SavedCreative,
  MetaCreative,
  GoogleCreative,
} from "./types";
import { supabase } from "./supabase";

// ─── Store interface ──────────────────────────────────────────────────────────

interface AppStore {
  // State
  clients: Client[];
  campaigns: Campaign[];
  activityLogs: ActivityLog[];
  activeCampaignId: string | null;
  savedAudiences: SavedAudience[];

  // Derived helpers
  getClient: (id: string) => Client | undefined;
  getCampaign: (id: string) => Campaign | undefined;
  getActiveCampaign: () => Campaign | undefined;

  // Client CRUD
  addClient: (data: Omit<Client, "id" | "activeCampaigns">) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  // Campaign CRUD
  addCampaign: (data: Omit<Campaign, "id">) => Campaign;
  updateCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;

  // Active campaign
  setActiveCampaignId: (id: string | null) => void;

  // Logs
  addLog: (action: string, target: string) => void;
  clearLogs: () => void;

  // Audience library
  saveAudience: (
    label: string,
    type: "meta" | "google",
    audience: MetaAudience | GoogleAudience
  ) => void;
  deleteSavedAudience: (id: string) => void;

  // Sitelink library
  savedSitelinkSets: SavedSitelinkSet[];
  saveSitelinkSet: (label: string, sitelinks: Sitelink[]) => void;
  deleteSavedSitelinkSet: (id: string) => void;

  // Creative library
  savedCreatives: SavedCreative[];
  saveCreative: (
    label: string,
    platform: "meta" | "google",
    creative: MetaCreative | GoogleCreative
  ) => void;
  deleteSavedCreative: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<AppStore | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeCampaignId, setActiveCampaignIdState] = useState<string | null>(
    null
  );
  const [savedAudiences, setSavedAudiences] = useState<SavedAudience[]>([]);
  const [savedSitelinkSets, setSavedSitelinkSets] = useState<
    SavedSitelinkSet[]
  >([]);
  const [savedCreatives, setSavedCreatives] = useState<SavedCreative[]>([]);

  // ── Boot: load from Supabase ──────────
  useEffect(() => {
    async function loadData() {
      try {
        const [
          { data: clientsData },
          { data: campaignsData },
          { data: logsData },
          { data: settingsData },
          { data: audiencesData },
          { data: sitelinksData },
          { data: creativesData },
        ] = await Promise.all([
          supabase.from("ims_clients").select("*"),
          supabase.from("ims_campaigns").select("*"),
          supabase
            .from("ims_logs")
            .select("*")
            .order("timestamp", { ascending: false })
            .limit(100),
          supabase.from("ims_settings").select("*"),
          supabase.from("ims_saved_audiences").select("*"),
          supabase.from("ims_saved_sitelink_sets").select("*"),
          supabase.from("ims_saved_creatives").select("*"),
        ]);

        if (clientsData) setClients(clientsData);
        if (campaignsData) setCampaigns(campaignsData);
        if (logsData) setActivityLogs(logsData);

        if (settingsData) {
          const activeIdRow = settingsData.find((r: any) => r.key === "activeId");
          setActiveCampaignIdState(activeIdRow ? activeIdRow.value : null);
        }

        if (audiencesData) setSavedAudiences(audiencesData);
        if (sitelinksData) setSavedSitelinkSets(sitelinksData);
        if (creativesData) setSavedCreatives(creativesData);
      } catch (err) {
        console.error("Failed to load from Supabase:", err);
      } finally {
        setLoaded(true);
      }
    }
    loadData();
  }, []);

  // ─── Log helper ─────────────────────────────────────────────────────────────

  const addLog = useCallback((action: string, target: string) => {
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      target,
      user: "Fox Admin",
      timestamp: new Date().toISOString(),
    };
    
    setActivityLogs((prev) => {
      const next = [log, ...prev].slice(0, 100);
      return next;
    });

    supabase.from("ims_logs").insert(log).then(({ error }) => {
      if (error) console.error("Error inserting log:", error);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setActivityLogs([]);
    supabase.from("ims_logs").delete().neq("id", "0").then(({ error }) => {
      if (error) console.error("Error clearing logs:", error);
    });
  }, []);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns]
  );

  const getActiveCampaign = useCallback(() => {
    if (activeCampaignId) {
      const found = campaigns.find((c) => c.id === activeCampaignId);
      if (found) return found;
    }
    return campaigns.find((c) => c.status === "active") ?? campaigns[0];
  }, [activeCampaignId, campaigns]);

  // ─── Client CRUD ────────────────────────────────────────────────────────────

  const addClient = useCallback(
    (data: Omit<Client, "id" | "activeCampaigns">) => {
      const client: Client = {
        ...data,
        id: `client-${Date.now()}`,
        activeCampaigns: 0,
      };
      
      setClients((prev) => [...prev, client]);
      addLog("cadastrou o cliente", client.name);

      supabase.from("ims_clients").insert(client).then(({ error }) => {
        if (error) console.error("Error adding client", error);
      });
    },
    [addLog]
  );

  const updateClient = useCallback(
    (client: Client) => {
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
      addLog("editou o cliente", client.name);

      supabase.from("ims_clients").update(client).eq("id", client.id).then(({ error }) => {
        if (error) console.error("Error updating client", error);
      });
    },
    [addLog]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients((prev) => {
        const client = prev.find((c) => c.id === id);
        if (client) addLog("removeu o cliente", client.name);
        return prev.filter((c) => c.id !== id);
      });

      supabase.from("ims_clients").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error deleting client", error);
      });
    },
    [addLog]
  );

  // ─── Campaign CRUD ──────────────────────────────────────────────────────────

  const addCampaign = useCallback(
    (data: Omit<Campaign, "id">): Campaign => {
      const campaign: Campaign = { ...data, id: `camp-${Date.now()}` };
      
      const updatedClients = clients.map((c) =>
        c.id === campaign.clientId
          ? { ...c, activeCampaigns: c.activeCampaigns + 1 }
          : c
      );
      setClients(updatedClients);
      setCampaigns((prev) => [...prev, campaign]);
      addLog("criou a campanha", campaign.name);

      // Persist to Supabase
      supabase.from("ims_campaigns").insert(campaign).then(({ error }) => {
        if (error) console.error("Error adding campaign", error);
      });
      
      const affected = updatedClients.find((c) => c.id === campaign.clientId);
      if (affected) {
        supabase.from("ims_clients").update(affected).eq("id", affected.id).then(({ error }) => {
          if (error) console.error("Error updating client campaign count", error);
        });
      }

      return campaign;
    },
    [addLog, clients]
  );

  const updateCampaign = useCallback(
    (campaign: Campaign) => {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaign.id ? campaign : c))
      );
      addLog("atualizou a campanha", campaign.name);

      supabase.from("ims_campaigns").update(campaign).eq("id", campaign.id).then(({ error }) => {
        if (error) console.error("Error updating campaign", error);
      });
    },
    [addLog]
  );

  const deleteCampaign = useCallback(
    (id: string) => {
      const campaign = campaigns.find((c) => c.id === id);
      if (campaign) {
        addLog("removeu a campanha", campaign.name);

        const updatedClients = clients.map((c) =>
          c.id === campaign.clientId
            ? { ...c, activeCampaigns: Math.max(0, c.activeCampaigns - 1) }
            : c
        );
        setClients(updatedClients);

        const affected = updatedClients.find((c) => c.id === campaign.clientId);
        if (affected) {
          supabase.from("ims_clients").update(affected).eq("id", affected.id).then();
        }
      }
      
      setCampaigns((prev) => prev.filter((c) => c.id !== id));

      supabase.from("ims_campaigns").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("Error deleting campaign", error);
      });
    },
    [addLog, campaigns, clients]
  );

  const setActiveCampaignId = useCallback((id: string | null) => {
    setActiveCampaignIdState(id);
    
    if (id) {
      supabase.from("ims_settings").upsert({ key: "activeId", value: id }).then();
    } else {
      supabase.from("ims_settings").delete().eq("key", "activeId").then();
    }
  }, []);

  // ─── Audience library ────────────────────────────────────────────────────────

  const saveAudience = useCallback(
    (
      label: string,
      type: "meta" | "google",
      audience: MetaAudience | GoogleAudience
    ) => {
      const entry: SavedAudience = {
        id: `saved-aud-${Date.now()}`,
        label,
        type,
        audience,
        savedAt: new Date().toISOString(),
      };
      
      setSavedAudiences((prev) => [entry, ...prev]);

      supabase.from("ims_saved_audiences").insert(entry).then(({ error }) => {
        if (error) console.error("Error saving audience", error);
      });
    },
    []
  );

  const deleteSavedAudience = useCallback((id: string) => {
    setSavedAudiences((prev) => prev.filter((a) => a.id !== id));
    supabase.from("ims_saved_audiences").delete().eq("id", id).then();
  }, []);

  const saveSitelinkSet = useCallback((label: string, sitelinks: Sitelink[]) => {
    const entry: SavedSitelinkSet = {
      id: `saved-sl-${Date.now()}`,
      label,
      sitelinks,
      savedAt: new Date().toISOString(),
    };
    setSavedSitelinkSets((prev) => [entry, ...prev]);
    supabase.from("ims_saved_sitelink_sets").insert(entry).then();
  }, []);

  const deleteSavedSitelinkSet = useCallback((id: string) => {
    setSavedSitelinkSets((prev) => prev.filter((s) => s.id !== id));
    supabase.from("ims_saved_sitelink_sets").delete().eq("id", id).then();
  }, []);

  const saveCreative = useCallback(
    (
      label: string,
      platform: "meta" | "google",
      creative: MetaCreative | GoogleCreative
    ) => {
      const entry: SavedCreative = {
        id: `saved-cr-${Date.now()}`,
        label,
        platform,
        creative,
        savedAt: new Date().toISOString(),
      };
      setSavedCreatives((prev) => [entry, ...prev]);
      supabase.from("ims_saved_creatives").insert(entry).then();
    },
    []
  );

  const deleteSavedCreative = useCallback((id: string) => {
    setSavedCreatives((prev) => prev.filter((c) => c.id !== id));
    supabase.from("ims_saved_creatives").delete().eq("id", id).then();
  }, []);

  // ─── Loading screen ──────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Carregando dados do Supabase…</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <StoreContext.Provider
      value={{
        clients,
        campaigns,
        activityLogs,
        activeCampaignId,
        getClient,
        getCampaign,
        getActiveCampaign,
        addClient,
        updateClient,
        deleteClient,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        setActiveCampaignId,
        addLog,
        clearLogs,
        savedAudiences,
        saveAudience,
        deleteSavedAudience,
        savedSitelinkSets,
        saveSitelinkSet,
        deleteSavedSitelinkSet,
        savedCreatives,
        saveCreative,
        deleteSavedCreative,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
