import React from "react";
import {
  LayoutDashboard, Users, MessageSquare, Send, CreditCard,
  Radio, Network, Settings, ScrollText, Shield, Package, LogOut
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from "@/components/ui/sidebar";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Sender ID Requests", url: "/admin/sender-requests", icon: Send },
  { title: "Sender IDs", url: "/admin/sender-ids", icon: Radio },
  { title: "Propagations", url: "/admin/propagations", icon: Network },
  { title: "Subscriptions", url: "/admin/subscriptions", icon: Package },
  { title: "Orders & Payments", url: "/admin/orders", icon: CreditCard },
  { title: "SMS Logs", url: "/admin/sms-logs", icon: MessageSquare },
  { title: "Networks", url: "/admin/networks", icon: Network },
  { title: "Packages", url: "/admin/packages", icon: Package },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
  { title: "Activity Logs", url: "/admin/activity-logs", icon: ScrollText },
  { title: "Admin Accounts", url: "/admin/admins", icon: Shield },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isActive = (url: string) => {
    if (url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(url);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/auth/logout`, { method: "POST", credentials: "include" });
      toast({ title: "Logged out" });
      navigate("/admin/login");
    } catch {
      navigate("/admin/login");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            SEWMR Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={isActive(item.url) ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => { e.preventDefault(); navigate(item.url); }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
