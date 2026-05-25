import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KPICard, PageHeader, SectionCard, StatusBadge } from "@/components/shared";
import ACLogo from "@/components/ACLogo";
import {
  Building2,
  CalendarDays,
  FileSignature,
  Globe2,
  Link as LinkIcon,
  Palette,
  Plus,
  RadioTower,
  Users,
} from "lucide-react";

const defaultTenant = {
  name: "",
  slug: "",
  status: "onboarding" as const,
  brandColor: "#F97316",
  accentColor: "#111827",
  logoUrl: "",
  heroImageUrl: "",
  publicDomain: "",
  portalDomain: "",
  googleWorkspaceDomain: "",
  signingProvider: "manual" as const,
  googleCalendarId: "",
  zoomAccountEmail: "",
  leadCaptureSlug: "",
  notes: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminTenants() {
  const utils = trpc.useUtils();
  const { data: tenants } = trpc.tenants.list.useQuery();
  const { data: overview } = trpc.tenants.overview.useQuery();
  const [form, setForm] = useState(defaultTenant);

  const createTenant = trpc.tenants.create.useMutation({
    onSuccess: async () => {
      setForm(defaultTenant);
      await Promise.all([utils.tenants.list.invalidate(), utils.tenants.overview.invalidate()]);
    },
  });

  const activeTenant = useMemo(() => tenants?.[0], [tenants]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        subtitle="Create tenant agencies, manage white-label branding, and choose signing and scheduling defaults."
      >
        <Badge variant="outline" className="gap-1">
          <Building2 className="h-3.5 w-3.5" />
          Parent: Athletes Collaborative
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Tenants" value={overview?.tenantCount ?? tenants?.length ?? 0} icon={Building2} iconColor="text-blue-600" subtitle="Companies" />
        <KPICard title="Active" value={overview?.activeTenants ?? 0} icon={Users} iconColor="text-emerald-600" subtitle="Live portals" />
        <KPICard title="Athlete Pages" value={overview?.athletePages ?? 0} icon={Globe2} iconColor="text-orange-600" subtitle="Shareable" />
        <KPICard title="Media Queue" value={overview?.pendingMedia ?? 0} icon={Palette} iconColor="text-amber-600" subtitle="Needs review" />
        <KPICard title="Open Leads" value={overview?.openLeads ?? 0} icon={RadioTower} iconColor="text-violet-600" subtitle="CRM pipeline" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <SectionCard title="White-label Companies" subtitle="Each company can brand its portal while staying under the parent platform.">
          <div className="space-y-4">
            {tenants?.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {tenant.logoUrl ? (
                      <img src={tenant.logoUrl} alt="" className="h-12 w-12 rounded-md object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-md border border-border flex items-center justify-center bg-muted">
                        <ACLogo variant="icon" size="sm" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{tenant.name}</h3>
                        <StatusBadge status={tenant.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">/{tenant.slug}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="gap-1"><FileSignature className="h-3 w-3" />{tenant.signingProvider}</Badge>
                        {tenant.googleCalendarId && <Badge variant="secondary" className="gap-1"><CalendarDays className="h-3 w-3" />Calendar</Badge>}
                        <Badge variant="secondary" className="gap-1"><RadioTower className="h-3 w-3" />SMS automation</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-8 w-8 rounded border border-border" style={{ backgroundColor: tenant.brandColor ?? "#F97316" }} />
                    <span className="h-8 w-8 rounded border border-border" style={{ backgroundColor: tenant.accentColor ?? "#111827" }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Public Lead Capture</p>
                    <p className="font-medium truncate">/lead/{tenant.leadCaptureSlug || tenant.slug}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Portal Domain</p>
                    <p className="font-medium truncate">{tenant.portalDomain || "Default platform domain"}</p>
                  </div>
                </div>
              </div>
            ))}

            {!tenants?.length && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No companies have been created yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Create Company" subtitle="This provisions a tenant shell for staff, athletes, CRM intake, and branding.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createTenant.mutate({
                ...form,
                slug: form.slug || slugify(form.name),
                leadCaptureSlug: form.leadCaptureSlug || form.slug || slugify(form.name),
                logoUrl: form.logoUrl || undefined,
                heroImageUrl: form.heroImageUrl || undefined,
                publicDomain: form.publicDomain || undefined,
                portalDomain: form.portalDomain || undefined,
                googleWorkspaceDomain: form.googleWorkspaceDomain || undefined,
                googleCalendarId: form.googleCalendarId || undefined,
                zoomAccountEmail: form.zoomAccountEmail || undefined,
                notes: form.notes || undefined,
              });
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="Company name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.slug || slugify(event.target.value) })}
              />
              <Input
                placeholder="company-slug"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input type="color" value={form.brandColor} onChange={(event) => setForm({ ...form, brandColor: event.target.value })} />
              <Input type="color" value={form.accentColor} onChange={(event) => setForm({ ...form, accentColor: event.target.value })} />
            </div>
            <Input placeholder="Logo image URL" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} />
            <Input placeholder="Hero image URL" value={form.heroImageUrl} onChange={(event) => setForm({ ...form, heroImageUrl: event.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Public domain" value={form.publicDomain} onChange={(event) => setForm({ ...form, publicDomain: event.target.value })} />
              <Input placeholder="Portal domain" value={form.portalDomain} onChange={(event) => setForm({ ...form, portalDomain: event.target.value })} />
            </div>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.signingProvider}
              onChange={(event) => setForm({ ...form, signingProvider: event.target.value as typeof form.signingProvider })}
            >
              <option value="manual">Manual signing</option>
              <option value="docusign">DocuSign</option>
              <option value="adobe_sign">Adobe Sign</option>
            </select>
            <Input placeholder="Google Calendar ID" value={form.googleCalendarId} onChange={(event) => setForm({ ...form, googleCalendarId: event.target.value })} />
            <Input placeholder="Zoom account email" value={form.zoomAccountEmail} onChange={(event) => setForm({ ...form, zoomAccountEmail: event.target.value })} />
            <Textarea placeholder="Internal notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <Button type="submit" className="w-full gap-2" disabled={createTenant.isPending}>
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </form>
        </SectionCard>
      </div>

      {activeTenant && (
        <SectionCard title="Current Testing Links" subtitle="These routes are wired into the existing application.">
          <div className="grid sm:grid-cols-3 gap-3">
            <a className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors" href={`/lead/${activeTenant.leadCaptureSlug || activeTenant.slug}`}>
              <LinkIcon className="h-4 w-4 mb-2 text-primary" />
              <p className="font-medium">Lead capture</p>
              <p className="text-xs text-muted-foreground truncate">/lead/{activeTenant.leadCaptureSlug || activeTenant.slug}</p>
            </a>
            <a className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors" href="/admin/crm">
              <RadioTower className="h-4 w-4 mb-2 text-primary" />
              <p className="font-medium">CRM pipeline</p>
              <p className="text-xs text-muted-foreground">Leads, meetings, follow-up paths</p>
            </a>
            <a className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors" href="/admin/athlete-pages">
              <Globe2 className="h-4 w-4 mb-2 text-primary" />
              <p className="font-medium">Athlete pages</p>
              <p className="text-xs text-muted-foreground">Public profiles and approvals</p>
            </a>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
