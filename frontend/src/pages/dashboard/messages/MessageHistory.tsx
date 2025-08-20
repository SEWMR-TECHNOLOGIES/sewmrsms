import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { CalendarIcon, Download, MessageSquare, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

interface SentMessage {
  id: number;
  sender_alias: string;
  phone_number: string;
  message: string;
  message_id: string | null;
  remarks: string | null;
  number_of_parts: number;
  sent_at: string;
  status: string;
}

export default function MessageHistory() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const columns: ColumnDef<SentMessage>[] = [
    {
      accessorKey: 'sent_at',
      header: 'Date/Time',
      cell: ({ row }) => {
        const date = new Date(row.getValue('sent_at'));
        return (
          <div className="space-y-1">
            <div className="font-medium">{format(date, 'MMM dd, yyyy')}</div>
            <div className="text-sm text-muted-foreground">{format(date, 'HH:mm')}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sender_alias',
      header: 'Sender ID',
      cell: ({ row }) => <Badge variant="outline" className="font-mono">{row.getValue('sender_alias')}</Badge>,
    },
    {
      accessorKey: 'phone_number',
      header: 'Recipient',
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('phone_number')}</span>,
    },
    {
      accessorKey: 'message',
      header: 'Message',
      enableColumnFilter: true,
      filterFn: 'includesString',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={row.getValue('message')}>{row.getValue('message')}</p>
        </div>
      ),
    },
    {
      accessorKey: 'number_of_parts',
      header: 'Parts',
      cell: ({ row }) => {
        const parts = row.getValue('number_of_parts') as number;
        return <Badge variant={parts > 1 ? 'secondary' : 'outline'}>{parts}</Badge>;
      },
    },
    {
      accessorKey: 'message_id',
      header: 'Message ID',
      cell: ({ row }) => {
        const messageId = row.getValue('message_id') as string | null;
        return messageId ? (
          <span className="font-mono text-xs text-muted-foreground">{messageId.substring(0, 8)}...</span>
        ) : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variant =
          status === 'DELIVERED' || status === 'ACKNOWLEDGED' || status === 'ACCEPTED'
            ? 'default'
            : status === 'FAILED'
            ? 'destructive'
            : 'secondary';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
  ];

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sms/history', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data.data || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filtered messages by date and status locally
  const filteredMessages = messages.filter(msg => {
    const msgDate = new Date(msg.sent_at);
    const matchDate =
      (!startDate || msgDate >= startDate) &&
      (!endDate || msgDate <= endDate);

    const matchStatus =
      !statusFilter || msg.status.toUpperCase() === statusFilter.toUpperCase();

    return matchDate && matchStatus;
  });

  const exportMessagesCSV = () => {
    if (filteredMessages.length === 0) {
      toast({ title: 'Info', description: 'No messages to export', variant: 'default' });
      return;
    }

    setExporting(true);

    const headers = ['Date/Time', 'Sender ID', 'Recipient', 'Message', 'Parts', 'Message ID', 'Status'];
    const rows = filteredMessages.map(m => [
      `"${format(new Date(m.sent_at), 'yyyy-MM-dd HH:mm')}"`,
      `"${m.sender_alias}"`,
      `"${m.phone_number}"`,
      `"${m.message.replace(/"/g, '""')}"`,
      `"${m.number_of_parts}"`,
      `"${m.message_id || ''}"`,
      `"${m.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `message_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message History</h1>
          <p className="text-muted-foreground">View, filter, and export your sent messages</p>
        </div>
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Export
          </CardTitle>
          <CardDescription>Filter messages by date range and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={statusFilter || ''}
                onChange={e => setStatusFilter(e.target.value || undefined)}
                className="border rounded p-2 w-full"
              >
                <option value="">All</option>
                <option value="PENDING">PENDING</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="UNDELIVERABLE">UNDELIVERABLE</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="UNKNOWN">UNKNOWN</option>
                <option value="FAILED">FAILED</option>
                <option value="DND">DND</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => {}} variant="default">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button onClick={exportMessagesCSV} variant="outline" disabled={exporting || filteredMessages.length === 0}>
                <Download className="mr-2 h-4 w-4" /> {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
          <CardDescription>All your sent messages with delivery status</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={filteredMessages} searchPlaceholder="Search messages..." />
        </CardContent>
      </Card>
    </div>
  );
}
