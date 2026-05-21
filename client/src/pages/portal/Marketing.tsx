import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, EmptyState, formatCurrency, formatDate } from "@/components/shared";
import { Megaphone, ArrowLeft, Calendar, DollarSign, ChevronRight, ExternalLink } from "lucide-react";

export function MarketingList() {
  const { data: profile } = trpc.athletes.getMyProfile.useQuery();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery(
    { athleteId: profile?.id },
    { enabled: !!profile?.id }
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing & Campaigns" subtitle="Your brand partnerships and marketing campaigns" />

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Your marketing campaigns will appear here once your team adds them." />
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <Link key={c.id} href={`/portal/marketing/${c.id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={c.status} />
                      {c.brand && <Badge variant="outline" className="text-xs">{c.brand}</Badge>}
                    </div>
                    <h3 className="font-semibold">{c.name}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      {c.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(c.startDate)}</span>}
                      {c.endDate && <span>→ {formatDate(c.endDate)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.budgetCents && <p className="font-bold text-foreground">{formatCurrency(c.budgetCents)}</p>}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-2" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery({ id: Number(id) });
  const { data: athletes } = trpc.campaigns.getAthletes.useQuery({ campaignId: Number(id) });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!campaign) return <EmptyState icon={Megaphone} title="Campaign not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/marketing">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <StatusBadge status={campaign.status} size="md" />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          {campaign.brand && <p className="text-muted-foreground">Brand: {campaign.brand}</p>}
        </div>
        {campaign.budgetCents && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatCurrency(campaign.budgetCents)}</p>
            <p className="text-xs text-muted-foreground">Campaign Budget</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {campaign.description && (
            <SectionCard title="Campaign Overview">
              <p className="text-sm leading-relaxed">{campaign.description}</p>
            </SectionCard>
          )}
          {campaign.deliverables && (
            <SectionCard title="Deliverables">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{campaign.deliverables}</p>
            </SectionCard>
          )}
          {campaign.performanceNotes && (
            <SectionCard title="Performance Notes">
              <p className="text-sm leading-relaxed">{campaign.performanceNotes}</p>
            </SectionCard>
          )}
        </div>
        <div className="space-y-4">
          <SectionCard title="Campaign Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={campaign.status} /></dd></div>
              {campaign.startDate && <div><dt className="text-xs text-muted-foreground">Start Date</dt><dd className="text-sm font-medium mt-0.5">{formatDate(campaign.startDate)}</dd></div>}
              {campaign.endDate && <div><dt className="text-xs text-muted-foreground">End Date</dt><dd className="text-sm font-medium mt-0.5">{formatDate(campaign.endDate)}</dd></div>}
              {campaign.budgetCents && <div><dt className="text-xs text-muted-foreground">Budget</dt><dd className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(campaign.budgetCents)}</dd></div>}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function PortalMarketing() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <CampaignDetail />;
  return <MarketingList />;
}
