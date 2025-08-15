import React from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, BarChart3, CreditCard, Settings,
  UserPlus, Import, Send, FileText, History, TrendingUp, ShoppingCart, Receipt,
  User, Key, Bell, ChevronDown, ChevronRight, Shield
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar 
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

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
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { 
    title: 'Contacts', icon: Users, items: [
      { title: 'My Contacts', url: '/dashboard/contacts', icon: Users },
      { title: 'Add Contact', url: '/dashboard/contacts/new', icon: UserPlus },
      { title: 'Import Contacts', url: '/dashboard/contacts/import', icon: Import },
      { title: 'Contact Groups', url: '/dashboard/contacts/groups', icon: Users },
    ]
  },
  { 
    title: 'Messages', icon: MessageSquare, items: [
      { title: 'Quick Send', url: '/dashboard/messages/quick-send', icon: Send },
      { title: 'From Template', url: '/dashboard/messages/template', icon: FileText },
      { title: 'Bulk Send', url: '/dashboard/messages/bulk', icon: MessageSquare },
      { title: 'Message History', url: '/dashboard/messages/history', icon: History },
      { title: 'Templates', url: '/dashboard/messages/templates', icon: FileText },
    ]
  },
  { 
    title: 'Sender IDs', icon: Shield, items: [
      { title: 'My Sender IDs', url: '/dashboard/sender-ids', icon: Shield },
      { title: 'Request New', url: '/dashboard/sender-ids/request', icon: UserPlus },
      { title: 'Network Status', url: '/dashboard/sender-ids/networks', icon: TrendingUp },
    ]
  },
  { 
    title: 'Reports', icon: BarChart3, items: [
      { title: 'Delivery Reports', url: '/dashboard/reports/delivery', icon: TrendingUp },
      { title: 'Analytics', url: '/dashboard/reports/analytics', icon: BarChart3 },
      { title: 'Usage Reports', url: '/dashboard/reports/usage', icon: BarChart3 },
    ]
  },
  { 
    title: 'Billing', icon: CreditCard, items: [
      { title: 'Purchase Credits', url: '/dashboard/billing/purchase', icon: ShoppingCart },
      { title: 'Payment History', url: '/dashboard/billing/history', icon: History },
      { title: 'Invoices', url: '/dashboard/billing/invoices', icon: Receipt },
      { title: 'Usage', url: '/dashboard/billing/usage', icon: BarChart3 },
    ]
  },
  { 
    title: 'Settings', icon: Settings, items: [
      { title: 'Profile', url: '/dashboard/settings/profile', icon: User },
      { title: 'API Keys', url: '/dashboard/settings/api', icon: Key },
      { title: 'Notifications', url: '/dashboard/settings/notifications', icon: Bell },
      { title: 'Security', url: '/dashboard/settings/security', icon: Shield },
    ]
  },
];

export const ModernSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const [openItems, setOpenItems] = React.useState<string[]>(['Dashboard']);

  const isCollapsed = state === 'collapsed';

  const toggleItem = (title: string) => {
    setOpenItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  return (
    <Sidebar 
      className={cn(
        "h-full border-r border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-background/95 backdrop-blur-xl",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background/50 backdrop-blur">
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            S
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-sm">SEWMR SMS</span>
              <span className="text-xs text-sidebar-foreground/60">Messaging Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isOpen = openItems.includes(item.title);
                const hasItems = item.items && item.items.length > 0;

                // Simple menu item
                if (!hasItems) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url!}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground",
                              isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : ""
                            )
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Menu item with submenu
                return (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="group w-full transition-all duration-200 hover:bg-sidebar-accent rounded-lg">
                          <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground">
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1 ml-2">{item.title}</span>
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 transition-transform" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 transition-transform" />
                                )}
                              </>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      {!isCollapsed && (
                        <CollapsibleContent className="pb-1">
                          <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border/50 pl-4">
                            {item.items?.map((subItem) => (
                              <SidebarMenuButton key={subItem.title} asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all",
                                    isActive
                                      ? "bg-primary/10 text-primary font-medium"
                                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                  )}
                                >
                                  <subItem.icon className="h-4 w-4 shrink-0" />
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            ))}
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
    </Sidebar>
  );
};
