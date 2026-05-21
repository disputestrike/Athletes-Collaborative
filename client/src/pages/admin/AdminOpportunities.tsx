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
import { PageHeader, SectionCard, StatusBadge, OpportunityTypeBadge, EmptyState, TableSkeleton, formatCurrency, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { Briefcase, Plus, Search, ArrowLeft, Edit, Star } from "lucide-react";

const OPP_TYPES = ["Career", "NIL", "Sponsorship", "Endorsement", "Event", "Media", "Speaking", "Community"];
const OPP_STATUSES = ["Identified", "Contacted", "In Negotiation", "Offer Received", "Accepted", "Declined", "Converted", "Lost"];

export function AdminOpportunitiesList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: opportunities, isLoading } = trpc.opportunities.list.useQuery({});
  const { data: athletes } = trpc.admin.getAthletes.useQuery();

  const [form, setForm] = useState({
    title: "", athleteId: "", type: "Career", status: "Identified",
    organization: "", description: "", valueCents: "", deadline: "",
    notes: "", internalNotes: "", assignedStaffId: "",
  });

  const createMutation = trpc.opportunities.create.useMutation({
    onSuccess: () => {
      toast.success("Opportunity created");
      setShowCreate(false);
      utils.opportunities.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = opportunities?.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || o.type === typeFilter;
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Opportunities" subtitle="Career pipeline across all athletes">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />Add Opportunity
        </Button>
      </PageHeader>

      {/* Pipeline kanban summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {OPP_STATUSES.map(s => (
          <div key={s} className="bg-card border border-border rounded-lg p-2 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}>
            <p className="text-lg font-bold">{opportunities?.filter(o => o.status === s).length ?? 0}</p>
            <p className="text-xs text-muted-foreground leading-tight">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", ...OPP_TYPES].map(t => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="text-xs">
              {t}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No opportunities found" action={<Button onClick={() => setShowCreate(true)}>Add Opportunity</Button>} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Opportunity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Athlete</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Value</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/opportunities/${o.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{o.title}</p>
                      {o.aiMatchScore && Number(o.aiMatchScore) >= 80 && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    {o.organization && <p className="text-xs text-muted-foreground">{o.organization}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm">{o.athleteId ?? "—"}</td>
                  <td className="px-4 py-3"><OpportunityTypeBadge type={o.type} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell font-semibold">{o.valueCents ? formatCurrency(o.valueCents) : "—"}</td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">{formatDate(o.deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Athlete *</Label>
              <Select value={form.athleteId} onValueChange={v => setForm(f => ({...f, athleteId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select athlete" /></SelectTrigger>
                <SelectContent>{athletes?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{OPP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{OPP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Organization</Label><Input value={form.organization} onChange={e => setForm(f => ({...f, organization: e.target.value}))} className="mt-1" /></div>
            <div><Label>Potential Value (USD)</Label><Input type="number" value={form.valueCents} onChange={e => setForm(f => ({...f, valueCents: e.target.value}))} className="mt-1" /></div>
            <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1" /></div>
            <div className="col-span-2"><Label>Notes (visible to athlete)</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="mt-1" /></div>
            <div className="col-span-2"><Label>Internal Notes (admin only)</Label><Textarea value={form.internalNotes} onChange={e => setForm(f => ({...f, internalNotes: e.target.value}))} rows={2} className="mt-1 border-amber-200 bg-amber-50/30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                ...form,
                athleteId: Number(form.athleteId),
                valueCents: form.valueCents ? Number(form.valueCents) * 100 : undefined,
                type: form.type as any,
                status: form.status as any,
              })}
              disabled={!form.title || !form.athleteId || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: opp, isLoading } = trpc.opportunities.getById.useQuery({ id: Number(id) });

  const updateMutation = trpc.opportunities.update.useMutation({
    onSuccess: () => {
      toast.success("Opportunity updated");
      setEditMode(false);
      utils.opportunities.getById.invalidate({ id: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!opp) return <EmptyState icon={Briefcase} title="Opportunity not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/opportunities">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <OpportunityTypeBadge type={opp.type} />
        <StatusBadge status={opp.status} size="md" />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{opp.title}</h1>
          {opp.organization && <p className="text-muted-foreground">{opp.organization}</p>}
          {opp.athleteId && <p className="text-sm text-muted-foreground">Athlete ID: {opp.athleteId}</p>}
        </div>
        <div className="flex items-center gap-3">
          {opp.valueCents && (
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(opp.valueCents)}</p>
              <p className="text-xs text-muted-foreground">Potential Value</p>
            </div>
          )}
          <Button onClick={() => { setEditForm({...opp}); setEditMode(true); }} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {opp.description && <SectionCard title="Description"><p className="text-sm leading-relaxed">{opp.description}</p></SectionCard>}
          {opp.notes && <SectionCard title="Notes (Athlete-Visible)"><p className="text-sm leading-relaxed">{opp.notes}</p></SectionCard>}
          {opp.notes && (
            <SectionCard title="Internal Notes (Admin Only)" className="border-amber-200 bg-amber-50/30">
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
              {opp.valueCents && <div><dt className="text-xs text-muted-foreground">Value</dt><dd className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(opp.valueCents)}</dd></div>}
              {opp.aiMatchScore && <div><dt className="text-xs text-muted-foreground">AI Match Score</dt><dd className="text-sm font-medium mt-0.5">{opp.aiMatchScore}%</dd></div>}
            </dl>
          </SectionCard>
        </div>
      </div>

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title</Label><Input value={editForm.title ?? ""} onChange={e => setEditForm((f: any) => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status ?? "Identified"} onValueChange={v => setEditForm((f: any) => ({...f, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{OPP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Value (USD)</Label><Input type="number" value={editForm.valueCents ? editForm.valueCents / 100 : ""} onChange={e => setEditForm((f: any) => ({...f, valueCents: Number(e.target.value) * 100}))} className="mt-1" /></div>
            <div><Label>Deadline</Label><Input type="date" value={editForm.deadline?.split("T")[0] ?? ""} onChange={e => setEditForm((f: any) => ({...f, deadline: e.target.value}))} className="mt-1" /></div>
            <div><Label>Notes (athlete-visible)</Label><Textarea value={editForm.notes ?? ""} onChange={e => setEditForm((f: any) => ({...f, notes: e.target.value}))} rows={2} className="mt-1" /></div>
            <div><Label>Internal Notes</Label><Textarea value={editForm.internalNotes ?? ""} onChange={e => setEditForm((f: any) => ({...f, internalNotes: e.target.value}))} rows={2} className="mt-1 border-amber-200 bg-amber-50/30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: Number(id), ...editForm })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOpportunities() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <AdminOpportunityDetail />;
  return <AdminOpportunitiesList />;
}
