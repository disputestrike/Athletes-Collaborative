import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, formatDate } from "@/components/shared";
import { ExternalLink, FileText, Image, Plus, Upload, Video } from "lucide-react";

const defaultAsset = {
  title: "",
  description: "",
  assetType: "image" as "image" | "video" | "story" | "document",
  url: "",
  visibility: "private" as "public" | "private",
};

function AssetIcon({ type }: { type: string }) {
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "document") return <FileText className="h-4 w-4" />;
  return <Image className="h-4 w-4" />;
}

export default function PortalMedia() {
  const utils = trpc.useUtils();
  const { data: myProfile } = trpc.athletes.getMyProfile.useQuery();
  const { data: media } = trpc.athletePages.media.useQuery(
    { athleteId: myProfile?.id },
    { enabled: !!myProfile?.id }
  );
  const [asset, setAsset] = useState(defaultAsset);

  const submitMedia = trpc.athletePages.submitMedia.useMutation({
    onSuccess: async () => {
      setAsset(defaultAsset);
      await utils.athletePages.media.invalidate();
    },
  });

  const publicAssets = media?.filter((item) => item.approvalStatus === "approved" && item.visibility === "public") ?? [];
  const pendingAssets = media?.filter((item) => item.approvalStatus === "pending") ?? [];
  const privateAssets = media?.filter((item) => item.visibility === "private") ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        subtitle="Store photos, videos, documents, and stories. Anything you submit for public use goes through staff approval."
      >
        <Link href="/a/marcus-johnson">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Public Page
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">All Assets</p>
          <p className="text-2xl font-bold">{media?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Public</p>
          <p className="text-2xl font-bold">{publicAssets.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold">{pendingAssets.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Private</p>
          <p className="text-2xl font-bold">{privateAssets.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
        <SectionCard title="Assets" subtitle="Approved public assets can appear on your replicated landing page.">
          <div className="grid md:grid-cols-2 gap-4">
            {media?.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                      <AssetIcon type={item.assetType} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.approvalStatus} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description || item.url}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.assetType}</Badge>
                  <Badge variant="outline">{item.visibility}</Badge>
                </div>
                {item.assetType === "image" && (
                  <div className="aspect-video rounded-md bg-muted overflow-hidden">
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            ))}
            {!media?.length && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
                No media has been added yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Submit Media" subtitle="Uploads are represented by URLs for now; local upload storage is already available for the next step.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submitMedia.mutate({
                tenantId: myProfile?.tenantId ?? 1,
                athleteId: myProfile?.id,
                ...asset,
                description: asset.description || undefined,
              });
            }}
          >
            <Input placeholder="Title" value={asset.title} onChange={(event) => setAsset({ ...asset, title: event.target.value })} />
            <Textarea placeholder="Description" value={asset.description} onChange={(event) => setAsset({ ...asset, description: event.target.value })} />
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={asset.assetType}
              onChange={(event) => setAsset({ ...asset, assetType: event.target.value as typeof asset.assetType })}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="story">Story</option>
              <option value="document">Document</option>
            </select>
            <Input placeholder="Asset URL" value={asset.url} onChange={(event) => setAsset({ ...asset, url: event.target.value })} />
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={asset.visibility}
              onChange={(event) => setAsset({ ...asset, visibility: event.target.value as typeof asset.visibility })}
            >
              <option value="private">Private repository</option>
              <option value="public">Request public page use</option>
            </select>
            <Button type="submit" className="w-full gap-2" disabled={submitMedia.isPending || !myProfile}>
              <Upload className="h-4 w-4" />
              Submit for Library
            </Button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="What Staff Sees" subtitle="This mirrors the approval queue in the admin area.">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-4">
            <Plus className="h-4 w-4 text-primary mb-2" />
            <p className="font-medium">Athlete submits content</p>
            <p className="text-sm text-muted-foreground">Media can be private or requested for public use.</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <Image className="h-4 w-4 text-primary mb-2" />
            <p className="font-medium">Admin reviews</p>
            <p className="text-sm text-muted-foreground">Staff approves, rejects, or archives submissions.</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <ExternalLink className="h-4 w-4 text-primary mb-2" />
            <p className="font-medium">Public page updates</p>
            <p className="text-sm text-muted-foreground">Approved public media becomes available to publish.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
