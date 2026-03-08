import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminSenderRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionDialog, setActionDialog] = useState<{ request: any; action: string } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    try {
      const res = await fetch(`${API_BASE}/admin/sender-id-requests?${params}`, { credentials: "include" });
      const data = await res.json();
      setRequests(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [page, statusFilter]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setSubmitting(true);
    const { request: req, action } = actionDialog;
    try {
      const url = `${API_BASE}/admin/sender-id-requests/${req.uuid}/${action}`;
      const res = await fetch(url, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks })
      });
      const data = await res.json();
      if (res.ok) { toast({ title: data.message }); setActionDialog(null); setRemarks(""); fetchRequests(); }
      else toast({ title: data.detail || "Failed", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "in_review": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sender ID Requests</h2>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.uuid}>
                    <TableCell className="font-medium">{r.sender_alias}</TableCell>
                    <TableCell>{r.user?.email}</TableCell>
                    <TableCell>{r.company_name || "N/A"}</TableCell>
                    <TableCell>{r.is_student_request ? <Badge variant="secondary">Student</Badge> : "Business"}</TableCell>
                    <TableCell><Badge variant={statusColor(r.status) as any}>{r.status}</Badge></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setActionDialog({ request: r, action: "set-in-review" })}>
                            <Clock className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActionDialog({ request: r, action: "approve" })}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActionDialog({ request: r, action: "reject" })}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {r.status === "in_review" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setActionDialog({ request: r, action: "approve" })}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActionDialog({ request: r, action: "reject" })}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No requests found</TableCell></TableRow>
                )}
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

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setRemarks(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{actionDialog?.action?.replace(/-/g, " ")} - {actionDialog?.request?.sender_alias}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog?.action !== "set-in-review" && (
              <div>
                <label className="text-sm font-medium">Remarks</label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={actionDialog?.action === "reject" ? "Reason for rejection (required)" : "Optional remarks"} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
              <Button onClick={handleAction} disabled={submitting || (actionDialog?.action === "reject" && !remarks)}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
