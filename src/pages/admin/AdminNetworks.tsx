import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useMeta } from "@/hooks/useMeta";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminNetworks() {
  useMeta({ title: "Admin - Networks", description: "Manage mobile network operators for sender ID routing." });
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; network?: any } | null>(null);
  const [name, setName] = useState("");
  const [colorCode, setColorCode] = useState("#000000");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/networks`, { credentials: "include" });
      const data = await res.json();
      setNetworks(data.data || []);
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSubmitting(true);
    const isEdit = dialog?.mode === "edit";
    try {
      const url = isEdit ? `${API_BASE}/admin/networks/${dialog.network.id}` : `${API_BASE}/admin/networks`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color_code: colorCode })
      });
      if (res.ok) { toast({ title: isEdit ? "Updated" : "Created" }); setDialog(null); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this network?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/networks/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { toast({ title: "Deleted" }); fetchData(); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Networks</h2>
        <Button onClick={() => { setDialog({ mode: "create" }); setName(""); setColorCode("#000000"); }}><Plus className="h-4 w-4 mr-1" />Add Network</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell><div className="w-6 h-6 rounded-full border" style={{ backgroundColor: n.color_code }} /></TableCell>
                    <TableCell className="font-medium">{n.name}</TableCell>
                    <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setDialog({ mode: "edit", network: n }); setName(n.name); setColorCode(n.color_code); }}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(n.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog?.mode === "edit" ? "Edit" : "Add"} Network</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Color</label><div className="flex gap-2 items-center"><input type="color" value={colorCode} onChange={(e) => setColorCode(e.target.value)} className="h-10 w-10 rounded cursor-pointer" /><Input value={colorCode} onChange={(e) => setColorCode(e.target.value)} className="w-28" /></div></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={submitting || !name}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
