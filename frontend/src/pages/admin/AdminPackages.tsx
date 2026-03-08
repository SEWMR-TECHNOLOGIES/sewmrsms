import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil } from "lucide-react";

const API_BASE = "https://api.sewmrsms.co.tz/api/v1";

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPkg, setEditPkg] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", price_per_sms: "", start_sms_count: "", best_for: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/packages`, { credentials: "include" });
      const data = await res.json();
      setPackages(data.data || []);
    } catch { toast({ title: "Failed to load", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/packages/${editPkg.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, price_per_sms: parseFloat(formData.price_per_sms), start_sms_count: parseInt(formData.start_sms_count), best_for: formData.best_for })
      });
      if (res.ok) { toast({ title: "Package updated" }); setEditPkg(null); fetchData(); }
      else { const d = await res.json(); toast({ title: d.detail, variant: "destructive" }); }
    } catch { toast({ title: "Error", variant: "destructive" }); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">SMS Packages</h2>
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price/SMS (TZS)</TableHead>
                  <TableHead>Min SMS</TableHead>
                  <TableHead>Best For</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.price_per_sms}</TableCell>
                    <TableCell>{p.start_sms_count?.toLocaleString()}</TableCell>
                    <TableCell>{p.best_for}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditPkg(p); setFormData({ name: p.name, price_per_sms: String(p.price_per_sms), start_sms_count: String(p.start_sms_count), best_for: p.best_for || "" }); }}>
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
      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Package — {editPkg?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Price per SMS (TZS)</label><Input type="number" value={formData.price_per_sms} onChange={(e) => setFormData({ ...formData, price_per_sms: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Min SMS Count</label><Input type="number" value={formData.start_sms_count} onChange={(e) => setFormData({ ...formData, start_sms_count: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Best For</label><Input value={formData.best_for} onChange={(e) => setFormData({ ...formData, best_for: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditPkg(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
