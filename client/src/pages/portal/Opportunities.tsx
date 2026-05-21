import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, OpportunityTypeBadge, EmptyState, TableSkeleton, formatCurrency, formatDate } from "@/components/shared";
import { Briefcase, Search, ArrowLeft, Calendar, DollarSign, Building, User, ChevronRight, Star } from "lucide-react";

const OPP_TYPES = ["All", "Career", "NIL", "Sponsorship", "Endorsement", "Event", "Media", "Speaking", "Community"];
const OPP_STATUSES = ["All", "Identified", "Contacted", "In Negotiation", "Offer Received", "Accepted", "Declined", "Converted", "Lost"];

export function OpportunitiesList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const { data: profile } = trpc.athletes.getMyProfile.useQuery();
  const { data: opportunities, isLoading } = trpc.opportunities.list.useQuery(
    { athleteId: profile?.id },
    { enabled: !!profile?.id }
  );

  const filtered = opportunities?.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase()) || (o.organization ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || o.type === typeFilter;
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }) ?? [];

  const pipelineStages = ["Identified", "Contacted", "In Negotiation", "Offer Received"];
  const active = filtered.filter(o => pipelineStages.includes(o.status));
  const closed = filtered.filter(o => !pipelineStages.includes(o.status));

  return (
    <div className="space-y-6">
      <PageHeader title="Career Opportunities" subtitle="Your full opportunity pipeline managed by your team" />

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pipelineStages.map(stage => {
          const count = opportunities?.filter(o => o.status === stage).length ?? 0;
          return (
            <div key={stage} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stage}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {OPP_TYPES.map(t => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="text-xs">
              {t}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : (
        <>
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Pipeline ({active.length})</h3>
              <div className="space-y-3">
                {active.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Closed ({closed.length})</h3>
              <div className="space-y-2">
                {closed.map(opp => <OpportunityCard key={opp.id} opp={opp} compact />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <EmptyState icon={Briefcase} title="No opportunities found" description="Your team will add opportunities here as they identify them." />
          )}
        </>
      )}
    </div>
  );
}

function OpportunityCard({ opp, compact = false }: { opp: any; compact?: boolean }) {
  return (
    <Link href={`/portal/opportunities/${opp.id}`}>
      <div className={`bg-card border border-border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${compact ? "p-3" : "p-5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <OpportunityTypeBadge type={opp.type} />
              <StatusBadge status={opp.status} />
              {opp.aiMatchScore && Number(opp.aiMatchScore) >= 80 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                  <Star className="h-3 w-3" />AI Match: {opp.aiMatchScore}%
                </Badge>
              )}
            </div>
            <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : ""}`}>{opp.title}</h3>
            {opp.organization && <p className="text-sm text-muted-foreground">{opp.organization}</p>}
            {!compact && opp.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{opp.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {opp.valueCents && <p className={`font-bold text-foreground ${compact ? "text-sm" : "text-lg"}`}>{formatCurrency(opp.valueCents)}</p>}
            {opp.deadline && <p className="text-xs text-muted-foreground">Due {formatDate(opp.deadline)}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: opp, isLoading } = trpc.opportunities.getById.useQuery({ id: Number(id) });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!opp) return <EmptyState icon={Briefcase} title="Opportunity not found" />;

  const pipelineStages = ["Identified", "Contacted", "In Negotiation", "Offer Received", "Accepted"];
  const currentStageIdx = pipelineStages.indexOf(opp.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/opportunities">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <OpportunityTypeBadge type={opp.type} />
        <StatusBadge status={opp.status} size="md" />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{opp.title}</h1>
          {opp.organization && <p className="text-muted-foreground">{opp.organization}</p>}
        </div>
        {opp.valueCents && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatCurrency(opp.valueCents)}</p>
            <p className="text-xs text-muted-foreground">Potential Value</p>
          </div>
        )}
      </div>

      {/* Pipeline progress */}
      {currentStageIdx >= 0 && (
        <SectionCard title="Pipeline Progress">
          <div className="flex items-center gap-1">
            {pipelineStages.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1">
                <div className={`flex-1 h-2 rounded-full ${i <= currentStageIdx ? "bg-primary" : "bg-muted"}`} />
                {i < pipelineStages.length - 1 && <div className="w-1" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {pipelineStages.map((stage, i) => (
              <span key={stage} className={`text-xs ${i === currentStageIdx ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {stage}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {opp.description && (
            <SectionCard title="Description">
              <p className="text-sm leading-relaxed">{opp.description}</p>
            </SectionCard>
          )}
          {opp.notes && (
            <SectionCard title="Notes from Your Team">
              <p className="text-sm leading-relaxed">{opp.notes}</p>
            </SectionCard>
          )}
        </div>
        <div className="space-y-4">
          <SectionCard title="Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="mt-0.5"><OpportunityTypeBadge type={opp.type} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={opp.status} /></dd></div>
              {opp.deadline && <div><dt className="text-xs text-muted-foreground">Deadline</dt><dd className="text-sm font-medium mt-0.5">{formatDate(opp.deadline)}</dd></div>}
              {opp.valueCents && <div><dt className="text-xs text-muted-foreground">Potential Value</dt><dd className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(opp.valueCents)}</dd></div>}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function PortalOpportunities() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <OpportunityDetail />;
  return <OpportunitiesList />;
}
