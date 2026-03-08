import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminPropagations() {
  useMeta({ title: "Admin - Propagations", description: "Track sender ID propagation status across networks." });
  const [propagations, setPropagations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    try {
      const res = await fetch(`${API_BASE}/admin/propagations?${params}`, { credentials: "include" });
      const data = await res.json();
      setPropagations(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/propagations/${editDialog.uuid}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, details: editDetails })
      });
      if (res.ok) { toast({ title: "Updated" }); setEditDialog(null); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  const statusColor = (s: string) => s === "propagated" ? "default" : s === "failed" ? "destructive" : "outline";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Propagation Status</h2>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="propagated">Propagated</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender Alias</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propagations.map((p) => (
                  <TableRow key={p.uuid}>
                    <TableCell className="font-medium">{p.request?.sender_alias}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.network?.color_code }} />
                        {p.network?.name}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={statusColor(p.status) as any}>{p.status}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.details}</TableCell>
                    <TableCell>{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditDialog(p); setEditStatus(p.status); setEditDetails(p.details); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {propagations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No propagations found</TableCell></TableRow>}
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

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Propagation - {editDialog?.request?.sender_alias} / {editDialog?.network?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="propagated">Propagated</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Details</label>
              <Textarea value={editDetails} onChange={(e) => setEditDetails(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
