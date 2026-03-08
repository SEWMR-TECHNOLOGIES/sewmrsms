import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminSystemSettings() {
  useMeta({ title: "Admin - System Settings", description: "Configure system-wide settings for the SEWMR SMS platform." });
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSetting, setEditSetting] = useState<any>(null);
  const [newValue, setNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, { credentials: "include" });
      const data = await res.json();
      setSettings(data.data || []);
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/${editSetting.key}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue })
      });
      if (res.ok) { toast({ title: "Setting updated" }); setEditSetting(null); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">System Settings</h2>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((s) => (
                  <TableRow key={s.key}>
                    <TableCell className="font-mono text-sm">{s.key}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{s.value}</TableCell>
                    <TableCell className="text-muted-foreground">{s.description}</TableCell>
                    <TableCell>{new Date(s.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditSetting(s); setNewValue(s.value); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!editSetting} onOpenChange={() => setEditSetting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Setting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Key</label><Input value={editSetting?.key || ""} disabled /></div>
            <div><label className="text-sm font-medium">Description</label><p className="text-sm text-muted-foreground">{editSetting?.description}</p></div>
            <div><label className="text-sm font-medium">Value</label><Input value={newValue} onChange={(e) => setNewValue(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditSetting(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
