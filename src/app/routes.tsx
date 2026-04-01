import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Overview } from "./components/Overview";
import { MetaAds } from "./components/MetaAds";
import { GoogleAds } from "./components/GoogleAds";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ClientManagement } from "./admin/ClientManagement";
import { ClientProfile } from "./admin/ClientProfile";
import { CampaignManagement } from "./admin/CampaignManagement";
import { StrategyEditor } from "./admin/StrategyEditor";
import { Settings } from "./admin/Settings";
import { LoginPage } from "./auth/LoginPage";
import { AuthGuard } from "./auth/AuthGuard";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  // ─── Protected Admin Routes ────────────────────────────────────────────────
  {
    path: "/admin",
    Component: AuthGuard,
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        children: [
          { index: true, Component: AdminDashboard },
          { path: "clients", Component: ClientManagement },
          { path: "clients/:id", Component: ClientProfile },
          { path: "campaigns", Component: CampaignManagement },
          { path: "campaigns/:id", Component: StrategyEditor },
          { path: "campaigns/:id/:tab", Component: StrategyEditor },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
  // ─── Public/Presentation Routes (with ID or Slug) ─────────────────────────
  {
    path: "/share/:campaignId", // Backwards compatibility
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: "meta-ads", Component: MetaAds },
      { path: "google-ads", Component: GoogleAds },
    ],
  },
  {
    path: "/:campaignId", // Main dynamic route
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: "meta-ads", Component: MetaAds },
      { path: "google-ads", Component: GoogleAds },
    ],
  },
  // ─── Root Route (Generic - Redirection/Fallback) ──────────────────────────
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Overview },
    ],
  },
]);
