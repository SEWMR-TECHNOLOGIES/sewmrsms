import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, ChevronRight, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminDocuments() {
  useMeta({ title: "Admin - Documents", description: "Review uploaded sender ID agreement documents." });
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    // Fetch all sender requests and filter by document status client-side
    try {
      const res = await fetch(`${API_BASE}/admin/sender-id-requests?${params}`, { credentials: "include" });
      const data = await res.json();
      const all = data.data || [];
      
      let filtered = all;
      if (filter === "submitted") {
        filtered = all.filter((r: any) => r.document_path);
      } else if (filter === "missing") {
        filtered = all.filter((r: any) => !r.document_path);
      }

      setRequests(filtered);
      setPagination(data.pagination || {});
    } catch {
      toast({ title: "Failed to load documents", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [page, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Submitted Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage sender ID agreement documents uploaded by users</p>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="submitted">Document Submitted</SelectItem>
            <SelectItem value="missing">Document Missing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender Alias</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.uuid}>
                    <TableCell className="font-medium">{r.sender_alias}</TableCell>
                    <TableCell className="text-muted-foreground">{r.user?.email || "N/A"}</TableCell>
                    <TableCell>{r.company_name || "N/A"}</TableCell>
                    <TableCell>
                      {r.is_student_request 
                        ? <Badge variant="secondary" className="text-xs">Student</Badge> 
                        : <Badge variant="outline" className="text-xs">Business</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        r.status === "approved" ? "default" :
                        r.status === "rejected" ? "destructive" :
                        r.status === "in_review" ? "secondary" : "outline"
                      }>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.document_path ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.document_path ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(r.document_path, "_blank")}
                          className="gap-1.5"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No document</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
