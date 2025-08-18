import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MessageSquare,
  Send,
  FileText,
  CreditCard,
  Settings,
  Bell,
  BarChart3,
  ChevronDown,
  Zap,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import logo from '@/assets/logo.png';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Contacts',
    icon: Users,
    items: [
      { title: 'New Contact', url: '/dashboard/contacts/new', icon: UserPlus },
      { title: 'My Contacts', url: '/dashboard/contacts', icon: Users },
      { title: 'Import Contacts', url: '/dashboard/contacts/import', icon: FileText },
    ],
  },
  {
    title: 'Messages',
    icon: MessageSquare,
    items: [
      { title: 'Quick Send', url: '/console/messages/quick-send', icon: Zap },
      { title: 'Send from Template', url: '/dashboard/messages/template', icon: FileText },
      { title: 'Message History', url: '/dashboard/messages/history', icon: MessageSquare },
      { title: 'Templates', url: '/dashboard/messages/templates', icon: FileText },
    ],
  },
  {
    title: 'Reports',
    icon: BarChart3,
    items: [
      { title: 'Delivery Reports', url: '/dashboard/reports/delivery', icon: Send },
      { title: 'Analytics', url: '/dashboard/reports/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Billing',
    icon: CreditCard,
    items: [
      { title: 'Purchase Credits', url: '/purchase/billing/purchase', icon: CreditCard },
      { title: 'Payment History', url: '/purchase/billing/history', icon: FileText },
      { title: 'Invoices', url: '/purchase/billing/invoices', icon: FileText },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    items: [
      { title: 'Profile', url: '/dashboard/settings/profile', icon: Settings },
      { title: 'API Keys', url: '/dashboard/settings/api', icon: Settings },
      { title: 'Notifications', url: '/dashboard/settings/notifications', icon: Bell },
    ],
  },
];

export const DashboardSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items: any[]) => items.some(item => isActive(item.url));

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="SEWMR SMS" className="h-8 w-auto" />
            {!collapsed && (
              <span className="font-bold text-lg">Dashboard</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible
                      defaultOpen={isGroupActive(item.items)}
                      className="group/collapsible"
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="data-[state=open]:bg-muted/50">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && (
                            <>
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={({ isActive }) =>
                                    `flex items-center space-x-2 ${
                                      isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
                                    }`
                                  }
                                >
                                  <subItem.icon className="h-3 w-3" />
                                  {!collapsed && <span>{subItem.title}</span>}
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center space-x-2 ${
                            isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
                          }`
                        }
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};