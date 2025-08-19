import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  // Inside your Dashboard component
  const placeholderStats = [
    { title: 'Messages Sent Today', value: '...', change: '...', trend: null, icon: MessageSquare, color: 'text-blue-600' },
    { title: 'Delivery Rate', value: '...', change: '...', trend: null, icon: Send, color: 'text-green-600' },
    { title: 'Total Contacts', value: '...', change: '...', trend: null, icon: Users, color: 'text-purple-600' },
    { title: 'Credits Remaining', value: '...', change: '...', trend: null, icon: DollarSign, color: 'text-orange-600' },
  ];

  const [stats, setStats] = useState<any[]>(placeholderStats);
  const [loading, setLoading] = useState(true);

  // Fetch logic stays the same
  const fetchStats = async () => {
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/dashboard/stats', {
        credentials: 'include',
      });
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
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, []);

  const recentMessages = [
    {
      id: 1,
      recipient: 'Marketing Campaign',
      message: 'Special offer! Get 20% off your next purchase...',
      status: 'delivered',
      timestamp: '2 hours ago',
      count: 1250,
    },
    {
      id: 2,
      recipient: 'Payment Reminder',
      message: 'Your payment is due tomorrow. Please...',
      status: 'sent',
      timestamp: '4 hours ago',
      count: 45,
    },
    {
      id: 3,
      recipient: 'Event Notification',
      message: 'Reminder: Meeting scheduled for tomorrow...',
      status: 'failed',
      timestamp: '6 hours ago',
      count: 12,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your SMS campaigns.
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
        {loading ? (
          <p className="col-span-4 text-center text-muted-foreground">Loading stats...</p>
        ) : (
          stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="mr-1 h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3 text-red-600" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>
                  <span className="ml-1">from yesterday</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {message.recipient}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.message}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          message.status === 'delivered'
                            ? 'default'
                            : message.status === 'sent'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {message.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.count} recipients
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {message.timestamp}
                  </div>
                </div>
              ))}
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
              {/* <Button asChild variant="outline" className="justify-start">
                <Link to="/dashboard/reports/analytics">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
