import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KPICard, StatusBadge, OpportunityTypeBadge, SectionCard, EmptyState, CardSkeleton, formatCurrency, formatDate, formatRelativeTime } from "@/components/shared";
import {
  FileText, Briefcase, ShieldCheck, MessageSquare, Megaphone,
  AlertTriangle, ArrowRight, Plus, TrendingUp, Star, Calendar,
  CheckCircle, Clock, ChevronRight
} from "lucide-react";

export default function AthleteDashboard() {
  const { user } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = trpc.athletes.getMyProfile.useQuery();

  const { data: kpis, isLoading: kpisLoading } = trpc.athletes.getKPIs.useQuery(
    { athleteId: myProfile?.id ?? 0 },
    { enabled: !!myProfile?.id }
  );

  const { data: contracts } = trpc.contracts.list.useQuery(
    { athleteId: myProfile?.id },
    { enabled: !!myProfile?.id }
  );

  const { data: opportunities } = trpc.opportunities.list.useQuery(
    { athleteId: myProfile?.id },
    { enabled: !!myProfile?.id }
  );

  const { data: compliance } = trpc.compliance.list.useQuery(
    { athleteId: myProfile?.id },
    { enabled: !!myProfile?.id }
  );

  const { data: campaigns } = trpc.campaigns.list.useQuery(
    { athleteId: myProfile?.id },
    { enabled: !!myProfile?.id }
  );

  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery();

  const activeContracts = contracts?.filter(c => c.status === "Active") ?? [];
  const openOpps = opportunities?.filter(o => !["Accepted", "Declined", "Converted", "Lost"].includes(o.status)) ?? [];
  const pendingForms = compliance?.filter(f => ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(f.status)) ?? [];
  const renewingSoon = contracts?.filter(c => {
    if (!c.renewalDate || c.status !== "Active") return false;
    const days = (new Date(c.renewalDate).getTime() - Date.now()) / 86400000;
    return days <= 90 && days >= 0;
  }) ?? [];

  const firstName = myProfile?.firstName ?? user?.name?.split(" ")[0] ?? "Athlete";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 stagger-children">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your career today.</p>
        </div>
        {myProfile && (
          <div className="hidden sm:flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={myProfile.photoUrl ?? ""} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {myProfile.firstName[0]}{myProfile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{myProfile.firstName} {myProfile.lastName}</p>
              <p className="text-xs text-muted-foreground">{myProfile.sport} · {myProfile.team ?? "Free Agent"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Representation alert */}
      {myProfile?.representationStatus === "active" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Actively Represented</p>
            <p className="text-xs text-emerald-600">Your representation is current and active. All systems go.</p>
          </div>
          <StatusBadge status="active" />
        </div>
      )}
      {myProfile?.representationStatus === "pending" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Representation Pending</p>
            <p className="text-xs text-amber-600">Your representation agreement is being finalized.</p>
          </div>
          <StatusBadge status="pending" />
        </div>
      )}

      {/* Renewal alert */}
      {renewingSoon.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">Contract Renewal Coming Up</p>
            <p className="text-xs text-orange-600">
              {renewingSoon[0]?.title} renews on {formatDate(renewingSoon[0]?.renewalDate)}
            </p>
          </div>
          <Link href="/portal/contracts">
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              View
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      {kpisLoading ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/portal/contracts">
            <KPICard
              title="Active Contracts"
              value={kpis?.activeContracts ?? 0}
              icon={FileText}
              iconColor="text-blue-600"
              subtitle="Currently active"
              onClick={() => {}}
            />
          </Link>
          <Link href="/portal/opportunities">
            <KPICard
              title="Open Opportunities"
              value={kpis?.openOpportunities ?? 0}
              icon={Briefcase}
              iconColor="text-orange-600"
              subtitle="In pipeline"
              onClick={() => {}}
            />
          </Link>
          <Link href="/portal/compliance">
            <KPICard
              title="Pending Forms"
              value={kpis?.pendingCompliance ?? 0}
              icon={ShieldCheck}
              iconColor={kpis?.pendingCompliance ? "text-amber-600" : "text-emerald-600"}
              subtitle="Need attention"
              onClick={() => {}}
            />
          </Link>
          <Link href="/portal/marketing">
            <KPICard
              title="Active Campaigns"
              value={kpis?.activeCampaigns ?? 0}
              icon={Megaphone}
              iconColor="text-pink-600"
              subtitle="Running now"
              onClick={() => {}}
            />
          </Link>
          <Link href="/portal/messages">
            <KPICard
              title="Unread Messages"
              value={unreadCount ?? 0}
              icon={MessageSquare}
              iconColor={unreadCount ? "text-violet-600" : "text-muted-foreground"}
              subtitle="In your inbox"
              onClick={() => {}}
            />
          </Link>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Opportunities */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Latest Opportunities"
            subtitle="Your active career pipeline"
            action={
              <Link href="/portal/opportunities">
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            }
          >
            {openOpps.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No open opportunities"
                description="Your team will add new opportunities here as they come in."
              />
            ) : (
              <div className="space-y-3">
                {openOpps.slice(0, 5).map(opp => (
                  <Link key={opp.id} href={`/portal/opportunities/${opp.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <OpportunityTypeBadge type={opp.type} />
                          <StatusBadge status={opp.status} />
                        </div>
                        <p className="font-medium text-sm text-foreground truncate">{opp.title}</p>
                        {opp.organization && (
                          <p className="text-xs text-muted-foreground">{opp.organization}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {opp.valueCents && (
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(opp.valueCents)}</p>
                        )}
                        {opp.deadline && (
                          <p className="text-xs text-muted-foreground">Due {formatDate(opp.deadline)}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <SectionCard title="Quick Actions">
            <div className="space-y-2">
              <Link href="/portal/compliance">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Submit Compliance Form
                </Button>
              </Link>
              <Link href="/portal/messages">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                  Message My Team
                </Button>
              </Link>
              <Link href="/portal/profile">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <Star className="h-4 w-4 text-orange-600" />
                  Update My Profile
                </Button>
              </Link>
              <Link href="/portal/growth">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Explore Growth Hub
                </Button>
              </Link>
            </div>
          </SectionCard>

          {/* Upcoming Compliance */}
          <SectionCard
            title="Compliance"
            action={
              <Link href="/portal/compliance">
                <Button variant="ghost" size="sm" className="text-xs text-primary">View all</Button>
              </Link>
            }
          >
            {pendingForms.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">All forms up to date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingForms.slice(0, 3).map(form => (
                  <Link key={form.id} href={`/portal/compliance/${form.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{form.title}</p>
                        <p className="text-xs text-muted-foreground">{form.type}</p>
                      </div>
                      <StatusBadge status={form.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Active Contracts */}
          <SectionCard
            title="Active Contracts"
            action={
              <Link href="/portal/contracts">
                <Button variant="ghost" size="sm" className="text-xs text-primary">View all</Button>
              </Link>
            }
          >
            {activeContracts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No active contracts</p>
            ) : (
              <div className="space-y-2">
                {activeContracts.slice(0, 3).map(c => (
                  <Link key={c.id} href={`/portal/contracts/${c.id}`}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.counterparty ?? "—"}</p>
                      </div>
                      {c.valueCents && (
                        <p className="text-xs font-semibold text-foreground flex-shrink-0">{formatCurrency(c.valueCents)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
