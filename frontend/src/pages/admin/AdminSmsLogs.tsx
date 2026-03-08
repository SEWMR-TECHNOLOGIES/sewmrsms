import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminSmsLogs() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [senderAlias, setSenderAlias] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (senderAlias) params.set("sender_alias", senderAlias);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    try {
      const res = await fetch(`${API_BASE}/admin/sms-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      setMessages(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">SMS Logs</h2>
      <div className="flex flex-wrap gap-2">
        <Input className="w-48" placeholder="Sender alias..." value={senderAlias} onChange={(e) => setSenderAlias(e.target.value)} />
        <Input type="date" className="w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" className="w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button variant="outline" onClick={() => { setPage(1); fetchData(); }}><Search className="h-4 w-4 mr-1" />Filter</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Parts</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.uuid}>
                    <TableCell className="font-medium">{m.sender_alias}</TableCell>
                    <TableCell>{m.phone_number}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{m.message}</TableCell>
                    <TableCell>{m.number_of_parts}</TableCell>
                    <TableCell>{m.user?.email}</TableCell>
                    <TableCell>{new Date(m.sent_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {messages.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No messages</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
