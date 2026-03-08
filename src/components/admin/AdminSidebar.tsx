import React from "react";
import {
  LayoutDashboard, Users, MessageSquare, Send, CreditCard,
  Radio, Network, Settings, ScrollText, Shield, Package, LogOut,
  ChevronRight, Zap
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          collapsed && "justify-center"
        )}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Zap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">SEWMR</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Panel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {menuSections.map((section, idx) => (
          <SidebarGroup key={section.label} className={cn(idx > 0 && "mt-2")}>
            {!collapsed && (
              <div className="px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </span>
              </div>
            )}
            {collapsed && idx > 0 && <Separator className="my-2 mx-2" />}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => navigate(item.url)}
                        isActive={active}
                        tooltip={collapsed ? item.title : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          active 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          active && "scale-110"
                        )} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.title}</span>
                            {active && (
                              <ChevronRight className="h-4 w-4 opacity-50" />
                            )}
                          </>
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
        <Separator className="mb-3" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={collapsed ? "Logout" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "text-destructive hover:bg-destructive/10",
                collapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
