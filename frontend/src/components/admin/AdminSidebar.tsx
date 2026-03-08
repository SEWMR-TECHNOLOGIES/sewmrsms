import React from "react";
import {
  LayoutDashboard, Users, MessageSquare, Send, CreditCard,
  Radio, Network, Settings, ScrollText, Shield, Package, LogOut,
  ChevronRight, Zap, FileCheck
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

const menuSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ]
  },
  {
    label: "User Management",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Subscriptions", url: "/admin/subscriptions", icon: Package },
    ]
  },
  {
    label: "Sender Management",
    items: [
      { title: "Sender Requests", url: "/admin/sender-requests", icon: Send },
      { title: "Sender IDs", url: "/admin/sender-ids", icon: Radio },
      { title: "Propagations", url: "/admin/propagations", icon: Network },
      { title: "Documents", url: "/admin/documents", icon: FileCheck },
    ]
  },
  {
    label: "Transactions",
    items: [
      { title: "Orders & Payments", url: "/admin/orders", icon: CreditCard },
      { title: "SMS Logs", url: "/admin/sms-logs", icon: MessageSquare },
    ]
  },
  {
    label: "Configuration",
    items: [
      { title: "Networks", url: "/admin/networks", icon: Network },
      { title: "Packages", url: "/admin/packages", icon: Package },
      { title: "System Settings", url: "/admin/settings", icon: Settings },
    ]
  },
  {
    label: "Administration",
    items: [
      { title: "Activity Logs", url: "/admin/activity-logs", icon: ScrollText },
      { title: "Admin Accounts", url: "/admin/admins", icon: Shield },
    ]
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/auth/logout`, { method: "POST", credentials: "include" });
      toast({ title: "Logged out successfully" });
      navigate("/admin/login");
    } catch {
      navigate("/admin/login");
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar-background">
      <SidebarHeader className="p-0">
        <div className={cn(
          "flex items-center gap-3 px-5 py-5 transition-all duration-300",
          collapsed && "justify-center px-3"
        )}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Zap className="h-5 w-5" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-sidebar-background" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">SEWMR</span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-[0.15em]">Admin Panel</span>
            </div>
          )}
        </div>
        <Separator className="opacity-50" />
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 admin-sidebar-scroll">
        {menuSections.map((section, idx) => (
          <SidebarGroup key={section.label} className={cn(idx > 0 && "mt-4")}>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                  {section.label}
                </span>
              </div>
            )}
            {collapsed && idx > 0 && <Separator className="my-2 opacity-30" />}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={active}
                        tooltip={collapsed ? item.title : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                          active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                          active ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                        )} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                          </>
                        )}
                        {active && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-primary-foreground/80" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto">
        <Separator className="mb-3 opacity-30" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={collapsed ? "Logout" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
