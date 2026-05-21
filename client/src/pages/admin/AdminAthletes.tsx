import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatDate, formatCurrency } from "@/components/shared";
import { toast } from "sonner";
import { Users, Plus, Search, ArrowLeft, Edit, Mail, Phone, MapPin, Instagram, Twitter, FileText, Briefcase, ShieldCheck, Megaphone, CheckCircle, X } from "lucide-react";

const REPRESENTATION_STATUSES = ["active", "pending", "inactive", "prospective"];
const SPORTS = ["Football", "Basketball", "Baseball", "Soccer", "Tennis", "Golf", "Track & Field", "Swimming", "Boxing", "MMA", "Hockey", "Volleyball", "Other"];

export function AdminAthletesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: athletes, isLoading } = trpc.admin.getAthletes.useQuery();

  const createMutation = trpc.admin.createAthlete.useMutation({
    onSuccess: () => {
      toast.success("Athlete created");
      setShowCreate(false);
      utils.admin.getAthletes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", sport: "", position: "",
    team: "", league: "", representationStatus: "prospective", bio: "",
    city: "", state: "", country: "", nationality: "",
    instagramHandle: "", twitterHandle: "",
    dateOfBirth: "",
  });

  const filtered = athletes?.filter(a => {
    const matchSearch = !search || `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) || (a.sport ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.representationStatus === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Athletes" subtitle="Manage all athlete profiles and representation">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />Add Athlete
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search athletes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", ...REPRESENTATION_STATUSES].map(s => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPRESENTATION_STATUSES.map(s => (
          <div key={s} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{athletes?.filter(a => a.representationStatus === s).length ?? 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </div>
        ))}
      </div>

      {/* Athletes grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No athletes found" description="Add your first athlete to get started." action={<Button onClick={() => setShowCreate(true)}>Add Athlete</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(athlete => (
            <Link key={athlete.id} href={`/admin/athletes/${athlete.id}`}>
              <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={athlete.photoUrl ?? ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {athlete.firstName[0]}{athlete.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{athlete.firstName} {athlete.lastName}</h3>
                      <StatusBadge status={athlete.representationStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground">{athlete.sport}{athlete.position ? ` · ${athlete.position}` : ""}</p>
                    {athlete.team && <p className="text-xs text-muted-foreground">{athlete.team}</p>}
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  {athlete.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 flex-shrink-0" />{athlete.email}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create athlete dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Athlete</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} className="mt-1" /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Sport</Label>
              <Select value={form.sport} onValueChange={v => setForm(f => ({...f, sport: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Position</Label><Input value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} className="mt-1" /></div>
            <div><Label>Team</Label><Input value={form.team} onChange={e => setForm(f => ({...f, team: e.target.value}))} className="mt-1" /></div>
            <div><Label>League</Label><Input value={form.league} onChange={e => setForm(f => ({...f, league: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Representation Status</Label>
              <Select value={form.representationStatus} onValueChange={v => setForm(f => ({...f, representationStatus: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REPRESENTATION_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({...f, dateOfBirth: e.target.value}))} className="mt-1" /></div>
            <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm(f => ({...f, nationality: e.target.value}))} className="mt-1" /></div>
            <div><Label>City</Label><Input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className="mt-1" /></div>
            <div><Label>Instagram Handle</Label><Input value={form.instagramHandle} onChange={e => setForm(f => ({...f, instagramHandle: e.target.value}))} placeholder="@handle" className="mt-1" /></div>
            <div><Label>Twitter Handle</Label><Input value={form.twitterHandle} onChange={e => setForm(f => ({...f, twitterHandle: e.target.value}))} placeholder="@handle" className="mt-1" /></div>
            <div className="col-span-2"><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.firstName || !form.lastName || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Athlete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminAthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [editMode, setEditMode] = useState(false);

  const { data: athlete, isLoading } = trpc.admin.getAthleteById.useQuery({ id: Number(id) });
  const { data: contracts } = trpc.contracts.list.useQuery({ athleteId: Number(id) });
  const { data: opportunities } = trpc.opportunities.list.useQuery({ athleteId: Number(id) });
  const { data: compliance } = trpc.compliance.list.useQuery({ athleteId: Number(id) });
  const { data: campaigns } = trpc.campaigns.list.useQuery({ athleteId: Number(id) });
  const { data: updateRequests } = trpc.admin.getUpdateRequests.useQuery({ athleteId: Number(id) });

  const updateMutation = trpc.admin.updateAthlete.useMutation({
    onSuccess: () => {
      toast.success("Athlete updated");
      setEditMode(false);
      utils.admin.getAthleteById.invalidate({ id: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });

  const approveRequest = trpc.admin.approveUpdateRequest.useMutation({
    onSuccess: () => {
      toast.success("Update request approved");
      utils.admin.getUpdateRequests.invalidate({ athleteId: Number(id) });
      utils.admin.getAthleteById.invalidate({ id: Number(id) });
    },
  });

  const rejectRequest = trpc.admin.rejectUpdateRequest.useMutation({
    onSuccess: () => {
      toast.success("Update request rejected");
      utils.admin.getUpdateRequests.invalidate({ athleteId: Number(id) });
    },
  });

  const [editForm, setEditForm] = useState<any>({});

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!athlete) return <EmptyState icon={Users} title="Athlete not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/athletes">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Athletes</Button>
        </Link>
        <StatusBadge status={athlete.representationStatus} size="md" />
      </div>

      {/* Profile header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/20">
            <AvatarImage src={athlete.photoUrl ?? ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {athlete.firstName[0]}{athlete.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{athlete.firstName} {athlete.lastName}</h1>
            <p className="text-muted-foreground">{athlete.sport}{athlete.position ? ` · ${athlete.position}` : ""}</p>
            {athlete.team && <p className="text-sm text-muted-foreground">{athlete.team}{athlete.league ? ` · ${athlete.league}` : ""}</p>}
          </div>
        </div>
        <Button onClick={() => { setEditForm({...athlete}); setEditMode(true); }} variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />Edit Profile
        </Button>
      </div>

      {/* Pending update requests */}
      {updateRequests && updateRequests.filter(r => r.status === "pending").length > 0 && (
        <SectionCard title="Pending Update Requests" className="border-amber-200 bg-amber-50/30">
          <div className="space-y-3">
            {updateRequests.filter(r => r.status === "pending").map(req => (
              <div key={req.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Field: <span className="text-primary">{req.fieldName}</span></p>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                    <div><span className="text-muted-foreground">Current: </span>{req.currentValue || "—"}</div>
                    <div><span className="text-muted-foreground">Requested: </span><span className="font-medium text-foreground">{req.requestedValue}</span></div>
                  </div>
                  {req.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {req.reason}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => approveRequest.mutate({ id: req.id })}>
                    <CheckCircle className="h-3 w-3 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => rejectRequest.mutate({ id: req.id })}>
                    <X className="h-3 w-3 mr-1" />Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts ({contracts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities ({opportunities?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance ({compliance?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns ({campaigns?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title="Contact Information">
              <dl className="space-y-2">
                {[
                  { label: "Email", value: athlete.email, icon: Mail },
                  { label: "Phone", value: athlete.phone, icon: Phone },
                  { label: "Location", value: [athlete.city, athlete.state, athlete.country].filter(Boolean).join(", "), icon: MapPin },
                  { label: "Nationality", value: athlete.nationality },
                  { label: "Date of Birth", value: formatDate(athlete.dateOfBirth) },
                ].map(({ label, value, icon: Icon }) => value ? (
                  <div key={label} className="flex items-center gap-2">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                    <div>
                      <span className="text-xs text-muted-foreground">{label}: </span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  </div>
                ) : null)}
              </dl>
            </SectionCard>
            <SectionCard title="Social Media">
              <div className="space-y-2">
                {athlete.instagramHandle && (
                  <a href={`https://instagram.com/${athlete.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                    <Instagram className="h-4 w-4" />@{athlete.instagramHandle}
                  </a>
                )}
                {athlete.twitterHandle && (
                  <a href={`https://twitter.com/${athlete.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-sky-600 hover:underline">
                    <Twitter className="h-4 w-4" />@{athlete.twitterHandle}
                  </a>
                )}
                {!athlete.instagramHandle && !athlete.twitterHandle && (
                  <p className="text-sm text-muted-foreground">No social media on file</p>
                )}
              </div>
            </SectionCard>
          </div>
          {athlete.bio && (
            <SectionCard title="Biography">
              <p className="text-sm leading-relaxed">{athlete.bio}</p>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">All Contracts</h3>
            <Link href={`/admin/contracts/new?athleteId=${id}`}>
              <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add Contract</Button>
            </Link>
          </div>
          {!contracts || contracts.length === 0 ? (
            <EmptyState icon={FileText} title="No contracts" description="Add a contract for this athlete." />
          ) : (
            <div className="space-y-2">
              {contracts.map(c => (
                <Link key={c.id} href={`/admin/contracts/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><StatusBadge status={c.status} /><p className="text-sm font-medium truncate">{c.title}</p></div>
                      <p className="text-xs text-muted-foreground">{c.counterparty ?? "—"} · {formatDate(c.startDate)} – {formatDate(c.endDate)}</p>
                    </div>
                    {c.valueCents && <p className="text-sm font-semibold flex-shrink-0">{formatCurrency(c.valueCents)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">All Opportunities</h3>
            <Link href={`/admin/opportunities/new?athleteId=${id}`}>
              <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Add Opportunity</Button>
            </Link>
          </div>
          {!opportunities || opportunities.length === 0 ? (
            <EmptyState icon={Briefcase} title="No opportunities" />
          ) : (
            <div className="space-y-2">
              {opportunities.map(o => (
                <Link key={o.id} href={`/admin/opportunities/${o.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><StatusBadge status={o.status} /><Badge variant="outline" className="text-xs">{o.type}</Badge><p className="text-sm font-medium truncate">{o.title}</p></div>
                      {o.organization && <p className="text-xs text-muted-foreground">{o.organization}</p>}
                    </div>
                    {o.valueCents && <p className="text-sm font-semibold flex-shrink-0">{formatCurrency(o.valueCents)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Compliance Forms</h3>
            <Link href={`/admin/compliance/new?athleteId=${id}`}>
              <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Assign Form</Button>
            </Link>
          </div>
          {!compliance || compliance.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No compliance forms" />
          ) : (
            <div className="space-y-2">
              {compliance.map(f => (
                <Link key={f.id} href={`/admin/compliance/${f.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><StatusBadge status={f.status} /><Badge variant="outline" className="text-xs">{f.type}</Badge><p className="text-sm font-medium truncate">{f.title}</p></div>
                      {f.dueDate && <p className="text-xs text-muted-foreground">Due {formatDate(f.dueDate)}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          {!campaigns || campaigns.length === 0 ? (
            <EmptyState icon={Megaphone} title="No campaigns" />
          ) : (
            <div className="space-y-2">
              {campaigns.map(c => (
                <Link key={c.id} href={`/admin/campaigns/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><StatusBadge status={c.status} /><p className="text-sm font-medium truncate">{c.name}</p></div>
                      {c.brand && <p className="text-xs text-muted-foreground">{c.brand}</p>}
                    </div>
                    {c.budgetCents && <p className="text-sm font-semibold flex-shrink-0">{formatCurrency(c.budgetCents)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Athlete Profile</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>First Name</Label><Input value={editForm.firstName ?? ""} onChange={e => setEditForm((f: any) => ({...f, firstName: e.target.value}))} className="mt-1" /></div>
            <div><Label>Last Name</Label><Input value={editForm.lastName ?? ""} onChange={e => setEditForm((f: any) => ({...f, lastName: e.target.value}))} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={editForm.email ?? ""} onChange={e => setEditForm((f: any) => ({...f, email: e.target.value}))} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={editForm.phone ?? ""} onChange={e => setEditForm((f: any) => ({...f, phone: e.target.value}))} className="mt-1" /></div>
            <div><Label>Sport</Label><Input value={editForm.sport ?? ""} onChange={e => setEditForm((f: any) => ({...f, sport: e.target.value}))} className="mt-1" /></div>
            <div><Label>Position</Label><Input value={editForm.position ?? ""} onChange={e => setEditForm((f: any) => ({...f, position: e.target.value}))} className="mt-1" /></div>
            <div><Label>Team</Label><Input value={editForm.team ?? ""} onChange={e => setEditForm((f: any) => ({...f, team: e.target.value}))} className="mt-1" /></div>
            <div><Label>League</Label><Input value={editForm.league ?? ""} onChange={e => setEditForm((f: any) => ({...f, league: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Representation Status</Label>
              <Select value={editForm.representationStatus ?? "prospective"} onValueChange={v => setEditForm((f: any) => ({...f, representationStatus: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REPRESENTATION_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Instagram Handle</Label><Input value={editForm.instagramHandle ?? ""} onChange={e => setEditForm((f: any) => ({...f, instagramHandle: e.target.value}))} className="mt-1" /></div>
            <div className="col-span-2"><Label>Bio</Label><Textarea value={editForm.bio ?? ""} onChange={e => setEditForm((f: any) => ({...f, bio: e.target.value}))} rows={3} className="mt-1" /></div>
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

export default function AdminAthletes() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <AdminAthleteDetail />;
  return <AdminAthletesList />;
}
