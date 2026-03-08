import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard, useAdmin } from "./AdminGuard";
import { Badge } from "@/components/ui/badge";

function AdminLayoutInner() {
  const { admin } = useAdmin();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full admin-no-scrollbar">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">{admin?.role}</Badge>
              <span className="text-sm text-muted-foreground">
                {admin?.first_name} {admin?.last_name}
              </span>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function AdminLayout() {
  return (
    <AdminGuard>
      <AdminLayoutInner />
    </AdminGuard>
  );
}
