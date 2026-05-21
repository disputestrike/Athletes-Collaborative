import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, SectionCard, EmptyState } from "@/components/shared";
import { BookOpen, Building2, Heart, ExternalLink, Star, Play, FileText, Headphones, Globe, BookMarked, GraduationCap } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  Article: FileText,
  Video: Play,
  Course: GraduationCap,
  Webinar: Globe,
  Podcast: Headphones,
  "E-Book": BookMarked,
  Guide: BookOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Financial Planning": "bg-emerald-100 text-emerald-800",
  Tax: "bg-blue-100 text-blue-800",
  Legal: "bg-purple-100 text-purple-800",
  Insurance: "bg-orange-100 text-orange-800",
  "Real Estate": "bg-amber-100 text-amber-800",
  Investment: "bg-teal-100 text-teal-800",
  Banking: "bg-sky-100 text-sky-800",
  Other: "bg-gray-100 text-gray-700",
};

export default function GrowthHub() {
  const { data: materials } = trpc.growth.getMaterials.useQuery();
  const { data: partners } = trpc.growth.getPartners.useQuery();
  const { data: outreach } = trpc.growth.getOutreach.useQuery();

  const featured = materials?.filter(m => m.isFeatured) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Growth Hub" subtitle="Resources, partners, and community programs to elevate your career" />

      <Tabs defaultValue="resources">
        <TabsList className="mb-4">
          <TabsTrigger value="resources"><BookOpen className="h-4 w-4 mr-2" />Resources</TabsTrigger>
          <TabsTrigger value="partners"><Building2 className="h-4 w-4 mr-2" />Partners</TabsTrigger>
          <TabsTrigger value="community"><Heart className="h-4 w-4 mr-2" />Community</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Featured</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map(m => <MaterialCard key={m.id} material={m} />)}
              </div>
            </div>
          )}

          {/* All materials */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">All Resources ({materials?.length ?? 0})</h3>
            {!materials || materials.length === 0 ? (
              <EmptyState icon={BookOpen} title="No resources yet" description="Your team will add educational resources here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(m => <MaterialCard key={m.id} material={m} />)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <p className="text-sm text-muted-foreground">Trusted financial and professional partners for athletes.</p>
          {!partners || partners.length === 0 ? (
            <EmptyState icon={Building2} title="No partners listed" description="Business partners will be added here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partners.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-700"}`}>
                          {p.category}
                        </span>
                        {p.isFeatured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        {p.contactEmail && <span>{p.contactEmail}</span>}
                        {p.contactPhone && <span>{p.contactPhone}</span>}
                      </div>
                    </div>
                  </div>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex">
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" />Visit Website
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <p className="text-sm text-muted-foreground">Community outreach programs and initiatives.</p>
          {!outreach || outreach.length === 0 ? (
            <EmptyState icon={Heart} title="No programs listed" description="Community programs will be added here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {outreach.map(o => (
                <div key={o.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pink-50">
                      <Heart className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{o.type}</Badge>
                        <Badge className={`text-xs ${o.status === "Active" ? "bg-emerald-100 text-emerald-700" : o.status === "Upcoming" ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600"}`}>
                          {o.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{o.title}</h3>
                      {o.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{o.description}</p>}
                      {(o.date || o.location) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {o.date ? new Date(o.date).toLocaleDateString() : ""}{o.location ? ` · ${o.location}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MaterialCard({ material }: { material: any }) {
  const Icon = TYPE_ICONS[material.type] ?? BookOpen;
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className="text-xs">{material.type}</Badge>
            {material.isFeatured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
          </div>
          <h4 className="font-semibold text-sm">{material.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{material.category}</p>
          {material.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{material.description}</p>}
        </div>
      </div>
      {material.url && (
        <a href={material.url} target="_blank" rel="noopener noreferrer" className="mt-3 block">
          <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
            <ExternalLink className="h-3 w-3" />Access Resource
          </Button>
        </a>
      )}
    </div>
  );
}
