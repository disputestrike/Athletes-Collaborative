import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import ACLogo from "@/components/ACLogo";
import {
  ArrowRight, Shield, Briefcase, Megaphone, BookOpen,
  MessageSquare, ChevronRight, Star, Users, TrendingUp,
  FileText, ShieldCheck, CheckCircle, Zap
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Contract Management",
    description: "Full lifecycle tracking from draft to renewal. Never miss a key date or deadline again.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Briefcase,
    title: "Career Opportunities",
    description: "NIL, sponsorships, endorsements, media — manage your entire pipeline in one place.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Megaphone,
    title: "Marketing Campaigns",
    description: "Coordinate brand campaigns, track deliverables, and measure performance.",
    color: "bg-pink-50 text-pink-600",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Hub",
    description: "Disclosure, drug testing, background checks — stay compliant with every requirement.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: BookOpen,
    title: "Growth Resources",
    description: "Financial planning, legal guidance, and educational content curated for athletes.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "Communicate directly with your agent, manager, and team in a private, secure inbox.",
    color: "bg-teal-50 text-teal-600",
  },
];

const stats = [
  { value: "9", label: "Role Types", sub: "Granular access control" },
  { value: "8", label: "Opp Categories", sub: "NIL, Sponsorship & more" },
  { value: "7", label: "Compliance Forms", sub: "Full workflow tracking" },
  { value: "100%", label: "Secure", sub: "Role-based data isolation" },
];

const roles = [
  "Owner / Super Admin",
  "Agent",
  "Manager",
  "Marketing Coordinator",
  "Compliance Reviewer",
  "Athlete",
  "Family Member",
  "External Partner",
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  const handleEnter = () => {
    if (isAuthenticated) {
      window.location.href = "/portal";
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <ACLogo size="md" />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome back, {user?.name?.split(" ")[0]}
                </span>
                <Link href="/portal">
                  <Button size="sm" className="gap-2">
                    Go to Portal <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <Button onClick={handleEnter} size="sm" className="gap-2">
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-teal-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/3 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <Zap className="h-3 w-3 mr-1" />
              The Complete Athlete Management Platform
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              Manage Every
              <span className="block text-primary">Aspect of Your</span>
              <span className="block">Athletic Career</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Athletes Collaborative centralizes contracts, opportunities, compliance,
              marketing, and growth resources — giving athletes and their teams a
              single source of truth.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={handleEnter}
                className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/25"
              >
                {loading ? "Loading..." : isAuthenticated ? "Enter Portal" : "Get Started"}
                <ArrowRight className="h-5 w-5" />
              </Button>
              {isAuthenticated && (
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12">
                    Admin Center <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-primary mb-1">{s.value}</div>
                <div className="font-semibold text-foreground">{s.label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything Your Team Needs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From contract negotiation to brand campaigns, every tool is purpose-built
              for the modern athlete and their management team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`inline-flex p-3 rounded-xl mb-4 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based access */}
      <section className="py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-teal-50 text-teal-700 border-teal-200">
                <Shield className="h-3 w-3 mr-1" />
                Role-Based Access Control
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                The Right Access for
                <span className="text-primary block">Every Team Member</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Nine distinct roles with least-privilege access control ensure that
                agents see what they need, athletes control their own data, and
                admins maintain full oversight.
              </p>
              <div className="space-y-3">
                {[
                  "Athletes submit update requests for legal fields",
                  "Family members get configurable access levels",
                  "Compliance reviewers manage the full review workflow",
                  "External partners access only what's shared with them",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((role, i) => (
                <div
                  key={role}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium leading-tight">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance workflow */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built-In Compliance Workflow</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every compliance form follows a strict, auditable state machine from
              creation to final decision.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 items-center">
            {["DRAFT", "SUBMITTED", "UNDER REVIEW", "APPROVED / REJECTED"].map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className={`px-5 py-3 rounded-xl font-bold text-sm border-2 ${
                  step === "APPROVED / REJECTED"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : step === "UNDER REVIEW"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : step === "SUBMITTED"
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-border bg-muted text-muted-foreground"
                }`}>
                  {step}
                </div>
                {i < 3 && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {["Disclosure", "Medical Clearance", "Background Check", "Drug Testing Consent", "Financial Disclosure", "Travel Authorization", "Media Release"].map((type) => (
              <div key={type} className="text-center p-3 rounded-xl border border-border bg-card">
                <ShieldCheck className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs font-medium leading-tight">{type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Elevate Your Career Management?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join Athletes Collaborative and give your team the platform they deserve.
          </p>
          <Button
            size="lg"
            onClick={handleEnter}
            className="bg-white text-primary hover:bg-white/90 gap-2 text-base px-10 h-12 font-bold shadow-xl"
          >
            {isAuthenticated ? "Enter Your Portal" : "Get Started Today"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <ACLogo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Athletes Collaborative. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
