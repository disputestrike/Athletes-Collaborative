import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  // Contract statuses
  Draft: "bg-gray-100 text-gray-700 border-gray-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Expired: "bg-red-50 text-red-700 border-red-200",
  Terminated: "bg-gray-100 text-gray-500 border-gray-200",
  // Compliance statuses
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SUBMITTED: "bg-violet-50 text-violet-700 border-violet-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  // Opportunity statuses
  Identified: "bg-sky-50 text-sky-700 border-sky-200",
  Contacted: "bg-blue-50 text-blue-700 border-blue-200",
  "In Negotiation": "bg-amber-50 text-amber-700 border-amber-200",
  "Offer Received": "bg-orange-50 text-orange-700 border-orange-200",
  Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Declined: "bg-red-50 text-red-700 border-red-200",
  Converted: "bg-teal-50 text-teal-700 border-teal-200",
  Lost: "bg-gray-100 text-gray-500 border-gray-200",
  // Campaign statuses
  Planning: "bg-sky-50 text-sky-700 border-sky-200",
  Paused: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  // Representation
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  former: "bg-gray-100 text-gray-400 border-gray-200",
  // Generic
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Upcoming: "bg-sky-50 text-sky-700 border-sky-200",
};

const OPPORTUNITY_TYPE_STYLES: Record<string, string> = {
  Career: "bg-blue-100 text-blue-800",
  NIL: "bg-purple-100 text-purple-800",
  Sponsorship: "bg-orange-100 text-orange-800",
  Endorsement: "bg-pink-100 text-pink-800",
  Event: "bg-yellow-100 text-yellow-800",
  Media: "bg-cyan-100 text-cyan-800",
  Speaking: "bg-indigo-100 text-indigo-800",
  Community: "bg-green-100 text-green-800",
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}

export function OpportunityTypeBadge({ type, className }: { type: string; className?: string }) {
  const style = OPPORTUNITY_TYPE_STYLES[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold", style, className)}>
      {type}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
}

export function KPICard({ title, value, subtitle, icon: Icon, iconColor = "text-primary", trend, trendValue, onClick }: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-5 shadow-sm",
        onClick && "cursor-pointer card-hover"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && trendValue && (
            <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg bg-accent/60", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="p-4 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, children, action, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            {title && <h3 className="font-semibold text-foreground">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-3 bg-muted rounded w-24 mb-2" />
              <div className="h-7 bg-muted rounded w-16" />
            </div>
            <div className="h-10 w-10 bg-muted rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    agent: "Agent",
    manager: "Manager",
    marketing_coordinator: "Marketing Coordinator",
    compliance_reviewer: "Compliance Reviewer",
    athlete: "Athlete",
    family_member: "Family Member",
    external_partner: "External Partner",
  };
  return labels[role] ?? role;
}

export function getRoleBadgeStyle(role: string): string {
  const styles: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    agent: "bg-orange-100 text-orange-800",
    manager: "bg-teal-100 text-teal-800",
    marketing_coordinator: "bg-pink-100 text-pink-800",
    compliance_reviewer: "bg-yellow-100 text-yellow-800",
    athlete: "bg-emerald-100 text-emerald-800",
    family_member: "bg-sky-100 text-sky-800",
    external_partner: "bg-gray-100 text-gray-700",
  };
  return styles[role] ?? "bg-gray-100 text-gray-700";
}
