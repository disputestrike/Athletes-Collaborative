import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Users, Heart, Mail, Phone, Building2, Star, Trash2 } from "lucide-react";

function TeamMembersTab() {
  const { data: athletes } = trpc.admin.getAthletes.useQuery();
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "", company: "", isPrimary: false });

  const { data: teamMembers, refetch } = trpc.athletes.getTeamMembers.useQuery(
    { athleteId: selectedAthleteId! },
    { enabled: !!selectedAthleteId }
  );

  const addMutation = trpc.athletes.addTeamMember.useMutation({
    onSuccess: () => { toast.success("Team member added"); setShowAdd(false); setForm({ name: "", role: "", email: "", phone: "", company: "", isPrimary: false }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.athletes.removeTeamMember.useMutation({
    onSuccess: () => { toast.success("Team member removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedAthleteId ? String(selectedAthleteId) : ""} onValueChange={v => setSelectedAthleteId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select athlete..." /></SelectTrigger>
            <SelectContent>
              {athletes?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedAthleteId && (
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Team Member
          </Button>
        )}
      </div>

      {selectedAthleteId && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Role</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Company</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!teamMembers || teamMembers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No team members yet</td></tr>
              ) : teamMembers.map(m => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.name}</p>
                      {m.isPrimary && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{m.role}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {m.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{m.email}</div>}
                      {m.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{m.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">{m.company ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMutation.mutate({ id: m.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedAthleteId && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Select an athlete to view their team members</p>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div><Label>Role *</Label><Input value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} placeholder="e.g. Agent, Attorney, Trainer" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label>Company</Label><Input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isPrimary} onCheckedChange={v => setForm(f => ({...f, isPrimary: v}))} />
              <Label>Primary Contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate({ ...form, athleteId: selectedAthleteId! })} disabled={!form.name || !form.role || addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FamilyMembersTab() {
  const { data: athletes } = trpc.admin.getAthletes.useQuery();
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "", email: "", phone: "", canViewContracts: false, canViewFinancials: false, canMessage: false });

  const { data: familyMembers, refetch } = trpc.athletes.getFamilyMembers.useQuery(
    { athleteId: selectedAthleteId! },
    { enabled: !!selectedAthleteId }
  );

  const addMutation = trpc.athletes.addFamilyMember.useMutation({
    onSuccess: () => { toast.success("Family member added"); setShowAdd(false); setForm({ name: "", relationship: "", email: "", phone: "", canViewContracts: false, canViewFinancials: false, canMessage: false }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.athletes.removeFamilyMember.useMutation({
    onSuccess: () => { toast.success("Family member removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedAthleteId ? String(selectedAthleteId) : ""} onValueChange={v => setSelectedAthleteId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select athlete..." /></SelectTrigger>
            <SelectContent>
              {athletes?.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.firstName} {a.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedAthleteId && (
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add Family Member
          </Button>
        )}
      </div>

      {selectedAthleteId && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Relationship</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Permissions</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!familyMembers || familyMembers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No family members yet</td></tr>
              ) : familyMembers.map(m => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{m.relationship}</Badge></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="space-y-0.5">
                      {m.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{m.email}</div>}
                      {m.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{m.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {m.canViewContracts && <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">Contracts</Badge>}
                      {m.canViewFinancials && <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Financials</Badge>}
                      {m.canMessage && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">Messaging</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMutation.mutate({ id: m.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedAthleteId && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Select an athlete to view their family members</p>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="mt-1" /></div>
            <div><Label>Relationship *</Label><Input value={form.relationship} onChange={e => setForm(f => ({...f, relationship: e.target.value}))} placeholder="e.g. Parent, Spouse, Sibling" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="mt-1" /></div>
            </div>
            <div className="space-y-2 pt-1">
              <Label className="text-sm font-semibold">Access Permissions</Label>
              <div className="flex items-center gap-2"><Switch checked={form.canViewContracts} onCheckedChange={v => setForm(f => ({...f, canViewContracts: v}))} /><Label>Can view contracts</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.canViewFinancials} onCheckedChange={v => setForm(f => ({...f, canViewFinancials: v}))} /><Label>Can view financials</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.canMessage} onCheckedChange={v => setForm(f => ({...f, canMessage: v}))} /><Label>Can send messages</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate({ ...form, athleteId: selectedAthleteId! })} disabled={!form.name || !form.relationship || addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminTeamFamily() {
  return (
    <div className="space-y-6">
      <PageHeader title="Team & Family" subtitle="Manage team members and family contacts for all athletes" />
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Team Members</TabsTrigger>
          <TabsTrigger value="family" className="gap-2"><Heart className="h-4 w-4" />Family Members</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-4"><TeamMembersTab /></TabsContent>
        <TabsContent value="family" className="mt-4"><FamilyMembersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
