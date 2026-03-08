import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, MessageSquare, Filter, Loader2, RefreshCw } from 'lucide-react';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useMeta } from '@/hooks/useMeta';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

const STATUS_OPTIONS = [
  'PENDING', 'DELIVERED', 'UNDELIVERABLE', 'ACKNOWLEDGED',
  'EXPIRED', 'ACCEPTED', 'REJECTED', 'UNKNOWN', 'FAILED', 'DND',
];

const PAGE_SIZE = 50;

export default function MessageHistory() {
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('start_date', startOfDay(startDate).toISOString());
      if (endDate) params.set('end_date', endOfDay(endDate).toISOString());

      const res = await fetch(
        `https://api.sewmrsms.co.tz/api/v1/sms/history?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch messages');
      const payload = await res.json();

      const data = Array.isArray(payload.data)
        ? payload.data.map((m: any) => ({ ...m, sent_at: m.sent_at ?? '' }))
        : [];
      
      if (append) {
        setMessages(prev => [...prev, ...data]);
      } else {
        setMessages(data);
      }
      setPagination(payload.pagination ?? null);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to fetch messages', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, startDate, endDate, toast]);

  useEffect(() => {
    fetchMessages(1, false);
  }, []);

  const applyFilters = () => {
    setPage(1);
    setMessages([]);
    fetchMessages(1, false);
  };

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter(undefined);
    setPage(1);
    setMessages([]);
    fetchMessages(1, false);
  };

  const loadMore = () => {
    if (pagination && page < pagination.total_pages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage, true);
    }
  };

  const exportMessagesCSV = () => {
    if (messages.length === 0) {
      toast({ title: 'Info', description: 'No messages to export', variant: 'default' });
      return;
    }
    setExporting(true);
    try {
      const headers = ['Date/Time', 'Sender ID', 'Recipient', 'Message', 'Parts', 'Message ID', 'Status'];
      const rows = messages.map(m => {
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
      link.setAttribute('download', `message_history_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Success', description: 'CSV exported', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to export CSV', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const statusOptions = STATUS_OPTIONS.map(s => ({ value: s, label: s }));

  useMeta({
    title: "Message History",
    description: "View, filter, and export your sent SMS messages."
  });

  const totalCount = pagination?.total_count ?? messages.length;
  const hasMore = pagination ? page < pagination.total_pages : false;

  const getStatusVariant = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DELIVERED' || s === 'ACKNOWLEDGED' || s === 'ACCEPTED') return 'default';
    if (s === 'FAILED' || s === 'REJECTED' || s === 'DND') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message History</h1>
          <p className="text-sm text-muted-foreground">View, filter, and export your sent messages</p>
        </div>
        <MessageSquare className="h-7 w-7 text-primary" />
      </div>

      {/* Filters */}
      <Card className="flex-shrink-0">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 w-[180px]">
              <Label className="text-xs">Status</Label>
              <SearchableSelect
                options={statusOptions}
                value={statusFilter ?? ''}
                onValueChange={(v: string) => setStatusFilter(v || undefined)}
                placeholder="Filter status..."
                searchPlaceholder="Search..."
                className="w-full h-8"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters} size="sm">
                <Filter className="mr-1.5 h-3.5 w-3.5" /> Apply
              </Button>
              <Button onClick={resetFilters} variant="ghost" size="sm">Reset</Button>
              <Button onClick={exportMessagesCSV} variant="outline" size="sm" disabled={exporting || messages.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> {exporting ? 'Exporting...' : 'CSV'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Messages</CardTitle>
              <CardDescription className="text-xs">
                Showing {messages.length} of {totalCount} messages
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setPage(1); setMessages([]); fetchMessages(1, false); }} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[130px]">Date/Time</TableHead>
                      <TableHead className="w-[100px]">Sender ID</TableHead>
                      <TableHead className="w-[120px]">Recipient</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[60px] text-center">Parts</TableHead>
                      <TableHead className="w-[90px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No messages found
                        </TableCell>
                      </TableRow>
                    ) : (
                      messages.map((msg) => {
                        const date = msg.sent_at ? new Date(msg.sent_at) : null;
                        return (
                          <TableRow key={msg.id}>
                            <TableCell className="text-xs">
                              {date && isValid(date) ? (
                                <div>
                                  <div className="font-medium">{format(date, 'MMM dd, yyyy')}</div>
                                  <div className="text-muted-foreground">{format(date, 'HH:mm')}</div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">{msg.sender_alias}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{msg.phone_number}</TableCell>
                            <TableCell>
                              <p className="text-xs truncate max-w-[300px]" title={msg.message}>{msg.message}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={msg.number_of_parts > 1 ? 'secondary' : 'outline'} className="text-xs">
                                {msg.number_of_parts}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(msg.status)} className="text-xs">
                                {msg.status?.toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center py-4 px-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore} 
                    disabled={loadingMore}
                    className="w-full max-w-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More (${totalCount - messages.length} remaining)`
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
