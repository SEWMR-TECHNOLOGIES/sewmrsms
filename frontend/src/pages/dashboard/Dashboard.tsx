import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Send,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function formatRelative(isoTs: string) {
  try {
    const d = new Date(isoTs);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000); // seconds
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return isoTs;
  }
}

export default function Dashboard() {
  const placeholderStats = [
    { title: 'Messages Sent Today', value: '', change: '', trend: null, icon: MessageSquare, color: 'text-blue-600' },
    { title: 'Delivery Rate', value: '', change: '', trend: null, icon: Send, color: 'text-green-600' },
    { title: 'Total Contacts', value: '', change: '', trend: null, icon: Users, color: 'text-purple-600' },
    { title: 'Credits Remaining', value: '', change: '', trend: null, icon: DollarSign, color: 'text-orange-600' },
  ];

  const [stats, setStats] = useState<any[]>(placeholderStats);
  const [loadingStats, setLoadingStats] = useState(true);

  const [recentMessages, setRecentMessages] = useState<any[] | null>(null); 
  const [loadingRecent, setLoadingRecent] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/dashboard/stats', { credentials: 'include' });
      const data = await res.json();
      if (data?.metrics) {
        const mapped = [
          {
            title: 'Messages Sent Today',
            value: data.metrics.messages_sent_today.value,
            change: `${data.metrics.messages_sent_today.change}%`,
            trend: data.metrics.messages_sent_today.trend,
            icon: MessageSquare,
            color: 'text-blue-600',
          },
          {
            title: 'Delivery Rate',
            value: `${data.metrics.delivery_rate.value}%`,
            change: `${data.metrics.delivery_rate.change}%`,
            trend: data.metrics.delivery_rate.trend,
            icon: Send,
            color: 'text-green-600',
          },
          {
            title: 'Total Contacts',
            value: data.metrics.total_contacts.value,
            change: `${data.metrics.total_contacts.change}%`,
            trend: data.metrics.total_contacts.trend,
            icon: Users,
            color: 'text-purple-600',
          },
          {
            title: 'Credits Remaining',
            value: data.metrics.credits_remaining.value,
            change: `${data.metrics.credits_remaining.change}%`,
            trend: data.metrics.credits_remaining.trend,
            icon: DollarSign,
            color: 'text-orange-600',
          },
        ];
        setStats(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentMessages = async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/dashboard/recent-messages?limit=6', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data?.recent_messages)) {
        setRecentMessages(
          data.recent_messages.map((m: any) => ({
            id: m.id,
            recipient: m.recipient || 'Untitled',
            message: m.message || '',
            status: m.status || 'pending',
            timestamp: m.timestamp || m.created_at || new Date().toISOString(),
            count: m.count || 0,
          }))
        );
      } else {
        setRecentMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch recent messages', err);
      setRecentMessages([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentMessages();
    const statsInterval = setInterval(fetchStats, 5 * 60 * 1000);
    const recentInterval = setInterval(fetchRecentMessages, 2 * 60 * 1000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(recentInterval);
    };
  }, []);

  const badgeVariantFor = (status: string) => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'sent') return 'default';
    if (s === 'partial') return 'secondary';
    if (s === 'failed' || s === 'undeliverable') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back. Here's what's happening with your SMS campaigns.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/console/messages/quick-send">
              <Send className="mr-2 h-4 w-4" />
              Quick Send
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded mt-1" />
                  <div className="h-3 w-1/3 bg-slate-200 rounded mt-1" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                    ) : stat.trend === 'down' ? (
                      <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                    ) : null}
                    <span className={stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}>
                      {stat.change}
                    </span>
                    <span className="ml-1">from yesterday</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              Your latest SMS campaigns and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingRecent ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-1/3 bg-slate-200 rounded" />
                      <div className="h-3 w-2/3 bg-slate-200 rounded mt-1" />
                      <div className="h-3 w-1/4 bg-slate-200 rounded mt-2" />
                    </div>
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                  </div>
                ))
              ) : recentMessages && recentMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6">
                  You have no scheduled messages at the moment.
                </div>
              ) : (
                recentMessages?.map((message) => (
                  <div key={message.id} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {message.recipient}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {message.message}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={badgeVariantFor(message.status)} className="text-xs">
                          {message.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.count} recipients
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(message.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/console/messages/history">View All Messages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/console/messages/quick-send">
                  <Send className="mr-2 h-4 w-4" />
                  Send SMS
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/console/contacts/new">
                  <Users className="mr-2 h-4 w-4" />
                  Add Contacts
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/console/billing/purchase">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Purchase Credits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
