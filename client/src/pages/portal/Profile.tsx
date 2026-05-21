import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, EmptyState, formatDate, getRoleLabel } from "@/components/shared";
import { toast } from "sonner";
import { User, Users, Heart, Edit, Plus, Trash2, Instagram, Twitter, Mail, Phone, MapPin, Calendar, Trophy } from "lucide-react";

export default function AthleteProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.athletes.getMyProfile.useQuery();
  const { data: teamMembers } = trpc.athletes.getTeamMembers.useQuery(
    { athleteId: profile?.id ?? 0 },
    { enabled: !!profile?.id }
  );
  const { data: familyMembers } = trpc.athletes.getFamilyMembers.useQuery(
    { athleteId: profile?.id ?? 0 },
    { enabled: !!profile?.id }
  );

  const [updateDialog, setUpdateDialog] = useState<{ field: string; label: string; current: string } | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [updateReason, setUpdateReason] = useState("");

  const submitRequest = trpc.athletes.submitUpdateRequest.useMutation({
    onSuccess: () => {
      toast.success("Update request submitted for review");
      setUpdateDialog(null);
      setUpdateValue("");
      setUpdateReason("");
    },
    onError: () => toast.error("Failed to submit request"),
  });

  const openUpdateDialog = (field: string, label: string, current: string) => {
    setUpdateDialog({ field, label, current });
    setUpdateValue(current);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title="Profile not set up yet"
        description="Your management team will set up your profile. Contact them if you need assistance."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="View and request updates to your athlete profile" />

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview"><User className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-2" />Team Members</TabsTrigger>
          <TabsTrigger value="family"><Heart className="h-4 w-4 mr-2" />Family</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile header */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={profile.photoUrl ?? ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                    <p className="text-muted-foreground">{profile.sport} {profile.position ? `· ${profile.position}` : ""}</p>
                    {profile.team && <p className="text-sm text-muted-foreground">{profile.team}{profile.league ? ` · ${profile.league}` : ""}</p>}
                  </div>
                  <StatusBadge status={profile.representationStatus} size="md" />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.email && (
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>
                  )}
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-3">
                  {profile.instagramHandle && (
                    <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-pink-600 hover:underline">
                      <Instagram className="h-3.5 w-3.5" />@{profile.instagramHandle}
                    </a>
                  )}
                  {profile.twitterHandle && (
                    <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-sky-600 hover:underline">
                      <Twitter className="h-3.5 w-3.5" />@{profile.twitterHandle}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Bio */}
          <SectionCard
            title="Biography"
            action={
              <Button variant="ghost" size="sm" onClick={() => openUpdateDialog("bio", "Biography", profile.bio ?? "")}>
                <Edit className="h-3.5 w-3.5 mr-1" /> Request Update
              </Button>
            }
          >
            {profile.bio ? (
              <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No biography on file. Request an update to add one.</p>
            )}
          </SectionCard>

          {/* Legal fields — read-only with update request */}
          <SectionCard title="Legal & Contact Information" subtitle="To update these fields, submit a change request for admin review">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { field: "firstName", label: "First Name", value: profile.firstName },
                { field: "lastName", label: "Last Name", value: profile.lastName },
                { field: "email", label: "Email Address", value: profile.email },
                { field: "phone", label: "Phone Number", value: profile.phone ?? "" },
                { field: "dateOfBirth", label: "Date of Birth", value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "" },
                { field: "nationality", label: "Nationality", value: profile.nationality ?? "" },
              ].map(({ field, label, value }) => (
                <div key={field} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium">{value || "—"}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary h-7 px-2"
                    onClick={() => openUpdateDialog(field, label, value)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Social media */}
          <SectionCard
            title="Social Media"
            action={
              <Button variant="ghost" size="sm" onClick={() => openUpdateDialog("instagramHandle", "Instagram Handle", profile.instagramHandle ?? "")}>
                <Edit className="h-3.5 w-3.5 mr-1" /> Request Update
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Instagram className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Instagram</p>
                  <p className="text-sm font-medium">{profile.instagramHandle ? `@${profile.instagramHandle}` : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Twitter className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Twitter / X</p>
                  <p className="text-sm font-medium">{profile.twitterHandle ? `@${profile.twitterHandle}` : "—"}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="team">
          <SectionCard
            title="Team Members"
            subtitle="Your representation and support team"
          >
            {!teamMembers || teamMembers.length === 0 ? (
              <EmptyState icon={Users} title="No team members" description="Your management team will add team members here." />
            ) : (
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-sm">
                        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{member.name}</p>
                        {member.isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.role}{member.company ? ` · ${member.company}` : ""}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {member.email && <p>{member.email}</p>}
                      {member.phone && <p>{member.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="family">
          <SectionCard
            title="Family Members"
            subtitle="Family members with portal access"
          >
            {!familyMembers || familyMembers.length === 0 ? (
              <EmptyState icon={Heart} title="No family members" description="Your management team can add family members with appropriate access." />
            ) : (
              <div className="space-y-3">
                {familyMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-pink-100 text-pink-700 font-semibold text-sm">
                        {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.relationship}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {member.canViewContracts && <Badge variant="outline" className="text-xs">Contracts</Badge>}
                      {member.canViewFinancials && <Badge variant="outline" className="text-xs">Financials</Badge>}
                      {member.canMessage && <Badge variant="outline" className="text-xs">Messaging</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* Update Request Dialog */}
      <Dialog open={!!updateDialog} onOpenChange={() => setUpdateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Update: {updateDialog?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Current Value</Label>
              <p className="text-sm font-medium mt-1 p-2 bg-muted rounded">{updateDialog?.current || "—"}</p>
            </div>
            <div>
              <Label htmlFor="new-value">Requested New Value</Label>
              <Input
                id="new-value"
                value={updateValue}
                onChange={e => setUpdateValue(e.target.value)}
                placeholder={`Enter new ${updateDialog?.label?.toLowerCase()}`}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                value={updateReason}
                onChange={e => setUpdateReason(e.target.value)}
                placeholder="Briefly explain why this update is needed..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!profile || !updateDialog || !updateValue) return;
                submitRequest.mutate({
                  athleteId: profile.id,
                  fieldName: updateDialog.field,
                  currentValue: updateDialog.current,
                  requestedValue: updateValue,
                  reason: updateReason,
                });
              }}
              disabled={!updateValue || submitRequest.isPending}
            >
              {submitRequest.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
