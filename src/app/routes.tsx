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
  // ─── Protected Routes (Admin & Presentation) ────────────────────────────────
  {
    element: <AuthGuard />,
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
      {
        path: "/:campaignId",
        Component: Layout,
        children: [
          { index: true, Component: Overview },
          { path: "meta-ads", Component: MetaAds },
          { path: "google-ads", Component: GoogleAds },
        ],
      },
    ],
  },
  // ─── Public/Presentation Routes ──────────────────────────────────────────
  {
    path: "/share/:campaignId",
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: "meta-ads", Component: MetaAds },
      { path: "google-ads", Component: GoogleAds },
    ],
  },
  // ─── Root Route (Fallback/Public) ────────────────────────────────────────
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Overview },
    ],
  },
]);
