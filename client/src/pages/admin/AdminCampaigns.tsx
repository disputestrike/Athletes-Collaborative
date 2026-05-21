import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatCurrency, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { Megaphone, Plus, Search, ArrowLeft, Edit } from "lucide-react";

const CAMPAIGN_STATUSES = ["Planning", "Active", "Paused", "Completed", "Cancelled"];

export function AdminCampaignsList() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery({});
  const { data: athletes } = trpc.admin.getAthletes.useQuery();

  const [form, setForm] = useState({
    name: "", brand: "", status: "Planning", description: "",
    budgetCents: "", startDate: "", endDate: "", deliverables: "",
    performanceNotes: "", athleteIds: [] as number[],
  });

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created");
      setShowCreate(false);
      utils.campaigns.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = campaigns?.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.brand ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing Campaigns" subtitle="Brand partnerships and marketing initiatives">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />New Campaign
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {CAMPAIGN_STATUSES.map(s => (
          <div key={s} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{campaigns?.filter(c => c.status === s).length ?? 0}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <TableSkeleton rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns" action={<Button onClick={() => setShowCreate(true)}>New Campaign</Button>} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Budget</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/admin/campaigns/${c.id}`}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.brand ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell font-semibold">{c.budgetCents ? formatCurrency(c.budgetCents) : "—"}</td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">{formatDate(c.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Campaign Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm(f => ({...f, brand: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CAMPAIGN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Budget (USD)</Label><Input type="number" value={form.budgetCents} onChange={e => setForm(f => ({...f, budgetCents: e.target.value}))} className="mt-1" /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1" /></div>
            <div className="col-span-2"><Label>Deliverables</Label><Textarea value={form.deliverables} onChange={e => setForm(f => ({...f, deliverables: e.target.value}))} rows={2} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => { const { athleteIds, performanceNotes, ...rest } = form; createMutation.mutate({ ...rest, budgetCents: rest.budgetCents ? Number(rest.budgetCents) * 100 : undefined, status: rest.status as any }); }}
              disabled={!form.name || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminCampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery({ id: Number(id) });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!campaign) return <EmptyState icon={Megaphone} title="Campaign not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns">
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
            <p className="text-xs text-muted-foreground">Budget</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {campaign.description && <SectionCard title="Description"><p className="text-sm leading-relaxed">{campaign.description}</p></SectionCard>}
          {campaign.deliverables && <SectionCard title="Deliverables"><p className="text-sm leading-relaxed whitespace-pre-wrap">{campaign.deliverables}</p></SectionCard>}
          {campaign.performanceNotes && <SectionCard title="Performance Notes"><p className="text-sm leading-relaxed">{campaign.performanceNotes}</p></SectionCard>}
        </div>
        <div>
          <SectionCard title="Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={campaign.status} /></dd></div>
              {campaign.startDate && <div><dt className="text-xs text-muted-foreground">Start</dt><dd className="text-sm font-medium mt-0.5">{formatDate(campaign.startDate)}</dd></div>}
              {campaign.endDate && <div><dt className="text-xs text-muted-foreground">End</dt><dd className="text-sm font-medium mt-0.5">{formatDate(campaign.endDate)}</dd></div>}
              {campaign.budgetCents && <div><dt className="text-xs text-muted-foreground">Budget</dt><dd className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(campaign.budgetCents)}</dd></div>}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaigns() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <AdminCampaignDetail />;
  return <AdminCampaignsList />;
}
