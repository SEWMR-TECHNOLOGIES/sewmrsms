import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/components/admin/AdminGuard";
import { Loader2, Plus } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminAccounts() {
  useMeta({ title: "Admin - Accounts", description: "Manage admin accounts and access control." });
  const { admin } = useAdmin();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ email: "", username: "", password: "", first_name: "", last_name: "", role: "admin" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/auth/create-admin`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) { toast({ title: "Admin created", description: data.data?.email }); setShowCreate(false); setFormData({ email: "", username: "", password: "", first_name: "", last_name: "", role: "admin" }); }
      else toast({ title: data.detail || "Failed", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Accounts</h2>
        {admin?.role === "superadmin" && (
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Create Admin</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Current admin: <strong>{admin?.email}</strong> ({admin?.role})</p>
            <p className="text-sm mt-2">Only superadmins can create new admin accounts.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Admin Account</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Username</Label><Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting || !formData.email || !formData.username || !formData.password}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
