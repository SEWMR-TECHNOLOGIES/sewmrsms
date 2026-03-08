import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [adjustDialog, setAdjustDialog] = useState<any>(null);
  const [addSms, setAddSms] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions?${params}`, { credentials: "include" });
      const data = await res.json();
      setSubs(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleAdjust = async () => {
    setSubmitting(true);
    try {
      const body: any = {};
      if (addSms) body.add_sms = parseInt(addSms);
      if (newStatus) body.status = newStatus;
      const res = await fetch(`${API_BASE}/admin/subscriptions/${adjustDialog.uuid}/adjust`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) { toast({ title: "Subscription adjusted" }); setAdjustDialog(null); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total SMS</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.uuid}>
                    <TableCell>{s.user?.email}</TableCell>
                    <TableCell>{s.total_sms?.toLocaleString()}</TableCell>
                    <TableCell>{s.used_sms?.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{s.remaining_sms?.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell>{new Date(s.subscribed_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => { setAdjustDialog(s); setAddSms(""); setNewStatus(s.status); }}>Adjust</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {subs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No subscriptions</TableCell></TableRow>}
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
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Subscription - {adjustDialog?.user?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Add SMS Credits</label>
              <Input type="number" value={addSms} onChange={(e) => setAddSms(e.target.value)} placeholder="e.g. 1000" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustDialog(null)}>Cancel</Button>
              <Button onClick={handleAdjust} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
