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
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { SearchableSelect } from '@/components/ui/searchable-select';

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

const STATUS_OPTIONS = [
  'PENDING',
  'DELIVERED',
  'UNDELIVERABLE',
  'ACKNOWLEDGED',
  'EXPIRED',
  'ACCEPTED',
  'REJECTED',
  'UNKNOWN',
  'FAILED',
  'DND',
];

export default function MessageHistory() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const columns: ColumnDef<SentMessage>[] = [
    {
      accessorKey: 'sent_at',
      header: 'Date/Time',
      cell: ({ row }) => {
        const raw = row.getValue('sent_at') as string | undefined;
        if (!raw) return <span className="text-muted-foreground">-</span>;
        const date = new Date(raw);
        if (!isValid(date)) return <span className="text-muted-foreground">Invalid date</span>;
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
        const status = (row.getValue('status') as string || '').toUpperCase();
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
      const payload = await res.json();
      // Ensure sent_at exists and is ISO. Backend should provide sent_at; fallback to empty string.
      const data = Array.isArray(payload.data)
        ? payload.data.map((m: any) => ({ ...m, sent_at: m.sent_at ?? '' }))
        : [];
      setMessages(data);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to fetch messages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // compute inclusive start/end days for intuitive filtering
  const appliedStart = startDate ? startOfDay(startDate) : undefined;
  const appliedEnd = endDate ? endOfDay(endDate) : undefined;

  const filteredMessages = messages.filter(msg => {
    // date filter using ISO sent_at
    if (msg.sent_at) {
      const msgDate = new Date(msg.sent_at);
      if (!isValid(msgDate)) return false;
      if (appliedStart && msgDate < appliedStart) return false;
      if (appliedEnd && msgDate > appliedEnd) return false;
    } else {
      // if message has no sent_at, only include it when no date filters applied
      if (appliedStart || appliedEnd) return false;
    }

    // status filter: compare uppercase exact
    if (statusFilter && statusFilter.trim() !== '') {
      if ((msg.status || '').toUpperCase() !== statusFilter.toUpperCase()) return false;
    }

    return true;
  });

  const exportMessagesCSV = () => {
    if (filteredMessages.length === 0) {
      toast({ title: 'Info', description: 'No messages to export', variant: 'default' });
      return;
    }

    setExporting(true);

    try {
      const headers = ['Date/Time', 'Sender ID', 'Recipient', 'Message', 'Parts', 'Message ID', 'Status'];
      const rows = filteredMessages.map(m => {
        // safe date formatting
        const dateStr = m.sent_at && isValid(new Date(m.sent_at))
          ? format(new Date(m.sent_at), 'yyyy-MM-dd HH:mm')
          : '';
        return [
          `"${dateStr}"`,
          `"${(m.sender_alias || '').replace(/"/g, '""')}"`,
          `"${(m.phone_number || '').replace(/"/g, '""')}"`,
          `"${(m.message || '').replace(/"/g, '""')}"`,
          `"${m.number_of_parts ?? ''}"`,
          `"${m.message_id ?? ''}"`,
          `"${(m.status ?? '').toUpperCase()}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `message_history_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'CSV exported', variant: 'success'});
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter(undefined);
    toast({ title: 'Filters cleared', description: 'All filters have been reset', variant: 'success' });
  };

  // prepare SearchableSelect options
  const statusOptions = STATUS_OPTIONS.map(s => ({ value: s, label: s }));

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
                  <Button
                    variant="outline"
                    className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
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
                  <Button
                    variant="outline"
                    className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status (SearchableSelect) */}
            <div className="space-y-2 w-[240px]">
              <Label>Status</Label>
              <SearchableSelect
                options={statusOptions}
                value={statusFilter ?? ''}
                onValueChange={(v: string) => setStatusFilter(v || undefined)}
                placeholder="Filter by status..."
                searchPlaceholder="Search status..."
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => { /* filtering is reactive, this button kept for UX parity */ }} variant="default">
                <Filter className="mr-2 h-4 w-4" /> Apply
              </Button>
              <Button onClick={resetFilters} variant="ghost">Reset</Button>
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
