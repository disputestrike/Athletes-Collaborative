import { useState } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ACLogo from "@/components/ACLogo";
import { CalendarDays, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";

const defaultForm = {
  athleteFirstName: "",
  athleteLastName: "",
  athleteEmail: "",
  athletePhone: "",
  athleteSport: "",
  athleteGraduationYear: "",
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
  school: "",
  notes: "",
};

export default function LeadCapture() {
  const [, params] = useRoute("/lead/:tenantSlug");
  const tenantSlug = params?.tenantSlug ?? "athletes-collaborative";
  const [form, setForm] = useState(defaultForm);
  const [submitted, setSubmitted] = useState(false);
  const submitLead = trpc.crm.submitLead.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setForm(defaultForm);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-5 flex items-center justify-between">
          <ACLogo size="md" />
          <Link href="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-primary">/{tenantSlug}</p>
              <h1 className="text-3xl sm:text-4xl font-bold mt-2">Athlete Evaluation Request</h1>
              <p className="text-muted-foreground mt-3">
                Share the athlete and guardian contact details so the team can schedule a family call and send the right next steps.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <MessageSquare className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold">SMS lead magnet ready</p>
                <p className="text-sm text-muted-foreground">This form replaces the external CRM link and stores intake inside the platform.</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <CalendarDays className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold">Calendar workflow ready</p>
                <p className="text-sm text-muted-foreground">Staff can propose Zoom or Google Meet slots from the CRM dashboard.</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                <p className="font-semibold">Family contacts included</p>
                <p className="text-sm text-muted-foreground">Guardian phone and email are captured alongside athlete information.</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
            {submitted ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h2 className="text-2xl font-bold mt-4">Request received</h2>
                <p className="text-muted-foreground mt-2">
                  The team has the athlete and guardian details. They can now move the lead through scheduling and follow-up in the CRM.
                </p>
                <Button className="mt-6" onClick={() => setSubmitted(false)}>Submit Another</Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitLead.mutate({
                    tenantId: 1,
                    source: `lead_magnet:${tenantSlug}`,
                    athleteFirstName: form.athleteFirstName,
                    athleteLastName: form.athleteLastName,
                    athleteEmail: form.athleteEmail || undefined,
                    athletePhone: form.athletePhone || undefined,
                    athleteSport: form.athleteSport || undefined,
                    athleteGraduationYear: form.athleteGraduationYear || undefined,
                    guardianName: form.guardianName || undefined,
                    guardianEmail: form.guardianEmail || undefined,
                    guardianPhone: form.guardianPhone || undefined,
                    school: form.school || undefined,
                    notes: form.notes || undefined,
                  });
                }}
              >
                <div>
                  <h2 className="text-xl font-semibold">Athlete information</h2>
                  <p className="text-sm text-muted-foreground">Required fields are first and last name.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Athlete first name" value={form.athleteFirstName} onChange={(event) => setForm({ ...form, athleteFirstName: event.target.value })} required />
                  <Input placeholder="Athlete last name" value={form.athleteLastName} onChange={(event) => setForm({ ...form, athleteLastName: event.target.value })} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Athlete phone" value={form.athletePhone} onChange={(event) => setForm({ ...form, athletePhone: event.target.value })} />
                  <Input placeholder="Athlete email" value={form.athleteEmail} onChange={(event) => setForm({ ...form, athleteEmail: event.target.value })} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input placeholder="Sport" value={form.athleteSport} onChange={(event) => setForm({ ...form, athleteSport: event.target.value })} />
                  <Input placeholder="Grad year" value={form.athleteGraduationYear} onChange={(event) => setForm({ ...form, athleteGraduationYear: event.target.value })} />
                  <Input placeholder="School" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} />
                </div>

                <div className="pt-2">
                  <h2 className="text-xl font-semibold">Parent or guardian</h2>
                  <p className="text-sm text-muted-foreground">Used for meeting invitations and follow-up materials.</p>
                </div>
                <Input placeholder="Guardian name" value={form.guardianName} onChange={(event) => setForm({ ...form, guardianName: event.target.value })} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="Guardian phone" value={form.guardianPhone} onChange={(event) => setForm({ ...form, guardianPhone: event.target.value })} />
                  <Input placeholder="Guardian email" value={form.guardianEmail} onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })} />
                </div>

                <Textarea placeholder="Anything the team should know before the call?" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />

                <Button type="submit" className="w-full" disabled={submitLead.isPending}>
                  Submit Evaluation Request
                </Button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
