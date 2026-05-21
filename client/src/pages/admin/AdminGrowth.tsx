import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, EmptyState, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { BookOpen, Building2, Heart, Plus, Star, ExternalLink, Trash2 } from "lucide-react";

const MATERIAL_TYPES = ["Article", "Video", "Course", "Webinar", "Podcast", "E-Book", "Guide"];
const MATERIAL_CATEGORIES = ["Financial Planning", "Tax", "Legal", "Insurance", "Real Estate", "Investment", "Banking", "Career Development", "Mental Health", "Nutrition", "Other"];
const PARTNER_CATEGORIES = ["Financial Planning", "Tax", "Legal", "Insurance", "Real Estate", "Investment", "Banking", "Other"];
const OUTREACH_TYPES = ["Community Event", "Charity", "Youth Program", "Speaking", "Mentorship", "Fundraiser", "Other"];
const OUTREACH_STATUSES = ["Active", "Upcoming", "Completed", "Cancelled"];

export default function AdminGrowth() {
  const [activeTab, setActiveTab] = useState("materials");
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showCreatePartner, setShowCreatePartner] = useState(false);
  const [showCreateOutreach, setShowCreateOutreach] = useState(false);
  const utils = trpc.useUtils();

  const { data: materials } = trpc.growth.getMaterials.useQuery();
  const { data: partners } = trpc.growth.getPartners.useQuery();
  const { data: outreach } = trpc.growth.getOutreach.useQuery();

  const [matForm, setMatForm] = useState({ title: "", type: "Article", category: "Financial Planning", description: "", url: "", isFeatured: false });
  const [partForm, setPartForm] = useState({ name: "", category: "Financial Planning", description: "", website: "", contactEmail: "", contactPhone: "", isFeatured: false });
  const [outForm, setOutForm] = useState({ title: "", type: "Community Event", status: "Upcoming", description: "", date: "", location: "" });

  const createMaterial = trpc.growth.createMaterial.useMutation({
    onSuccess: () => { toast.success("Resource added"); setShowCreateMaterial(false); utils.growth.getMaterials.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const createPartner = trpc.growth.createPartner.useMutation({
    onSuccess: () => { toast.success("Partner added"); setShowCreatePartner(false); utils.growth.getPartners.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const createOutreach = trpc.growth.createOutreach.useMutation({
    onSuccess: () => { toast.success("Program added"); setShowCreateOutreach(false); utils.growth.getOutreach.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Growth Content" subtitle="Manage educational resources, business partners, and community programs" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="materials"><BookOpen className="h-4 w-4 mr-2" />Resources ({materials?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="partners"><Building2 className="h-4 w-4 mr-2" />Partners ({partners?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="outreach"><Heart className="h-4 w-4 mr-2" />Outreach ({outreach?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateMaterial(true)} className="gap-2"><Plus className="h-4 w-4" />Add Resource</Button>
          </div>
          {!materials || materials.length === 0 ? (
            <EmptyState icon={BookOpen} title="No resources" action={<Button onClick={() => setShowCreateMaterial(true)}>Add Resource</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-xs">{m.type}</Badge>
                        {m.isFeatured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                      </div>
                      <h4 className="font-semibold text-sm">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">{m.category}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                    </div>
                  </div>
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex">
                      <Button variant="outline" size="sm" className="text-xs gap-1"><ExternalLink className="h-3 w-3" />Open</Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreatePartner(true)} className="gap-2"><Plus className="h-4 w-4" />Add Partner</Button>
          </div>
          {!partners || partners.length === 0 ? (
            <EmptyState icon={Building2} title="No partners" action={<Button onClick={() => setShowCreatePartner(true)}>Add Partner</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partners.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{p.category}</Badge>
                        {p.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <h4 className="font-semibold">{p.name}</h4>
                      {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {p.contactEmail && <p>{p.contactEmail}</p>}
                        {p.contactPhone && <p>{p.contactPhone}</p>}
                      </div>
                    </div>
                  </div>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex">
                      <Button variant="outline" size="sm" className="text-xs gap-1"><ExternalLink className="h-3 w-3" />Website</Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateOutreach(true)} className="gap-2"><Plus className="h-4 w-4" />Add Program</Button>
          </div>
          {!outreach || outreach.length === 0 ? (
            <EmptyState icon={Heart} title="No programs" action={<Button onClick={() => setShowCreateOutreach(true)}>Add Program</Button>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outreach.map(o => (
                <div key={o.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{o.type}</Badge>
                    <Badge className={`text-xs ${o.status === "Active" ? "bg-emerald-100 text-emerald-700" : o.status === "Upcoming" ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600"}`}>{o.status}</Badge>
                  </div>
                  <h4 className="font-semibold">{o.title}</h4>
                  {o.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{o.description}</p>}
                  {(o.date || o.location) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.date ? new Date(o.date).toLocaleDateString() : ""}{o.location ? ` · ${o.location}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Material Dialog */}
      <Dialog open={showCreateMaterial} onOpenChange={setShowCreateMaterial}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title *</Label><Input value={matForm.title} onChange={e => setMatForm(f => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={matForm.type} onValueChange={v => setMatForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={matForm.category} onValueChange={v => setMatForm(f => ({...f, category: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIAL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>URL</Label><Input value={matForm.url} onChange={e => setMatForm(f => ({...f, url: e.target.value}))} placeholder="https://" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={matForm.description} onChange={e => setMatForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={matForm.isFeatured} onCheckedChange={v => setMatForm(f => ({...f, isFeatured: v}))} />
              <Label>Featured</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateMaterial(false)}>Cancel</Button>
            <Button onClick={() => createMaterial.mutate(matForm as any)} disabled={!matForm.title || createMaterial.isPending}>
              {createMaterial.isPending ? "Adding..." : "Add Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={showCreatePartner} onOpenChange={setShowCreatePartner}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Name *</Label><Input value={partForm.name} onChange={e => setPartForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div>
              <Label>Category</Label>
              <Select value={partForm.category} onValueChange={v => setPartForm(f => ({...f, category: v}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PARTNER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Website</Label><Input value={partForm.website} onChange={e => setPartForm(f => ({...f, website: e.target.value}))} placeholder="https://" className="mt-1" /></div>
            <div><Label>Contact Email</Label><Input value={partForm.contactEmail} onChange={e => setPartForm(f => ({...f, contactEmail: e.target.value}))} className="mt-1" /></div>
            <div><Label>Contact Phone</Label><Input value={partForm.contactPhone} onChange={e => setPartForm(f => ({...f, contactPhone: e.target.value}))} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={partForm.description} onChange={e => setPartForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={partForm.isFeatured} onCheckedChange={v => setPartForm(f => ({...f, isFeatured: v}))} />
              <Label>Featured</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePartner(false)}>Cancel</Button>
            <Button onClick={() => createPartner.mutate(partForm as any)} disabled={!partForm.name || createPartner.isPending}>
              {createPartner.isPending ? "Adding..." : "Add Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Outreach Dialog */}
      <Dialog open={showCreateOutreach} onOpenChange={setShowCreateOutreach}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Outreach Program</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Title *</Label><Input value={outForm.title} onChange={e => setOutForm(f => ({...f, title: e.target.value}))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={outForm.type} onValueChange={v => setOutForm(f => ({...f, type: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTREACH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={outForm.status} onValueChange={v => setOutForm(f => ({...f, status: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Date</Label><Input type="date" value={outForm.date} onChange={e => setOutForm(f => ({...f, date: e.target.value}))} className="mt-1" /></div>
            <div><Label>Location</Label><Input value={outForm.location} onChange={e => setOutForm(f => ({...f, location: e.target.value}))} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={outForm.description} onChange={e => setOutForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateOutreach(false)}>Cancel</Button>
            <Button onClick={() => createOutreach.mutate(outForm as any)} disabled={!outForm.title || createOutreach.isPending}>
              {createOutreach.isPending ? "Adding..." : "Add Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
