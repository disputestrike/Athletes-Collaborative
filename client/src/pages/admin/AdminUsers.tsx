import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState, TableSkeleton, formatDate, getRoleLabel, getRoleBadgeStyle } from "@/components/shared";
import { toast } from "sonner";
import { Users, Search, Shield } from "lucide-react";

const ROLES = [
  { value: "user", label: "Athlete" },
  { value: "admin", label: "Admin" },
  { value: "agent", label: "Agent" },
  { value: "manager", label: "Manager" },
  { value: "marketing_coordinator", label: "Marketing Coordinator" },
  { value: "compliance_reviewer", label: "Compliance Reviewer" },
  { value: "family_member", label: "Family Member" },
  { value: "external_partner", label: "External Partner" },
];

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.admin.getUsers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = users?.filter(u =>
    !search || (u.name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Portal Users" subtitle="Manage user accounts and role-based access control" />

      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Role-Based Access Control</p>
          <p className="text-xs text-blue-600">Each role has specific permissions. Assign roles carefully. Owner/Super Admin has full access.</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Athletes", role: "user" },
          { label: "Staff", roles: ["admin", "agent", "manager", "marketing_coordinator", "compliance_reviewer"] },
          { label: "Family", role: "family_member" },
          { label: "Partners", role: "external_partner" },
        ].map(({ label, role, roles }) => {
          const count = users?.filter(u => roles ? roles.includes(u.role) : u.role === role).length ?? 0;
          return (
            <div key={label} className="bg-card border border-border rounded-lg p-3 text-center">
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Users appear here after they sign in." />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Last Sign In</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {(u.name ?? "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{u.name ?? "—"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">{formatDate(u.lastSignedIn)}</td>
                  <td className="px-4 py-3 text-right">
                    <Select
                      value={u.role}
                      onValueChange={v => updateRoleMutation.mutate({ userId: u.id, role: v as any })}
                    >
                      <SelectTrigger className="h-7 text-xs w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
