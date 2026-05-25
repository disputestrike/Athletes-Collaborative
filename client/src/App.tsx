import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AthletePublicPage from "./pages/AthletePublicPage";
import LeadCapture from "./pages/LeadCapture";

// Portal pages
import PortalDashboard from "./pages/portal/Dashboard";
import PortalProfile from "./pages/portal/Profile";
import PortalContracts from "./pages/portal/Contracts";
import PortalOpportunities from "./pages/portal/Opportunities";
import PortalMarketing from "./pages/portal/Marketing";
import PortalCompliance from "./pages/portal/Compliance";
import PortalGrowth from "./pages/portal/Growth";
import PortalMessages from "./pages/portal/Messages";
import PortalSettings from "./pages/portal/Settings";
import PortalMedia from "./pages/portal/Media";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAthletes from "./pages/admin/AdminAthletes";
import AdminContracts from "./pages/admin/AdminContracts";
import AdminOpportunities from "./pages/admin/AdminOpportunities";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminCompliance from "./pages/admin/AdminCompliance";
import AdminGrowth from "./pages/admin/AdminGrowth";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTeamFamily from "./pages/admin/AdminTeamFamily";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminAthletePages from "./pages/admin/AdminAthletePages";
import AdminCRM from "./pages/admin/AdminCRM";

// Layouts
import PortalLayout from "./components/PortalLayout";

function PortalRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <PortalLayout isAdmin={false}>
      <Component />
    </PortalLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <PortalLayout isAdmin={true}>
      <Component />
    </PortalLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Home} />
      <Route path="/lead" component={LeadCapture} />
      <Route path="/lead/:tenantSlug" component={LeadCapture} />
      <Route path="/a/:slug" component={AthletePublicPage} />

      {/* Athlete Portal */}
      <Route path="/portal">
        {() => <PortalRoute component={PortalDashboard} />}
      </Route>
      <Route path="/portal/profile">
        {() => <PortalRoute component={PortalProfile} />}
      </Route>
      <Route path="/portal/contracts">
        {() => <PortalRoute component={PortalContracts} />}
      </Route>
      <Route path="/portal/contracts/:id">
        {() => <PortalRoute component={PortalContracts} />}
      </Route>
      <Route path="/portal/opportunities">
        {() => <PortalRoute component={PortalOpportunities} />}
      </Route>
      <Route path="/portal/opportunities/:id">
        {() => <PortalRoute component={PortalOpportunities} />}
      </Route>
      <Route path="/portal/marketing">
        {() => <PortalRoute component={PortalMarketing} />}
      </Route>
      <Route path="/portal/compliance">
        {() => <PortalRoute component={PortalCompliance} />}
      </Route>
      <Route path="/portal/compliance/:id">
        {() => <PortalRoute component={PortalCompliance} />}
      </Route>
      <Route path="/portal/growth">
        {() => <PortalRoute component={PortalGrowth} />}
      </Route>
      <Route path="/portal/media">
        {() => <PortalRoute component={PortalMedia} />}
      </Route>
      <Route path="/portal/messages">
        {() => <PortalRoute component={PortalMessages} />}
      </Route>
      <Route path="/portal/settings">
        {() => <PortalRoute component={PortalSettings} />}
      </Route>

      {/* Admin Command Center */}
      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/athletes">
        {() => <AdminRoute component={AdminAthletes} />}
      </Route>
      <Route path="/admin/tenants">
        {() => <AdminRoute component={AdminTenants} />}
      </Route>
      <Route path="/admin/athlete-pages">
        {() => <AdminRoute component={AdminAthletePages} />}
      </Route>
      <Route path="/admin/crm">
        {() => <AdminRoute component={AdminCRM} />}
      </Route>
      <Route path="/admin/athletes/:id">
        {() => <AdminRoute component={AdminAthletes} />}
      </Route>
      <Route path="/admin/contracts">
        {() => <AdminRoute component={AdminContracts} />}
      </Route>
      <Route path="/admin/contracts/:id">
        {() => <AdminRoute component={AdminContracts} />}
      </Route>
      <Route path="/admin/opportunities">
        {() => <AdminRoute component={AdminOpportunities} />}
      </Route>
      <Route path="/admin/opportunities/:id">
        {() => <AdminRoute component={AdminOpportunities} />}
      </Route>
      <Route path="/admin/campaigns">
        {() => <AdminRoute component={AdminCampaigns} />}
      </Route>
      <Route path="/admin/campaigns/:id">
        {() => <AdminRoute component={AdminCampaigns} />}
      </Route>
      <Route path="/admin/compliance">
        {() => <AdminRoute component={AdminCompliance} />}
      </Route>
      <Route path="/admin/compliance/:id">
        {() => <AdminRoute component={AdminCompliance} />}
      </Route>
      <Route path="/admin/messages">
        {() => <AdminRoute component={AdminMessages} />}
      </Route>
      <Route path="/admin/growth">
        {() => <AdminRoute component={AdminGrowth} />}
      </Route>
      <Route path="/admin/partners">
        {() => <AdminRoute component={AdminGrowth} />}
      </Route>
      <Route path="/admin/outreach">
        {() => <AdminRoute component={AdminGrowth} />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/team-family">
        {() => <AdminRoute component={AdminTeamFamily} />}
      </Route>
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
