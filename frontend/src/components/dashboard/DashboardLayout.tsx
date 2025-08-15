import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ModernSidebar } from './ModernSidebar';
import { DashboardHeader } from './DashboardHeader';
import { AuthGuard } from '@/components/AuthGuard';
import { Outlet } from 'react-router-dom';

export const DashboardLayout = () => {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <ModernSidebar />
          <div className="flex-1 flex flex-col ml-4">
            <DashboardHeader />
            <main className="flex-1 p-6 bg-muted/30 ml-2">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};
