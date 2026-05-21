import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ACLogo from "./ACLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getRoleLabel } from "./shared";
import {
  LayoutDashboard, User, FileText, Briefcase, Megaphone,
  ShieldCheck, BookOpen, MessageSquare, Settings, LogOut,
  Menu, Bell, ChevronRight, Users, BarChart3, Building2,
  GraduationCap, Heart, UserCog, X, Users2
} from "lucide-react";

const STAFF_ROLES = ["owner", "admin", "agent", "manager", "marketing_coordinator", "compliance_reviewer"];

const athleteNav = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/profile", label: "My Profile", icon: User },
  { href: "/portal/contracts", label: "Contracts", icon: FileText },
  { href: "/portal/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/portal/marketing", label: "Marketing", icon: Megaphone },
  { href: "/portal/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/portal/growth", label: "Growth Hub", icon: BookOpen },
  { href: "/portal/messages", label: "Messages", icon: MessageSquare },
  { href: "/portal/settings", label: "Settings", icon: Settings },
];

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/athletes", label: "Athletes", icon: Users },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/growth", label: "Growth Content", icon: GraduationCap },
  { href: "/admin/partners", label: "Partners", icon: Building2 },
  { href: "/admin/outreach", label: "Outreach", icon: Heart },
  { href: "/admin/team-family", label: "Team & Family", icon: Users2 },
  { href: "/admin/users", label: "Portal Users", icon: UserCog },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ href, label, icon: Icon, badge, onClick }: NavItemProps) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/portal" && href !== "/admin" && location.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        "hover:bg-sidebar-accent hover:text-sidebar-primary",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary"
          : "text-sidebar-foreground/70"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-5 flex items-center justify-center rounded-full px-1">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
      {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
    </Link>
  );
}

interface SidebarProps {
  isAdmin: boolean;
  unreadCount?: number;
  onClose?: () => void;
}

function Sidebar({ isAdmin, unreadCount, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const nav = isAdmin ? adminNav : athleteNav;

  return (
    <div className="flex flex-col h-full bg-sidebar-background">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <ACLogo size="md" />
        {onClose && (
          <button onClick={onClose} className="text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Shell switcher */}
      {STAFF_ROLES.includes(user?.role ?? "") && (
        <div className="px-3 pt-3">
          <div className="flex rounded-lg bg-sidebar-accent p-1 gap-1">
            <Link
              href="/portal"
              className={cn(
                "flex-1 text-center text-xs py-1.5 rounded-md font-medium transition-colors",
                !location.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              Portal
            </Link>
            <Link
              href="/admin"
              className={cn(
                "flex-1 text-center text-xs py-1.5 rounded-md font-medium transition-colors",
                location.startsWith("/admin") ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
              )}
            >
              Admin
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
        {nav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href.includes("messages") ? unreadCount : undefined}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.avatarUrl ?? ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AC"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{getRoleLabel(user?.role ?? "")}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/portal/settings")}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface PortalLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function PortalLayout({ children, isAdmin = false }: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: unreadCount } = trpc.messages.getUnreadCount.useQuery();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 border-r border-border">
        <Sidebar isAdmin={isAdmin} unreadCount={unreadCount ?? 0} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar-background border-sidebar-border">
          <Sidebar isAdmin={isAdmin} unreadCount={unreadCount ?? 0} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 lg:hidden flex justify-center">
            <ACLogoDark size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function ACLogoDark({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="#F97316" />
        <path d="M24 8L38 15V27C38 34.5 31.5 40.5 24 43C16.5 40.5 10 34.5 10 27V15L24 8Z" fill="white" fillOpacity="0.15" />
        <path d="M18 34L22 20H26L30 34H27.5L26.8 31.5H21.2L20.5 34H18ZM22 29H26L24 22.5L22 29Z" fill="white" />
        <rect x="10" y="38" width="28" height="2.5" rx="1.25" fill="white" fillOpacity="0.4" />
      </svg>
      <span className="font-bold text-sm text-foreground">Athletes Collaborative</span>
    </div>
  );
}

function NotificationBell() {
  const { data: notifications } = trpc.admin.getNotifications.useQuery();
  const unread = notifications?.filter(n => !n.isRead).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications?.slice(0, 5).map(n => (
          <DropdownMenuItem key={n.id} className={cn("flex-col items-start gap-0.5 py-2", !n.isRead && "bg-accent/50")}>
            <span className="font-medium text-sm">{n.title}</span>
            {n.body && <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>}
          </DropdownMenuItem>
        ))}
        {(!notifications || notifications.length === 0) && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No notifications</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
