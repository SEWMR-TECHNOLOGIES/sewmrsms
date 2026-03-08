import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminSenderIds() {
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/sender-ids?page=${page}&limit=20`, { credentials: "include" });
      const data = await res.json();
      setSenderIds(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const updateStatus = async (uuid: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/sender-ids/${uuid}/status`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) { toast({ title: "Status updated" }); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Sender IDs</h2>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senderIds.map((s) => (
                  <TableRow key={s.uuid}>
                    <TableCell className="font-medium">{s.alias}</TableCell>
                    <TableCell>{s.user?.email}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Select value={s.status} onValueChange={(v) => updateStatus(s.uuid, v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {senderIds.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No sender IDs</TableCell></TableRow>}
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
