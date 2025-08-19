import React from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, BarChart3, CreditCard, Settings,
  UserPlus, Import, Send, FileText, History, TrendingUp, ShoppingCart, Receipt,
  User, Key, Bell, ChevronDown, ChevronRight, Shield,
  ClipboardList
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
    ]
  },
  { 
    title: 'Templates', icon: FileText, items: [
      { title: 'My Templates', url: '/console/templates', icon: FileText },
      { title: 'Create Template', url: '/console/templates/new', icon: FileText },
    ]
  },
  { title: 'Sender IDs', icon: Shield, items: [
      { title: 'My Sender IDs', url: '/console/sender-ids', icon: Shield },
      { title: 'Request New', url: '/console/sender-ids/request', icon: UserPlus },
    ]
  },
  { title: 'Billing', icon: CreditCard, items: [
      { title: 'Purchase Credits', url: '/console/billing/purchase', icon: ShoppingCart },
      { title: 'My Orders', url: '/console/billing', icon: ClipboardList },
      { title: 'Payment History', url: '/console/billing/history', icon: History },
      // { title: 'Invoices', url: '/console/billing/invoices', icon: Receipt },
      // { title: 'Usage', url: '/console/billing/usage', icon: BarChart3 },
    ]
  },
  // { title: 'Reports', icon: BarChart3, items: [
  //     { title: 'Delivery Reports', url: '/console/reports/delivery', icon: TrendingUp },
  //     { title: 'Analytics', url: '/console/reports/analytics', icon: BarChart3 },
  //     { title: 'Usage Reports', url: '/console/reports/usage', icon: BarChart3 },
  //   ]
  // },
  // { title: 'Settings', icon: Settings, items: [
  //     { title: 'Profile', url: '/console/settings/profile', icon: User },
  //     { title: 'API Keys', url: '/console/settings/api', icon: Key },
  //     { title: 'Notifications', url: '/console/settings/notifications', icon: Bell },
  //     { title: 'Security', url: '/console/settings/security', icon: Shield },
  //   ]
  // },
];

export const ModernSidebar = () => {
  const { state } = useSidebar();
  const [openItems, setOpenItems] = React.useState<string[]>(['Dashboard']);
  const isCollapsed = state === 'collapsed';

  const toggleItem = (title: string) => {
    setOpenItems(prev => prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]);
  };

  return (
    <Sidebar className={cn("h-full border-r border-sidebar-border bg-gradient-to-b from-sidebar-background to-sidebar-background/95 backdrop-blur-xl", isCollapsed ? "w-16" : "w-72")}>
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background/50 backdrop-blur">
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">S</div>
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

                return (
                  <SidebarMenuItem key={item.title}>
                    <Collapsible open={isOpen} onOpenChange={() => hasItems && toggleItem(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className="group w-full transition-all duration-200 hover:bg-sidebar-accent rounded-lg"
                            onClick={() => {
                              if (!hasItems && item.url) {
                                // SPA navigation via React Router
                                window.history.pushState({}, '', item.url);
                                window.dispatchEvent(new PopStateEvent('popstate'));
                              }
                            }}
                          >
                            <div className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-sidebar-foreground">
                              <div className="flex items-center gap-3">
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!isCollapsed && <span>{item.title}</span>}
                              </div>
                              {!isCollapsed && (
                                <div className="flex-none">
                                  {hasItems ? (
                                    isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-transparent" />
                                  )}
                                </div>
                              )}
                            </div>
                          </SidebarMenuButton>
                      </CollapsibleTrigger>

                      {!isCollapsed && hasItems && (
                        <CollapsibleContent className="pb-1">
                          <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border/50 pl-4">
                            {item.items?.map(subItem => (
                              <SidebarMenuButton key={subItem.title} asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={({ isActive }) => cn(
                                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all",
                                    isActive ? "bg-primary/10 text-primary font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
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