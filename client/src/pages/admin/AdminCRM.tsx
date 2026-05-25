import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KPICard, PageHeader, SectionCard, StatusBadge, formatDate } from "@/components/shared";
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  RadioTower,
  Sparkles,
  UserRoundPlus,
  Video,
} from "lucide-react";

const defaultLead = {
  tenantId: 1,
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

const highLevelTemplate = {
  subject: "Next steps with Athletes Collaborative",
  body: "Thank you for meeting with us. Here are the next steps, FAQs, and materials for families reviewing representation.",
};

const developmentalTemplate = {
  subject: "Thank you for meeting with Athletes Collaborative",
  body: "Thank you for spending time with us. We are sending education resources and a development pathway for what to work on next.",
};

export default function AdminCRM() {
  const utils = trpc.useUtils();
  const { data: overview } = trpc.crm.overview.useQuery();
  const { data: leads } = trpc.crm.listLeads.useQuery();
  const { data: meetings } = trpc.crm.listMeetings.useQuery();
  const { data: followUps } = trpc.crm.listFollowUps.useQuery();
  const { data: automationStatus } = trpc.crm.automationStatus.useQuery();
  const [leadForm, setLeadForm] = useState(defaultLead);

  const createLead = trpc.crm.createLead.useMutation({
    onSuccess: async () => {
      setLeadForm(defaultLead);
      await Promise.all([utils.crm.listLeads.invalidate(), utils.crm.overview.invalidate()]);
    },
  });

  const updateLead = trpc.crm.updateLead.useMutation({
    onSuccess: async () => {
      await utils.crm.listLeads.invalidate();
    },
  });

  const scheduleMeeting = trpc.crm.scheduleMeeting.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.crm.listMeetings.invalidate(), utils.crm.listLeads.invalidate(), utils.crm.overview.invalidate()]);
    },
  });

  const triggerFollowUp = trpc.crm.triggerFollowUp.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.crm.listFollowUps.invalidate(), utils.crm.listLeads.invalidate()]);
    },
  });

  const proposedStart = new Date(Date.now() + 2 * 86400000);
  proposedStart.setHours(15, 0, 0, 0);
  const proposedEnd = new Date(proposedStart.getTime() + 30 * 60000);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        subtitle="Capture leads, coordinate family calls, and trigger the two post-call pathways."
      >
        <Link href="/lead/athletes-collaborative">
          <Button variant="outline" size="sm" className="gap-2">
            <RadioTower className="h-4 w-4" />
            Lead Capture Form
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Open Leads" value={overview?.openLeads ?? leads?.length ?? 0} icon={UserRoundPlus} iconColor="text-blue-600" subtitle="In pipeline" />
        <KPICard title="Meetings" value={overview?.meetingsScheduled ?? meetings?.length ?? 0} icon={Video} iconColor="text-emerald-600" subtitle="Scheduled" />
        <KPICard title="Follow-ups" value={followUps?.length ?? 0} icon={Mail} iconColor="text-orange-600" subtitle="Queued or sent" />
        <KPICard title="Automation" value="Ready" icon={Sparkles} iconColor="text-violet-600" subtitle="Calendar, SMS, Zoom placeholders" />
      </div>

      <SectionCard title="Automation Health" subtitle="Email and text follow-ups are queued through backend automation without exposing provider credentials.">
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            ["Email", automationStatus?.email],
            ["Text", automationStatus?.sms],
            ["Calendar", automationStatus?.calendar],
            ["Meetings", automationStatus?.meetings],
          ].map(([label, status]) => (
            <div key={label as string} className="rounded-lg border border-border p-4">
              <p className="font-medium">{label as string}</p>
              <p className="text-sm text-muted-foreground">{(status as { mode?: string } | undefined)?.mode ?? "checking"}</p>
              <Badge variant="secondary" className="mt-3">{(status as { status?: string } | undefined)?.status ?? "pending"}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <SectionCard title="Lead Pipeline" subtitle="Athlete and guardian contact data is stored here instead of living in an external CRM form.">
          <div className="space-y-4">
            {leads?.map((lead) => (
              <div key={lead.id} className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{lead.athleteFirstName} {lead.athleteLastName}</h3>
                      <StatusBadge status={lead.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{lead.athleteSport || "Sport not set"} {lead.school ? `at ${lead.school}` : ""}</p>
                  </div>
                  <Badge variant="secondary">Score {lead.leadScore ?? "TBD"}</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-muted/50 p-3 space-y-1">
                    <p className="font-medium">Athlete</p>
                    <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" />{lead.athletePhone || "No phone"}</p>
                    <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3" />{lead.athleteEmail || "No email"}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 space-y-1">
                    <p className="font-medium">Guardian</p>
                    <p className="text-muted-foreground">{lead.guardianName || "No guardian name"}</p>
                    <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" />{lead.guardianPhone || "No guardian phone"}</p>
                  </div>
                </div>

                {lead.nextStep && <p className="text-sm text-muted-foreground">{lead.nextStep}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => updateLead.mutate({ id: lead.id, status: "contacted", nextStep: "Contacted family and awaiting meeting confirmation." })}
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Mark Contacted
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => scheduleMeeting.mutate({
                      tenantId: lead.tenantId,
                      leadId: lead.id,
                      status: "scheduled",
                      provider: "zoom",
                      startTime: proposedStart.toISOString(),
                      endTime: proposedEnd.toISOString(),
                      meetingUrl: "https://zoom.us/j/placeholder",
                      proposedSlotsJson: JSON.stringify([proposedStart.toISOString()]),
                      staffInviteesJson: JSON.stringify(["staff@athletescollaborative.com"]),
                    })}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Book Zoom
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => triggerFollowUp.mutate({
                      tenantId: lead.tenantId,
                      leadId: lead.id,
                      path: "high_level",
                      subject: highLevelTemplate.subject,
                      body: highLevelTemplate.body,
                    })}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    High-level Path
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => triggerFollowUp.mutate({
                      tenantId: lead.tenantId,
                      leadId: lead.id,
                      path: "general",
                      channel: "sms",
                      subject: "Text follow-up",
                      body: "Thank you for connecting with Athletes Collaborative. We will send next steps and meeting materials shortly.",
                    })}
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Text Follow-up
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => triggerFollowUp.mutate({
                      tenantId: lead.tenantId,
                      leadId: lead.id,
                      path: "developmental",
                      subject: developmentalTemplate.subject,
                      body: developmentalTemplate.body,
                    })}
                  >
                    Developmental Path
                  </Button>
                </div>
              </div>
            ))}

            {!leads?.length && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No leads have been captured yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Manual Lead Entry" subtitle="The public lead form uses the same CRM endpoint. Staff can also add leads here.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createLead.mutate({
                ...leadForm,
                athleteEmail: leadForm.athleteEmail || undefined,
                athletePhone: leadForm.athletePhone || undefined,
                athleteSport: leadForm.athleteSport || undefined,
                athleteGraduationYear: leadForm.athleteGraduationYear || undefined,
                guardianName: leadForm.guardianName || undefined,
                guardianEmail: leadForm.guardianEmail || undefined,
                guardianPhone: leadForm.guardianPhone || undefined,
                school: leadForm.school || undefined,
                notes: leadForm.notes || undefined,
                status: "new",
              });
            }}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Athlete first name" value={leadForm.athleteFirstName} onChange={(event) => setLeadForm({ ...leadForm, athleteFirstName: event.target.value })} />
              <Input placeholder="Athlete last name" value={leadForm.athleteLastName} onChange={(event) => setLeadForm({ ...leadForm, athleteLastName: event.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Athlete phone" value={leadForm.athletePhone} onChange={(event) => setLeadForm({ ...leadForm, athletePhone: event.target.value })} />
              <Input placeholder="Athlete email" value={leadForm.athleteEmail} onChange={(event) => setLeadForm({ ...leadForm, athleteEmail: event.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Sport" value={leadForm.athleteSport} onChange={(event) => setLeadForm({ ...leadForm, athleteSport: event.target.value })} />
              <Input placeholder="Grad year" value={leadForm.athleteGraduationYear} onChange={(event) => setLeadForm({ ...leadForm, athleteGraduationYear: event.target.value })} />
            </div>
            <Input placeholder="School" value={leadForm.school} onChange={(event) => setLeadForm({ ...leadForm, school: event.target.value })} />
            <Input placeholder="Guardian name" value={leadForm.guardianName} onChange={(event) => setLeadForm({ ...leadForm, guardianName: event.target.value })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Guardian phone" value={leadForm.guardianPhone} onChange={(event) => setLeadForm({ ...leadForm, guardianPhone: event.target.value })} />
              <Input placeholder="Guardian email" value={leadForm.guardianEmail} onChange={(event) => setLeadForm({ ...leadForm, guardianEmail: event.target.value })} />
            </div>
            <Textarea placeholder="Notes" value={leadForm.notes} onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })} />
            <Button type="submit" className="w-full gap-2" disabled={createLead.isPending}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </form>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Meetings" subtitle="Calendar and Zoom/Meet payloads are staged for the integration layer.">
          <div className="space-y-3">
            {meetings?.map((meeting) => (
              <div key={meeting.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{meeting.provider}</p>
                    <p className="text-sm text-muted-foreground">{meeting.startTime ? formatDate(meeting.startTime) : "No time set"}</p>
                  </div>
                  <StatusBadge status={meeting.status} />
                </div>
              </div>
            ))}
            {!meetings?.length && <p className="text-sm text-muted-foreground">No meetings booked yet.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Follow-ups" subtitle="Manual trigger points for high-level and developmental paths.">
          <div className="space-y-3">
            {followUps?.map((followUp) => (
              <div key={followUp.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{followUp.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{followUp.body}</p>
                  </div>
                  <Badge variant="secondary">{followUp.path}</Badge>
                </div>
              </div>
            ))}
            {!followUps?.length && <p className="text-sm text-muted-foreground">No follow-ups triggered yet.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
