import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, Filter, Loader2, FileBarChart, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useMeta } from "@/hooks/useMeta";

const STATUS_OPTIONS = ["DELIVERED", "UNDELIVERABLE", "EXPIRED", "FAILED", "REJECTED", "DND", "PENDING", "ACKNOWLEDGED"];

export default function DeliveryReports() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("start_date", startOfDay(startDate).toISOString());
      if (endDate) params.set("end_date", endOfDay(endDate).toISOString());

      const res = await fetch(`https://api.sewmrsms.co.tz/api/v1/sms/history?${params}`, { credentials: "include" });
      const json = await res.json();
      setMessages(Array.isArray(json.data) ? json.data : []);
    } catch {
      toast({ title: "Error", description: "Failed to load delivery reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, startDate, endDate, toast]);

  useEffect(() => { fetchData(); }, []);

  const stats = {
    delivered: messages.filter(m => m.status?.toUpperCase() === "DELIVERED").length,
    failed: messages.filter(m => ["FAILED", "REJECTED", "DND", "UNDELIVERABLE"].includes(m.status?.toUpperCase())).length,
    pending: messages.filter(m => ["PENDING", "ACKNOWLEDGED"].includes(m.status?.toUpperCase())).length,
    total: messages.length,
  };

  const deliveryRate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : "0";

  const exportCSV = () => {
    const headers = ["Date", "Sender", "Recipient", "Status", "Parts", "Message ID"];
    const rows = messages.map(m => [
      m.sent_at ? format(new Date(m.sent_at), "yyyy-MM-dd HH:mm") : "",
      m.sender_alias, m.phone_number, m.status, m.number_of_parts, m.message_id ?? ""
    ].map(v => `"${v}"`).join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivery_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useMeta({ title: "Delivery Reports", description: "Track SMS delivery statuses and monitor your messaging performance." });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Reports</h1>
          <p className="text-muted-foreground">Track delivery status of your sent messages</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={messages.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{stats.delivered}</p><p className="text-xs text-muted-foreground">Delivered</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{stats.failed}</p><p className="text-xs text-muted-foreground">Failed</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><Clock className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></div></CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3"><FileBarChart className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{deliveryRate}%</p><p className="text-xs text-muted-foreground">Delivery Rate</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[160px] justify-start", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />{startDate ? format(startDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[160px] justify-start", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />{endDate ? format(endDate, "PP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1 w-[160px]">
              <Label className="text-xs">Status</Label>
              <SearchableSelect options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} value={statusFilter} onValueChange={setStatusFilter} placeholder="All" searchPlaceholder="Search..." />
            </div>
            <Button size="sm" onClick={fetchData}><Filter className="mr-1.5 h-3.5 w-3.5" /> Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Report Data</CardTitle><CardDescription>Showing {messages.length} messages</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Sender</TableHead><TableHead>Recipient</TableHead><TableHead>Status</TableHead><TableHead>Parts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No messages found</TableCell></TableRow>
                ) : messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{m.sent_at ? format(new Date(m.sent_at), "MMM dd, HH:mm") : "-"}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{m.sender_alias}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{m.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant={m.status?.toUpperCase() === "DELIVERED" ? "default" : ["FAILED", "REJECTED", "DND"].includes(m.status?.toUpperCase()) ? "destructive" : "secondary"}>
                        {m.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.number_of_parts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
