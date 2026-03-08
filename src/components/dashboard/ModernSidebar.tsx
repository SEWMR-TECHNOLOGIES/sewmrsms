import React from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, CreditCard, Settings,
  UserPlus, Send, FileText, History, ShoppingCart,
  Key, Bell, ChevronDown, ChevronRight, Shield, LogOut,
  ClipboardList, MailPlus, Zap
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, useSidebar 
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MenuSubItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
}

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  items?: MenuSubItem[];
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/console', icon: LayoutDashboard },
  { 
    title: 'Contacts', icon: Users, items: [
      { title: 'My Contacts', url: '/console/contacts', icon: Users },
      { title: 'Add Contact', url: '/console/contacts/new', icon: UserPlus },
      { title: 'Contact Groups', url: '/console/contacts/groups', icon: Users },
    ]
  },
  { 
    title: 'Messages', icon: MessageSquare, items: [
      { title: 'Quick Send', url: '/console/messages/quick-send', icon: Send },
      { title: 'From Template', url: '/console/messages/from-template', icon: FileText },
      { title: 'History', url: '/console/messages/history', icon: History },
    ]
  },
  { 
    title: 'Templates', icon: FileText, items: [
      { title: 'My Templates', url: '/console/templates', icon: FileText },
      { title: 'Create Template', url: '/console/templates/new', icon: FileText },
    ]
  }, 
  { title: 'Sender IDs', icon: Shield, items: [
      { title: 'Sender IDs', url: '/console/sender-ids', icon: Shield },
      { title: 'Request New', url: '/console/sender-ids/request', icon: MailPlus },
      { title: 'Requests', url: '/console/sender-ids/requests', icon: ClipboardList },
    ]
  },
  { title: 'Billing', icon: CreditCard, items: [
      { title: 'Purchase Credits', url: '/console/billing/purchase', icon: ShoppingCart },
      { title: 'My Orders', url: '/console/billing', icon: ClipboardList },
      { title: 'Payment History', url: '/console/billing/history', icon: History },
    ]
  },
  { title: 'Settings', icon: Settings, items: [
      { title: 'API Keys', url: '/console/settings/api-tokens', icon: Key },
      { title: 'Outage Notifications', url: '/console/settings/outage-notifications', icon: Bell },
    ]
  },
];

export const ModernSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCollapsed = state === 'collapsed';

  // Auto-open groups that contain the active route
  const getDefaultOpen = () => {
    return menuItems
      .filter(item => item.items?.some(sub => location.pathname.startsWith(sub.url)))
      .map(item => item.title);
  };

  const [openItems, setOpenItems] = React.useState<string[]>(getDefaultOpen);

  const toggleItem = (title: string) => {
    setOpenItems(prev => prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]);
  };

  const isItemActive = (url: string) => {
    if (url === '/console') return location.pathname === '/console';
    return location.pathname.startsWith(url);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Logged out", description: "You have been logged out." });
        navigate("/");
      }
    } catch {
      toast({ title: "Error", description: "Unable to logout", variant: "destructive" });
    }
  };

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r-0 bg-sidebar-background"
    >
      {/* Header */}
      <SidebarHeader className="p-0">
        <div className={cn(
          "flex items-center gap-3 px-5 py-5 transition-all duration-300",
          isCollapsed && "justify-center px-3"
        )}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Zap className="h-5 w-5" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-sidebar-background" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">SEWMR SMS</span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-[0.15em]">Console</span>
            </div>
          )}
        </div>
        <Separator className="opacity-50" />
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-3 py-3 modern-sidebar-scroll">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => {
                const isOpen = openItems.includes(item.title);
                const hasItems = item.items && item.items.length > 0;
                const isTopActive = item.url ? isItemActive(item.url) : false;
                const hasActiveChild = item.items?.some(sub => isItemActive(sub.url)) || false;

                return (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible open={isOpen} onOpenChange={() => hasItems && toggleItem(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "group w-full rounded-xl transition-all duration-200",
                            isTopActive
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : hasActiveChild
                                ? "bg-sidebar-accent text-sidebar-foreground"
                                : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                          )}
                          onClick={() => {
                            if (!hasItems && item.url) {
                              navigate(item.url);
                            }
                          }}
                        >
                          <div className={cn(
                            "flex items-center justify-between w-full px-3 py-2.5 text-[13px] font-medium",
                          )}>
                            <div className="flex items-center gap-3">
                              <item.icon className={cn(
                                "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                                isTopActive
                                  ? "text-primary-foreground"
                                  : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                              )} />
                              {!isCollapsed && <span>{item.title}</span>}
                            </div>
                            {!isCollapsed && hasItems && (
                              <div className="flex-none">
                                {isOpen
                                  ? <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                  : <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                                }
                              </div>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      {!isCollapsed && hasItems && (
                        <CollapsibleContent className="pb-1">
                          <div className="ml-[22px] mt-1 space-y-0.5 border-l-2 border-sidebar-border/40 pl-4">
                            {item.items?.map(subItem => {
                              const subActive = isItemActive(subItem.url);
                              return (
                                <SidebarMenuButton key={subItem.title} asChild>
                                  <NavLink
                                    to={subItem.url}
                                    className={cn(
                                      "flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-all duration-200",
                                      subActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                                    )}
                                  >
                                    <subItem.icon className={cn(
                                      "h-4 w-4 shrink-0",
                                      subActive ? "text-primary" : "text-sidebar-foreground/40"
                                    )} />
                                    <span>{subItem.title}</span>
                                    {subActive && (
                                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                  </NavLink>
                                </SidebarMenuButton>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 mt-auto">
        <Separator className="mb-3 opacity-30" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={isCollapsed ? "Logout" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
