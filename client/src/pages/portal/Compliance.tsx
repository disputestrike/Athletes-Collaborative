import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard, StatusBadge, EmptyState, TableSkeleton, formatDate } from "@/components/shared";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, CheckCircle, Clock, AlertCircle, ChevronRight, FileText, Send } from "lucide-react";

const COMPLIANCE_TYPES = ["Disclosure", "Medical Clearance", "Background Check", "Drug Testing Consent", "Financial Disclosure", "Travel Authorization", "Media Release"];

const STATUS_FLOW = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"];

export function ComplianceList() {
  const { data: profile } = trpc.athletes.getMyProfile.useQuery();
  const { data: forms, isLoading } = trpc.compliance.list.useQuery(
    { athleteId: profile?.id },
    { enabled: !!profile?.id }
  );

  const pending = forms?.filter(f => ["DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(f.status)) ?? [];
  const completed = forms?.filter(f => ["APPROVED", "REJECTED"].includes(f.status)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Forms" subtitle="Track and submit your required compliance documentation" />

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Draft", count: forms?.filter(f => f.status === "DRAFT").length ?? 0, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Submitted", count: forms?.filter(f => f.status === "SUBMITTED").length ?? 0, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Under Review", count: forms?.filter(f => f.status === "UNDER_REVIEW").length ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Approved", count: forms?.filter(f => f.status === "APPROVED").length ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} rounded-lg p-3 text-center border border-border`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? <TableSkeleton rows={4} /> : (
        <>
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Needs Attention ({pending.length})</h3>
              <div className="space-y-3">
                {pending.map(form => <ComplianceCard key={form.id} form={form} />)}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed ({completed.length})</h3>
              <div className="space-y-2">
                {completed.map(form => <ComplianceCard key={form.id} form={form} compact />)}
              </div>
            </div>
          )}
          {!forms || forms.length === 0 && (
            <EmptyState icon={ShieldCheck} title="No compliance forms" description="Your team will assign compliance forms here as needed." />
          )}
        </>
      )}
    </div>
  );
}

function ComplianceCard({ form, compact = false }: { form: any; compact?: boolean }) {
  const isDue = form.dueDate && new Date(form.dueDate) < new Date() && !["APPROVED", "REJECTED"].includes(form.status);

  return (
    <Link href={`/portal/compliance/${form.id}`}>
      <div className={`bg-card border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${isDue ? "border-red-200 bg-red-50/30" : "border-border"} ${compact ? "p-3" : "p-5"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge status={form.status} />
              <Badge variant="outline" className="text-xs">{form.type}</Badge>
              {isDue && <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1"><AlertCircle className="h-3 w-3" />Overdue</Badge>}
            </div>
            <h3 className={`font-semibold ${compact ? "text-sm" : ""}`}>{form.title}</h3>
            {!compact && form.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{form.description}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            {form.dueDate && <p className={`text-xs ${isDue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>Due {formatDate(form.dueDate)}</p>}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ComplianceDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState("");

  const { data: form, isLoading } = trpc.compliance.getById.useQuery({ id: Number(id) });

  const submitMutation = trpc.compliance.submit.useMutation({
    onSuccess: () => {
      toast.success("Form submitted for review");
      utils.compliance.getById.invalidate({ id: Number(id) });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
  if (!form) return <EmptyState icon={ShieldCheck} title="Form not found" />;

  const currentStep = STATUS_FLOW.indexOf(form.status);
  const canSubmit = form.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal/compliance">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        </Link>
        <StatusBadge status={form.status} size="md" />
        <Badge variant="outline">{form.type}</Badge>
      </div>

      <h1 className="text-2xl font-bold">{form.title}</h1>

      {/* Progress steps */}
      <SectionCard title="Form Progress">
        <div className="flex items-center gap-2">
          {STATUS_FLOW.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 ${
                i < currentStep ? "bg-primary text-primary-foreground" :
                i === currentStep ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STATUS_FLOW.map((step, i) => (
            <span key={step} className={`text-xs ${i === currentStep ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {step.replace("_", " ")}
            </span>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {form.description && (
            <SectionCard title="Form Description">
              <p className="text-sm leading-relaxed">{form.description}</p>
            </SectionCard>
          )}

          {/* Athlete notes */}
          <SectionCard title="Your Notes">
            {form.athleteNotes ? (
              <p className="text-sm">{form.athleteNotes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes added yet.</p>
            )}
          </SectionCard>

          {/* Reviewer notes */}
          {form.reviewerNotes && (
            <SectionCard title="Reviewer Notes">
              <p className="text-sm">{form.reviewerNotes}</p>
            </SectionCard>
          )}

          {/* Submit action */}
          {canSubmit && (
            <SectionCard title="Submit Form">
              <div className="space-y-3">
                <div>
                  <Label>Add a note (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional context for the reviewer..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => submitMutation.mutate({ id: form.id, athleteNotes: notes || undefined })}
                  disabled={submitMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Form Details">
            <dl className="space-y-3">
              <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="text-sm font-medium mt-0.5">{form.type}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-0.5"><StatusBadge status={form.status} /></dd></div>
              {form.dueDate && <div><dt className="text-xs text-muted-foreground">Due Date</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.dueDate)}</dd></div>}
              {form.submittedAt && <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.submittedAt)}</dd></div>}
              {form.reviewedAt && <div><dt className="text-xs text-muted-foreground">Reviewed</dt><dd className="text-sm font-medium mt-0.5">{formatDate(form.reviewedAt)}</dd></div>}
            </dl>
          </SectionCard>

          {form.documentUrl && (
            <SectionCard title="Document">
              <a href={form.documentUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 w-full">
                  <FileText className="h-4 w-4" />View Document
                </Button>
              </a>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PortalCompliance() {
  const params = useParams<{ id?: string }>();
  if (params.id) return <ComplianceDetail />;
  return <ComplianceList />;
}
