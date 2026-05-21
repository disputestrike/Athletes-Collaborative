import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatCurrency, formatDate } from "@/components/shared";
import { FileText, Search, ArrowLeft, Calendar, DollarSign, User, Tag, Clock, AlertTriangle, ExternalLink } from "lucide-react";

export function ContractsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: profile } = trpc.athletes.getMyProfile.useQuery();
  const { data: contracts, isLoading } = trpc.contracts.list.useQuery(
    { athleteId: profile?.id },
    { enabled: !!profile?.id }
  );

  const filtered = contracts?.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.counterparty ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  const statuses = ["all", "Draft", "Active", "Expired", "Terminated"];

  return (
    <div className="space-y-6">
      <PageHeader title="My Contracts" subtitle="All your representation and endorsement agreements" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Contract cards */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts found"
          description={search ? "Try adjusting your search." : "Your contracts will appear here once added by your team."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const isRenewing = contract.renewalDate && contract.status === "Active" &&
              (new Date(contract.renewalDate).getTime() - Date.now()) / 86400000 <= 90;

            return (
              <Link key={contract.id} href={`/portal/contracts/${contract.id}`}>
                <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={contract.status} />
                        {contract.contractType && (
                          <Badge variant="outline" className="text-xs">{contract.contractType}</Badge>
                        )}
                        {isRenewing && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />Renewing Soon
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{contract.title}</h3>
                      {contract.counterparty && (
                        <p className="text-sm text-muted-foreground">{contract.counterparty}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {contract.valueCents && (
                        <p className="font-bold text-lg text-foreground">{formatCurrency(contract.valueCents)}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {contract.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Start: {formatDate(contract.startDate)}
                      </span>
                    )}
                    {contract.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />End: {formatDate(contract.endDate)}
                      </span>
                    )}
                    {contract.renewalDate && (
                      <span className={`flex items-center gap-1 ${isRenewing ? "text-orange-600 font-medium" : ""}`}>
                        <Clock className="h-3 w-3" />Renewal: {formatDate(contract.renewalDate)}
                      </span>
                    )}
                  </div>
                  {contract.athleteNote && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 bg-muted/40 rounded p-2">
                      {contract.athleteNote}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: contract, isLoading } = trpc.contracts.getById.useQuery({ id: Number(id) });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!contract) return <EmptyState icon={FileText} title="Contract not found" />;

  const milestones = contract.milestones ? JSON.parse(contract.milestones) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/contracts">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <StatusBadge status={contract.status} size="md" />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          {contract.counterparty && <p className="text-muted-foreground">{contract.counterparty}</p>}
        </div>
        {contract.valueCents && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{formatCurrency(contract.valueCents)}</p>
            <p className="text-xs text-muted-foreground">Contract Value</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key dates */}
          <SectionCard title="Key Dates">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Start Date", value: formatDate(contract.startDate), icon: Calendar },
                { label: "End Date", value: formatDate(contract.endDate), icon: Calendar },
                { label: "Signed Date", value: formatDate(contract.signedDate), icon: Calendar },
                { label: "Renewal Date", value: formatDate(contract.renewalDate), icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-muted/40">
                  <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Notes (athlete-visible only) */}
          {contract.athleteNote && (
            <SectionCard title="Notes from Your Team">
              <p className="text-sm text-foreground leading-relaxed">{contract.athleteNote}</p>
            </SectionCard>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <SectionCard title="Milestone Timeline">
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4 pl-10">
                  {milestones.map((m: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.date} {m.description ? `· ${m.description}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {/* Document */}
          {contract.documentUrl && (
            <SectionCard title="Contract Document">
              <a href={contract.documentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />View Document
                </Button>
              </a>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SectionCard title="Contract Details">
            <dl className="space-y-3">
              {[
                { label: "Type", value: contract.contractType },
                { label: "Status", value: <StatusBadge status={contract.status} /> },
                { label: "Value", value: formatCurrency(contract.valueCents) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium mt-0.5">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {contract.tags && (
            <SectionCard title="Tags">
              <div className="flex flex-wrap gap-2">
                {contract.tags.split(",").map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PortalContracts() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <ContractDetail />;
  return <ContractsList />;
}
