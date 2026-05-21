import { useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatCurrency, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { FileText, Plus, Search, ArrowLeft, Edit, Lock, Eye, Calendar, DollarSign, AlertTriangle } from "lucide-react";

const CONTRACT_STATUSES = ["Draft", "Active", "Expired", "Terminated"];
const CONTRACT_TYPES = ["Representation", "Endorsement", "Sponsorship", "NIL", "Employment", "Licensing", "Service", "Other"];

export function AdminContractsList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: contracts, isLoading } = trpc.contracts.list.useQuery({});
  const { data: athletes } = trpc.admin.getAthletes.useQuery();

  const [form, setForm] = useState({
    title: "", athleteId: "", counterparty: "", contractType: "Representation",
    status: "Draft", valueCents: "", startDate: "", endDate: "", signedDate: "",
    renewalDate: "", athleteNote: "", internalNote: "", tags: "",
  });

  const createMutation = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Contract created");
      setShowCreate(false);
      utils.contracts.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = contracts?.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.counterparty ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  const renewingSoon = contracts?.filter(c => {
    if (!c.renewalDate || c.status !== "Active") return false;
    const days = (new Date(c.renewalDate).getTime() - Date.now()) / 86400000;
    return days <= 90 && days >= 0;
  }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Contracts" subtitle="Full contract lifecycle management">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />New Contract
        </Button>
      </PageHeader>

      {/* Renewal alerts */}
      {renewingSoon.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">{renewingSoon.length} Contract{renewingSoon.length > 1 ? "s" : ""} Renewing Within 90 Days</p>
            <p className="text-xs text-orange-600">{renewingSoon.map(c => c.title).join(", ")}</p>
          </div>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CONTRACT_STATUSES.map(s => (
          <div key={s} className="bg-card border border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}>
            <p className="text-xl font-bold">{contracts?.filter(c => c.status === s).length ?? 0}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", ...CONTRACT_STATUSES].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Contracts table */}
      {isLoading ? <TableSkeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No contracts found" action={<Button onClick={() => setShowCreate(true)}>New Contract</Button>} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contract</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Athlete</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Value</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/contracts/${c.id}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.title}</p>
                    {c.counterparty && <p className="text-xs text-muted-foreground">{c.counterparty}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm">{c.athleteId ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge variant="outline" className="text-xs">{c.contractType ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell font-semibold">
                    {c.valueCents ? formatCurrency(c.valueCents) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                    {formatDate(c.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Athlete *</Label>
              <Select value={form.athleteId} onValueChange={v => setForm(f => ({...f, athleteId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select athlete" /></SelectTrigger>
                <SelectContent>{athletes?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Counterparty</Label><Input value={form.counterparty} onChange={e => setForm(f => ({...f, counterparty: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Contract Type</Label>
              <Select value={form.contractType} onValueChange={v => setForm(f => ({...f, contractType: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Value (USD)</Label><Input type="number" value={form.valueCents} onChange={e => setForm(f => ({...f, valueCents: e.target.value}))} placeholder="e.g. 100000" className="mt-1" /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Signed Date</Label><Input type="date" value={form.signedDate} onChange={e => setForm(f => ({...f, signedDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Renewal Date</Label><Input type="date" value={form.renewalDate} onChange={e => setForm(f => ({...f, renewalDate: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2">
              <Label className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />Athlete-Visible Note</Label>
              <Textarea value={form.athleteNote} onChange={e => setForm(f => ({...f, athleteNote: e.target.value}))} rows={2} className="mt-1" placeholder="Visible to the athlete..." />
            </div>
            <div className="col-span-2">
              <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-amber-600" />Internal Note (Admin Only)</Label>
              <Textarea value={form.internalNote} onChange={e => setForm(f => ({...f, internalNote: e.target.value}))} rows={2} className="mt-1 border-amber-200 bg-amber-50/30" placeholder="Internal notes — not visible to athlete..." />
            </div>
            <div className="col-span-2"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="e.g. NIL, Priority, Renewal" className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                ...form,
                athleteId: Number(form.athleteId),
                valueCents: form.valueCents ? Number(form.valueCents) * 100 : undefined,
                status: form.status as any,
              })}
              disabled={!form.title || !form.athleteId || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminContractDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [editMode, setEditMode] = useState(false);

  const { data: contract, isLoading } = trpc.contracts.getById.useQuery({ id: Number(id) });
  const { data: athletes } = trpc.admin.getAthletes.useQuery();
  const [editForm, setEditForm] = useState<any>({});

  const updateMutation = trpc.contracts.update.useMutation({
    onSuccess: () => {
      toast.success("Contract updated");
      setEditMode(false);
      utils.contracts.getById.invalidate({ id: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!contract) return <EmptyState icon={FileText} title="Contract not found" />;

  const milestones = (() => { try { return JSON.parse(contract.milestones ?? "[]"); } catch { return []; } })();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/contracts">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <StatusBadge status={contract.status} size="md" />
        {contract.contractType && <Badge variant="outline">{contract.contractType}</Badge>}
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          {contract.counterparty && <p className="text-muted-foreground">{contract.counterparty}</p>}
          {contract.athleteId && <p className="text-sm text-muted-foreground">Athlete ID: {contract.athleteId}</p>}
        </div>
        <div className="flex items-center gap-3">
          {contract.valueCents && (
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(contract.valueCents)}</p>
              <p className="text-xs text-muted-foreground">Contract Value</p>
            </div>
          )}
          <Button onClick={() => { setEditForm({...contract}); setEditMode(true); }} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Key dates */}
          <SectionCard title="Key Dates">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Start", value: formatDate(contract.startDate) },
                { label: "End", value: formatDate(contract.endDate) },
                { label: "Signed", value: formatDate(contract.signedDate) },
                { label: "Renewal", value: formatDate(contract.renewalDate) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Athlete-visible note */}
          {contract.athleteNote && (
            <SectionCard title="Athlete-Visible Note">
              <p className="text-sm leading-relaxed">{contract.athleteNote}</p>
            </SectionCard>
          )}

          {/* Internal note — admin only */}
          {contract.adminNote && (
            <SectionCard title="Internal Note (Admin Only)" className="border-amber-200 bg-amber-50/30">
              <p className="text-sm leading-relaxed">{contract.adminNote}</p>
            </SectionCard>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <SectionCard title="Milestone Timeline">
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {milestones.map((m: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.date}{m.description ? ` · ${m.description}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Contract Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={contract.status} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="text-sm font-medium mt-0.5">{contract.contractType ?? "—"}</dd></div>
              {contract.valueCents && <div><dt className="text-xs text-muted-foreground">Value</dt><dd className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(contract.valueCents)}</dd></div>}
            </dl>
          </SectionCard>
          {contract.tags && (
            <SectionCard title="Tags">
              <div className="flex flex-wrap gap-2">
                {contract.tags.split(",").map(t => <Badge key={t} variant="secondary" className="text-xs">{t.trim()}</Badge>)}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Title</Label><Input value={editForm.title ?? ""} onChange={e => setEditForm((f: any) => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status ?? "Draft"} onValueChange={v => setEditForm((f: any) => ({...f, status: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Value (USD)</Label><Input type="number" value={editForm.valueCents ? editForm.valueCents / 100 : ""} onChange={e => setEditForm((f: any) => ({...f, valueCents: Number(e.target.value) * 100}))} className="mt-1" /></div>
            <div><Label>Start Date</Label><Input type="date" value={editForm.startDate?.split("T")[0] ?? ""} onChange={e => setEditForm((f: any) => ({...f, startDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>End Date</Label><Input type="date" value={editForm.endDate?.split("T")[0] ?? ""} onChange={e => setEditForm((f: any) => ({...f, endDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Renewal Date</Label><Input type="date" value={editForm.renewalDate?.split("T")[0] ?? ""} onChange={e => setEditForm((f: any) => ({...f, renewalDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Signed Date</Label><Input type="date" value={editForm.signedDate?.split("T")[0] ?? ""} onChange={e => setEditForm((f: any) => ({...f, signedDate: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2">
              <Label className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />Athlete-Visible Note</Label>
              <Textarea value={editForm.athleteNote ?? ""} onChange={e => setEditForm((f: any) => ({...f, athleteNote: e.target.value}))} rows={2} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-amber-600" />Internal Note (Admin Only)</Label>
              <Textarea value={editForm.internalNote ?? ""} onChange={e => setEditForm((f: any) => ({...f, internalNote: e.target.value}))} rows={2} className="mt-1 border-amber-200 bg-amber-50/30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: Number(id), ...editForm })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminContracts() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <AdminContractDetail />;
  return <AdminContractsList />;
}
