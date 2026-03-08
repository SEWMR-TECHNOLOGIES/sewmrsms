import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, MessageSquare, Users, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeta } from "@/hooks/useMeta";

export default function Analytics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, messagesRes] = await Promise.all([
          fetch("https://api.sewmrsms.co.tz/api/v1/auth/dashboard/stats", { credentials: "include" }),
          fetch("https://api.sewmrsms.co.tz/api/v1/auth/dashboard/recent-messages", { credentials: "include" }),
        ]);
        const statsData = await statsRes.json();
        const messagesData = await messagesRes.json();

        if (statsData.success) setStats(statsData.data);
        if (messagesData.success) setRecentMessages(messagesData.data?.messages ?? []);
      } catch {
        toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useMeta({ title: "Analytics", description: "View your SEWMR SMS messaging analytics and account statistics." });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { title: "Total Messages Sent", value: stats?.total_messages_sent ?? 0, icon: MessageSquare, color: "text-primary" },
    { title: "Remaining SMS", value: stats?.remaining_sms ?? 0, icon: TrendingUp, color: "text-success" },
    { title: "Total Contacts", value: stats?.total_contacts ?? 0, icon: Users, color: "text-info" },
    { title: "Active Sender IDs", value: stats?.active_sender_ids ?? 0, icon: BarChart3, color: "text-warning" },
  ];

  // Calculate delivery stats from recent messages
  const delivered = recentMessages.filter(m => m.status?.toUpperCase() === "DELIVERED").length;
  const failed = recentMessages.filter(m => ["FAILED", "REJECTED", "DND"].includes(m.status?.toUpperCase())).length;
  const pending = recentMessages.filter(m => ["PENDING", "ACKNOWLEDGED"].includes(m.status?.toUpperCase())).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Overview of your messaging performance and account statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">{c.title}</p>
                  <Icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <p className="text-2xl font-bold">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delivery Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Breakdown (Recent)</CardTitle>
          <CardDescription>Based on your most recent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <p className="text-3xl font-bold text-primary">{delivered}</p>
              <p className="text-sm text-muted-foreground mt-1">Delivered</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/5">
              <p className="text-3xl font-bold text-destructive">{failed}</p>
              <p className="text-sm text-muted-foreground mt-1">Failed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5">
              <p className="text-3xl font-bold text-warning">{pending}</p>
              <p className="text-sm text-muted-foreground mt-1">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest sent messages</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent messages</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.slice(0, 10).map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.phone_number}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.message}</p>
                  </div>
                  <Badge variant={m.status?.toUpperCase() === "DELIVERED" ? "default" : "secondary"} className="ml-2 shrink-0 text-xs">
                    {m.status?.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
