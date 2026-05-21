import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPICard, SectionCard, StatusBadge, OpportunityTypeBadge, formatCurrency, formatDate, formatRelativeTime, CardSkeleton } from "@/components/shared";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Users, FileText, Briefcase, Megaphone, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Activity, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.getDashboardStats.useQuery();
  const { data: recentActivity } = trpc.admin.getRecentActivity.useQuery();
  const { data: pendingReviews } = trpc.admin.getPendingReviews.useQuery();
  const { data: revenueData } = trpc.admin.getRevenueData.useQuery();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of Athletes Collaborative operations</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/athletes">
            <Button size="sm" className="gap-2">
              <Users className="h-4 w-4" />Manage Athletes
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Link href="/admin/athletes">
            <KPICard title="Total Athletes" value={stats?.totalAthletes ?? 0} icon={Users} iconColor="text-blue-600" subtitle="Registered" onClick={() => {}} />
          </Link>
          <Link href="/admin/contracts">
            <KPICard title="Active Contracts" value={stats?.activeContracts ?? 0} icon={FileText} iconColor="text-emerald-600" subtitle="Currently active" onClick={() => {}} />
          </Link>
          <Link href="/admin/opportunities">
            <KPICard title="Open Opps" value={stats?.openOpportunities ?? 0} icon={Briefcase} iconColor="text-orange-600" subtitle="In pipeline" onClick={() => {}} />
          </Link>
          <Link href="/admin/campaigns">
            <KPICard title="Campaigns" value={stats?.activeCampaigns ?? 0} icon={Megaphone} iconColor="text-pink-600" subtitle="Active" onClick={() => {}} />
          </Link>
          <Link href="/admin/compliance">
            <KPICard title="Pending Review" value={stats?.pendingCompliance ?? 0} icon={ShieldCheck} iconColor={stats?.pendingCompliance ? "text-amber-600" : "text-emerald-600"} subtitle="Compliance forms" onClick={() => {}} />
          </Link>
          <KPICard
            title="Total Value"
            value={formatCurrency(stats?.totalContractValue ?? 0)}
            icon={DollarSign}
            iconColor="text-violet-600"
            subtitle="Contract portfolio"
          />
        </div>
      )}

      {/* Alerts */}
      {stats?.renewingSoon && stats.renewingSoon > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">{stats.renewingSoon} Contract{stats.renewingSoon > 1 ? "s" : ""} Renewing Within 90 Days</p>
            <p className="text-xs text-orange-600">Review and initiate renewal conversations now.</p>
          </div>
          <Link href="/admin/contracts?filter=renewing">
            <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">View</Button>
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2">
          <SectionCard title="Revenue Forecast" subtitle="Monthly contract value over time">
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tickFormatter={v => `$${(v/100000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Value"]} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#colorValue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No revenue data available yet
              </div>
            )}
          </SectionCard>
        </div>

        {/* Pending reviews */}
        <div>
          <SectionCard
            title="Pending Reviews"
            subtitle="Compliance forms awaiting action"
            action={
              <Link href="/admin/compliance">
                <Button variant="ghost" size="sm" className="text-xs text-primary">View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </Link>
            }
          >
            {!pendingReviews || pendingReviews.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-sm text-emerald-700 font-medium">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReviews.slice(0, 5).map(form => (
                  <Link key={form.id} href={`/admin/compliance/${form.id}`}>
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
        </div>
      </div>

      {/* Recent activity */}
      <SectionCard title="Recent Activity" subtitle="Latest actions across the platform">
        {!recentActivity || recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.slice(0, 10).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.action}{item.details ? ` — ${item.details}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
