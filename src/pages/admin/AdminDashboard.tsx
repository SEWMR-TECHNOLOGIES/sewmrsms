import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Send, CreditCard, Package, Radio, Loader2 } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

interface Stats {
  total_users: number;
  new_users_this_month: number;
  total_sms_sent: number;
  sms_last_7_days: number;
  pending_sender_requests: number;
  in_review_sender_requests: number;
  active_subscriptions: number;
  total_revenue: number;
  pending_payments: number;
  total_contacts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  useMeta({ title: "Admin Dashboard", description: "Overview of SEWMR SMS platform statistics and metrics." });

  useEffect(() => {
    fetch(`${API_BASE}/admin/dashboard/stats`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { title: "Total Users", value: stats?.total_users ?? 0, sub: `${stats?.new_users_this_month ?? 0} new this month`, icon: Users, color: "text-blue-600" },
    { title: "SMS Sent", value: stats?.total_sms_sent?.toLocaleString() ?? 0, sub: `${stats?.sms_last_7_days ?? 0} last 7 days`, icon: MessageSquare, color: "text-green-600" },
    { title: "Pending Requests", value: stats?.pending_sender_requests ?? 0, sub: `${stats?.in_review_sender_requests ?? 0} in review`, icon: Send, color: "text-orange-600" },
    { title: "Active Subscriptions", value: stats?.active_subscriptions ?? 0, sub: `${stats?.pending_payments ?? 0} pending payments`, icon: Package, color: "text-purple-600" },
    { title: "Total Revenue", value: `TZS ${(stats?.total_revenue ?? 0).toLocaleString()}`, sub: "All time", icon: CreditCard, color: "text-emerald-600" },
    { title: "Total Contacts", value: stats?.total_contacts?.toLocaleString() ?? 0, sub: "Across all users", icon: Radio, color: "text-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
