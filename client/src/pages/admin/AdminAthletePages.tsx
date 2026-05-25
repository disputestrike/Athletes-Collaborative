import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KPICard, PageHeader, SectionCard, StatusBadge } from "@/components/shared";
import { Check, ExternalLink, Globe2, Image, Play, Plus, ShieldCheck, X } from "lucide-react";

const defaultPage = {
  tenantId: 1,
  athleteId: 1,
  slug: "",
  headline: "",
  subheadline: "",
  coverImageUrl: "",
  videoUrl: "",
  statsJson: '[{"label":"PPG","value":"18.4"},{"label":"GPA","value":"3.8"}]',
  socialLinksJson: '[{"label":"Instagram","url":"https://instagram.com/"}]',
  newsJson: '[{"title":"Latest update","date":"2026-05-24","summary":"Add the athlete story here."}]',
  isPublished: true,
  requiresPassword: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminAthletePages() {
  const utils = trpc.useUtils();
  const { data: pages } = trpc.athletePages.list.useQuery();
  const { data: athletes } = trpc.athletes.list.useQuery();
  const { data: pendingMedia } = trpc.athletePages.media.useQuery({ status: "pending" });
  const { data: overview } = trpc.tenants.overview.useQuery();
  const [form, setForm] = useState(defaultPage);

  const upsertPage = trpc.athletePages.upsert.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.athletePages.list.invalidate(), utils.tenants.overview.invalidate()]);
    },
  });

  const reviewMedia = trpc.athletePages.reviewMedia.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.athletePages.media.invalidate(), utils.tenants.overview.invalidate()]);
    },
  });

  const selectedAthlete = useMemo(
    () => athletes?.find((athlete) => athlete.id === form.athleteId),
    [athletes, form.athleteId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Athlete Pages"
        subtitle="Build replicated public profiles, control what goes live, and review athlete-submitted media."
      >
        <Link href="/a/marcus-johnson">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Demo Page
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Published Pages" value={pages?.filter((row) => row.page.isPublished).length ?? 0} icon={Globe2} iconColor="text-blue-600" subtitle="Public" />
        <KPICard title="Drafts" value={pages?.filter((row) => !row.page.isPublished).length ?? 0} icon={ShieldCheck} iconColor="text-slate-600" subtitle="Hidden" />
        <KPICard title="Pending Media" value={overview?.pendingMedia ?? pendingMedia?.length ?? 0} icon={Image} iconColor="text-amber-600" subtitle="Approval queue" />
        <KPICard title="Video Ready" value={pages?.filter((row) => row.page.videoUrl).length ?? 0} icon={Play} iconColor="text-rose-600" subtitle="Profiles" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <SectionCard title="Published Profiles" subtitle="These are shareable pages that sit inside the existing platform.">
          <div className="grid md:grid-cols-2 gap-4">
            {pages?.map((row) => (
              <div key={row.page.id} className="rounded-lg border border-border overflow-hidden">
                <div className="aspect-[16/8] bg-muted">
                  {row.page.coverImageUrl ? (
                    <img src={row.page.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Image className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{row.page.headline || `${row.athlete?.firstName ?? "Athlete"} ${row.athlete?.lastName ?? ""}`}</h3>
                      <p className="text-xs text-muted-foreground">/{row.page.slug}</p>
                    </div>
                    <StatusBadge status={row.page.isPublished ? "approved" : "draft"} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{row.page.subheadline || row.athlete?.bio || "No public story has been added yet."}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{row.tenant?.name ?? "Tenant"}</Badge>
                    {row.page.requiresPassword && <Badge variant="outline">Password protected</Badge>}
                  </div>
                  <Link href={`/a/${row.page.slug}`}>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Open Public Page
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {!pages?.length && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
                No athlete pages yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Create or Update Page" subtitle="Admins control public publishing and password protection.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              upsertPage.mutate({
                ...form,
                slug: form.slug || slugify(`${selectedAthlete?.firstName ?? "athlete"}-${selectedAthlete?.lastName ?? "page"}`),
                coverImageUrl: form.coverImageUrl || undefined,
                videoUrl: form.videoUrl || undefined,
                headline: form.headline || undefined,
                subheadline: form.subheadline || undefined,
              });
            }}
          >
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.athleteId}
              onChange={(event) => {
                const athleteId = Number(event.target.value);
                const athlete = athletes?.find((item) => item.id === athleteId);
                setForm({
                  ...form,
                  athleteId,
                  slug: athlete ? slugify(`${athlete.firstName}-${athlete.lastName}`) : form.slug,
                  headline: athlete ? `${athlete.firstName} ${athlete.lastName}` : form.headline,
                });
              }}
            >
              {athletes?.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.firstName} {athlete.lastName}
                </option>
              ))}
            </select>
            <Input placeholder="public-page-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} />
            <Input placeholder="Headline" value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} />
            <Textarea placeholder="Public summary" value={form.subheadline} onChange={(event) => setForm({ ...form, subheadline: event.target.value })} />
            <Input placeholder="Cover image URL" value={form.coverImageUrl} onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })} />
            <Input placeholder="Video URL or embed URL" value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} />
            <Textarea placeholder="Stats JSON" value={form.statsJson} onChange={(event) => setForm({ ...form, statsJson: event.target.value })} />
            <Textarea placeholder="Social links JSON" value={form.socialLinksJson} onChange={(event) => setForm({ ...form, socialLinksJson: event.target.value })} />
            <Textarea placeholder="News JSON" value={form.newsJson} onChange={(event) => setForm({ ...form, newsJson: event.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
                Published
              </label>
              <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                <input type="checkbox" checked={form.requiresPassword} onChange={(event) => setForm({ ...form, requiresPassword: event.target.checked })} />
                Password protected
              </label>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={upsertPage.isPending}>
              <Plus className="h-4 w-4" />
              Save Athlete Page
            </Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Media Approval Queue" subtitle="Athletes can submit assets, but staff approves public visibility.">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingMedia?.map((asset) => (
            <div key={asset.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{asset.title}</h3>
                  <p className="text-xs text-muted-foreground">{asset.assetType} asset</p>
                </div>
                <StatusBadge status={asset.approvalStatus} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{asset.description || asset.url}</p>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 gap-1" onClick={() => reviewMedia.mutate({ id: asset.id, status: "approved", note: "Approved for publishing." })}>
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => reviewMedia.mutate({ id: asset.id, status: "rejected", note: "Needs revision." })}>
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}

          {!pendingMedia?.length && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              No media is waiting for approval.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
