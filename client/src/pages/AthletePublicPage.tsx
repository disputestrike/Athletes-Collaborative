import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ACLogo from "@/components/ACLogo";
import { ExternalLink, Globe2, Image, Instagram, Loader2, Lock, Play, Twitter } from "lucide-react";

type Stat = { label: string; value: string };
type Social = { label: string; url: string };
type NewsItem = { title: string; date?: string; summary?: string };

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default function AthletePublicPage() {
  const [, params] = useRoute("/a/:slug");
  const slug = params?.slug ?? "marcus-johnson";
  const { data, isLoading, error } = trpc.athletePages.publicBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <ACLogo size="lg" className="justify-center mb-6" />
          <h1 className="text-2xl font-bold">Athlete page unavailable</h1>
          <p className="text-muted-foreground mt-2">This page is not published or the link is incorrect.</p>
          <Link href="/">
            <Button className="mt-6">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { page, athlete, tenant, media } = data;
  const stats = parseJson<Stat[]>(page.statsJson, []);
  const socials = parseJson<Social[]>(page.socialLinksJson, []);
  const news = parseJson<NewsItem[]>(page.newsJson, []);
  const cover = page.coverImageUrl || athlete?.photoUrl || tenant?.heroImageUrl || "";
  const brandColor = tenant?.brandColor || "#F97316";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto max-w-7xl px-5 py-5 flex items-center justify-between">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="h-10 max-w-[180px] object-contain" />
          ) : (
            <ACLogo size="md" tone="light" />
          )}
          <div className="flex items-center gap-2">
            {page.requiresPassword && (
              <Badge className="bg-white/15 text-white border-white/20 gap-1">
                <Lock className="h-3 w-3" />
                Protected
              </Badge>
            )}
            <Link href="/portal">
              <Button size="sm" variant="secondary">Portal</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[76vh] flex items-end overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-12 pt-32 text-white">
          <div className="max-w-3xl">
            <Badge className="mb-4 border-white/20 bg-white/15 text-white">
              {tenant?.name ?? "Athletes Collaborative"}
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
              {page.headline || `${athlete?.firstName ?? "Athlete"} ${athlete?.lastName ?? ""}`}
            </h1>
            <p className="mt-4 text-lg text-white/85 max-w-2xl">
              {page.subheadline || athlete?.bio || "Athlete profile, media, stats, and latest updates."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {athlete?.sport && <Badge className="bg-white text-gray-900">{athlete.sport}</Badge>}
              {athlete?.team && <Badge className="bg-white/15 text-white border-white/20">{athlete.team}</Badge>}
              {athlete?.city && <Badge className="bg-white/15 text-white border-white/20">{athlete.city}, {athlete.state}</Badge>}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 space-y-10">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={`${stat.label}-${stat.value}`} className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: brandColor }}>{stat.value}</p>
            </div>
          ))}
          {!stats.length && (
            <div className="rounded-lg border border-border bg-card p-5 col-span-2 md:col-span-4">
              <p className="text-sm text-muted-foreground">Stats will appear here once staff publishes them.</p>
            </div>
          )}
        </section>

        <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Media</h2>
                <p className="text-sm text-muted-foreground">Approved public photos, videos, and story assets.</p>
              </div>
              <Globe2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {media?.map((asset) => (
                <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className="rounded-lg border border-border overflow-hidden bg-card hover:bg-muted/30 transition-colors">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {asset.assetType === "image" ? (
                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Play className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{asset.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{asset.description || asset.assetType}</p>
                  </div>
                </a>
              ))}
              {!media?.length && (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground sm:col-span-2">
                  <Image className="h-6 w-6 mx-auto mb-2" />
                  Public media is waiting for approval.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {page.videoUrl && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-video bg-black">
                  {page.videoUrl.includes("youtube.com/embed") ? (
                    <iframe title="Athlete video" src={page.videoUrl} className="h-full w-full" allowFullScreen />
                  ) : (
                    <video src={page.videoUrl} className="h-full w-full" controls />
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-semibold">Connect</h2>
              <div className="mt-4 space-y-2">
                {socials.map((social) => (
                  <a key={social.url} href={social.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                    {social.label.toLowerCase().includes("instagram") ? <Instagram className="h-4 w-4" /> : social.label.toLowerCase().includes("x") ? <Twitter className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    {social.label}
                  </a>
                ))}
                {!socials.length && <p className="text-sm text-muted-foreground">Social links are not published yet.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-semibold">News</h2>
              <div className="mt-4 space-y-4">
                {news.map((item) => (
                  <div key={`${item.title}-${item.date}`} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="font-medium">{item.title}</p>
                    {item.date && <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>}
                    {item.summary && <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>}
                  </div>
                ))}
                {!news.length && <p className="text-sm text-muted-foreground">News updates will appear here.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
