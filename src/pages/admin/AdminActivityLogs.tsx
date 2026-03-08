import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminActivityLogs() {
  useMeta({ title: "Admin - Activity Logs", description: "Monitor admin actions and system activity logs." });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [actionFilter, setActionFilter] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    try {
      const res = await fetch(`${API_BASE}/admin/activity-logs?${params}`, { credentials: "include" });
      const data = await res.json();
      setLogs(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const actionColor = (a: string) => {
    if (a.includes("approve")) return "default";
    if (a.includes("reject") || a.includes("delete")) return "destructive";
    if (a.includes("login")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
        <div className="flex gap-2">
          <Input className="w-48" placeholder="Filter by action..." value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
          <Button variant="outline" onClick={() => { setPage(1); fetchData(); }}>Filter</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.uuid}>
                    <TableCell>{l.admin?.username}</TableCell>
                    <TableCell><Badge variant={actionColor(l.action) as any}>{l.action}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{l.entity_type} #{l.entity_id}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{l.details ? JSON.stringify(l.details) : "N/A"}</TableCell>
                    <TableCell className="text-xs">{l.ip_address || "N/A"}</TableCell>
                    <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No logs</TableCell></TableRow>}
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
