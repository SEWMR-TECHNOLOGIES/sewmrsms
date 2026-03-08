import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminUsers() {
  useMeta({ title: "Admin - Users", description: "Manage all registered users on SEWMR SMS." });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    try {
      const res = await fetch(`${API_BASE}/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch { toast({ title: "Failed to load users", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const viewUser = async (uuid: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${uuid}`, { credentials: "include" });
      const data = await res.json();
      setSelectedUser(data.data);
    } catch { toast({ title: "Failed to load user details", variant: "destructive" }); }
    setDetailLoading(false);
  };

  const deleteUser = async (uuid: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${uuid}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (res.ok) { toast({ title: "User deleted" }); fetchUsers(); }
      else toast({ title: data.detail || "Failed", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-64" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchUsers())} />
          </div>
          <Button variant="outline" onClick={() => { setPage(1); fetchUsers(); }}>Search</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.uuid}>
                    <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.phone || "N/A"}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => viewUser(u.uuid)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteUser(u.uuid)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {detailLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <strong>{selectedUser.first_name} {selectedUser.last_name}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{selectedUser.email}</strong></div>
                <div><span className="text-muted-foreground">Username:</span> <strong>{selectedUser.username}</strong></div>
                <div><span className="text-muted-foreground">Phone:</span> <strong>{selectedUser.phone || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">Messages:</span> <strong>{selectedUser.total_messages}</strong></div>
                <div><span className="text-muted-foreground">Contacts:</span> <strong>{selectedUser.total_contacts}</strong></div>
              </div>
              {selectedUser.subscription && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Subscription</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total SMS: <strong>{selectedUser.subscription.total_sms}</strong></div>
                    <div>Used: <strong>{selectedUser.subscription.used_sms}</strong></div>
                    <div>Remaining: <strong>{selectedUser.subscription.remaining_sms}</strong></div>
                    <div>Status: <Badge variant="outline">{selectedUser.subscription.status}</Badge></div>
                  </div>
                </div>
              )}
              {selectedUser.sender_ids?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Sender IDs</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.sender_ids.map((s: any) => (
                      <Badge key={s.uuid} variant={s.status === "active" ? "default" : "secondary"}>{s.alias}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
