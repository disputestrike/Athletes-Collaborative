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
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { ShieldCheck, Plus, Search, ArrowLeft, CheckCircle, X, Clock, AlertCircle, Eye } from "lucide-react";

const COMPLIANCE_TYPES = ["Disclosure", "Medical Clearance", "Background Check", "Drug Testing Consent", "Financial Disclosure", "Travel Authorization", "Media Release"];
const COMPLIANCE_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export function AdminComplianceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: forms, isLoading } = trpc.compliance.list.useQuery({});
  const { data: athletes } = trpc.admin.getAthletes.useQuery();

  const [form, setForm] = useState({
    title: "", athleteId: "", type: "Disclosure", description: "", dueDate: "",
  });

  const createMutation = trpc.compliance.create.useMutation({
    onSuccess: () => {
      toast.success("Compliance form assigned");
      setShowCreate(false);
      utils.compliance.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = forms?.filter(f => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  const pendingReview = forms?.filter(f => f.status === "SUBMITTED" || f.status === "UNDER_REVIEW") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance" subtitle="Review and manage all athlete compliance forms">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />Assign Form
        </Button>
      </PageHeader>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {COMPLIANCE_STATUSES.map(s => {
          const count = forms?.filter(f => f.status === s).length ?? 0;
          const colors: Record<string, string> = {
            DRAFT: "bg-gray-50 border-gray-200",
            SUBMITTED: "bg-violet-50 border-violet-200",
            UNDER_REVIEW: "bg-blue-50 border-blue-200",
            APPROVED: "bg-emerald-50 border-emerald-200",
            REJECTED: "bg-red-50 border-red-200",
          };
          return (
            <div key={s} className={`${colors[s]} border rounded-lg p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{s.replace("_", " ")}</p>
            </div>
          );
        })}
      </div>

      {/* Pending review alert */}
      {pendingReview.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">{pendingReview.length} Form{pendingReview.length > 1 ? "s" : ""} Awaiting Review</p>
            <p className="text-xs text-blue-600">Click on a form below to review and approve or reject.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search forms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No compliance forms" action={<Button onClick={() => setShowCreate(true)}>Assign Form</Button>} />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Form</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Athlete</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(f => {
                const isDue = f.dueDate && new Date(f.dueDate) < new Date() && !["APPROVED", "REJECTED"].includes(f.status);
                return (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/compliance/${f.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{f.title}</p>
                        {isDue && <AlertCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm">{f.athleteId ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{f.type}</Badge></td>
                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">{formatDate(f.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign Compliance Form</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Athlete *</Label>
              <Select value={form.athleteId} onValueChange={v => setForm(f => ({...f, athleteId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select athlete" /></SelectTrigger>
                <SelectContent>{athletes?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Form Type *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{COMPLIANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ ...form, athleteId: Number(form.athleteId), type: form.type as any })}
              disabled={!form.title || !form.athleteId || createMutation.isPending}
            >
              {createMutation.isPending ? "Assigning..." : "Assign Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminComplianceDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: form, isLoading } = trpc.compliance.getById.useQuery({ id: Number(id) });

  const reviewMutation = trpc.compliance.review.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Form ${vars.action === "approve" ? "approved" : "rejected"}`);
      utils.compliance.getById.invalidate({ id: Number(id) });
      utils.compliance.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const startReviewMutation = trpc.compliance.startReview.useMutation({
    onSuccess: () => {
      toast.success("Form moved to Under Review");
      utils.compliance.getById.invalidate({ id: Number(id) });
    },
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!form) return <EmptyState icon={ShieldCheck} title="Form not found" />;

  const canReview = form.status === "SUBMITTED" || form.status === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/compliance">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <StatusBadge status={form.status} size="md" />
        <Badge variant="outline">{form.type}</Badge>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{form.title}</h1>
          {form.athleteId && <p className="text-muted-foreground">Athlete ID: {form.athleteId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {form.description && <SectionCard title="Form Description"><p className="text-sm leading-relaxed">{form.description}</p></SectionCard>}

          {form.athleteNotes && (
            <SectionCard title="Athlete Notes">
              <p className="text-sm leading-relaxed">{form.athleteNotes}</p>
            </SectionCard>
          )}

          {/* Review action */}
          {canReview && (
            <SectionCard title="Review Decision">
              <div className="space-y-3">
                {form.status === "SUBMITTED" && (
                  <Button variant="outline" onClick={() => startReviewMutation.mutate({ id: form.id })} className="gap-2 mb-2">
                    <Clock className="h-4 w-4" />Mark as Under Review
                  </Button>
                )}
                <div>
                  <Label>Reviewer Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Add notes for the athlete about this decision..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => reviewMutation.mutate({ id: form.id, action: "approve", reviewerNotes: reviewNotes || undefined })}
                    disabled={reviewMutation.isPending}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />Approve
                  </Button>
                  <Button
                    onClick={() => reviewMutation.mutate({ id: form.id, action: "reject", reviewerNotes: reviewNotes || undefined })}
                    disabled={reviewMutation.isPending}
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />Reject
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {form.reviewerNotes && (
            <SectionCard title="Reviewer Notes">
              <p className="text-sm leading-relaxed">{form.reviewerNotes}</p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Form Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="text-sm font-medium mt-0.5">{form.type}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={form.status} /></dd></div>
              {form.dueDate && <div><dt className="text-xs text-muted-foreground">Due Date</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.dueDate)}</dd></div>}
              {form.submittedAt && <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.submittedAt)}</dd></div>}
              {form.reviewedAt && <div><dt className="text-xs text-muted-foreground">Reviewed</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.reviewedAt)}</dd></div>}
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompliance() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <AdminComplianceDetail />;
  return <AdminComplianceList />;
}
