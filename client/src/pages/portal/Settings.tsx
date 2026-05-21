import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader, SectionCard, getRoleLabel, getRoleBadgeStyle } from "@/components/shared";
import { LogOut, Shield, Bell, User, Mail, Calendar } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: profile } = trpc.athletes.getMyProfile.useQuery();
  const { data: notifications } = trpc.admin.getNotifications.useQuery();
  const markRead = trpc.admin.markNotificationRead.useMutation();

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* Account info */}
      <SectionCard title="Account Information">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.avatarUrl ?? ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AC"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{user?.name ?? "—"}</h3>
            <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            <div className="mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeStyle(user?.role ?? "")}`}>
                {getRoleLabel(user?.role ?? "")}
              </span>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Login Method</p>
            <p className="font-medium mt-0.5 capitalize">{user?.loginMethod ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="font-medium mt-0.5">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</p>
          </div>
        </div>
      </SectionCard>

      {/* Athlete profile link */}
      {profile && (
        <SectionCard title="Athlete Profile">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{profile.firstName} {profile.lastName}</p>
              <p className="text-sm text-muted-foreground">{profile.sport} · {profile.team ?? "No team"}</p>
            </div>
            <Badge variant="outline">{profile.representationStatus}</Badge>
          </div>
        </SectionCard>
      )}

      {/* Notifications */}
      <SectionCard title="Recent Notifications">
        {!notifications || notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications</p>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${!n.isRead ? "bg-accent/50" : ""}`}>
                <Bell className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => markRead.mutate({ id: n.id })}>
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Security */}
      <SectionCard title="Security">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
          <Shield className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">Authentication</p>
            <p className="text-xs text-muted-foreground">Secured via Manus OAuth. Your session is protected.</p>
          </div>
        </div>
      </SectionCard>

      {/* Sign out */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-muted-foreground">Sign out of your Athletes Collaborative account</p>
          </div>
          <Button variant="destructive" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />Sign Out
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
