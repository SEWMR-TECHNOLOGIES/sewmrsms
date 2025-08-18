import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Loader } from "@/components/ui/loader";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import TemplatePreview from "@/components/ui/template-preview";

interface TemplateColumn {
  id: string;
  uuid: string;
  name: string;
  position: number;
  is_phone_column: boolean;
  created_at: string;
  updated_at: string;
}

interface SmsTemplate {
  id: string;
  uuid: string;
  name: string;
  sample_message: string;
  column_count: number;
  created_at: string;
  updated_at: string;
  columns: TemplateColumn[];
}

const BASE_URL = "https://api.sewmrsms.co.tz/api/v1/templates";

export default function TemplatesPage() {
  const { toast } = useToast();

  // data
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // create
  const [newName, setNewName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newColumnCount, setNewColumnCount] = useState("");
  const [creating, setCreating] = useState(false);

  // edit
  const [editingTemplate, setEditingTemplate] = useState<{
    uuid: string;
    name: string;
    sample_message: string;
    column_count: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  // delete
  const [deletingTemplate, setDeletingTemplate] = useState<SmsTemplate | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  // add column modal
  const [addingColumnTemplate, setAddingColumnTemplate] = useState<SmsTemplate | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnPosition, setNewColumnPosition] = useState<string>("");
  const [newColumnPhone, setNewColumnPhone] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);

  // ✅ preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<SmsTemplate | null>(null);

  // fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch templates");
      setTemplates(json.data);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // create template
  const createTemplate = async () => {
    if (!newName.trim() || !newMessage.trim() || !newColumnCount.trim()) {
      return toast({ title: "Error", description: "All fields required", variant: "destructive" });
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          sample_message: newMessage,
          column_count: parseInt(newColumnCount, 10),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create template");

      setTemplates((prev) => [json.data, ...prev]);

      setNewName("");
      setNewMessage("");
      setNewColumnCount("");

      toast({ title: "Success", description: json.message || "Template created", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create template", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // edit template
  const editTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name.trim() || !editingTemplate.sample_message.trim() || !editingTemplate.column_count.trim()) return;
    const colCount = parseInt(editingTemplate.column_count, 10);
    if (isNaN(colCount) || colCount < 1) return toast({ title: "Error", description: "Column count must be a positive number", variant: "destructive" });

    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/edit/${editingTemplate.uuid}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTemplate.name,
          sample_message: editingTemplate.sample_message,
          column_count: colCount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update template");

      setTemplates((prev) => prev.map((t) => (t.uuid === editingTemplate.uuid ? json.data : t)));
      setEditingTemplate(null);
      toast({ title: "Success", description: json.message || "Template updated", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update template", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // delete template
  const deleteTemplate = async (uuid: string) => {
    if (!uuid) return;
    setDeletingUuid(uuid);
    try {
      const res = await fetch(`${BASE_URL}/${uuid}`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete template");
      setTemplates((prev) => prev.filter((t) => t.uuid !== uuid));
      setDeletingTemplate(null);
      toast({ title: "Success", description: json.message || "Template deleted", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete template", variant: "destructive" });
    } finally {
      setDeletingUuid(null);
    }
  };

  // add column
  const addColumn = async () => {
    if (!addingColumnTemplate || !newColumnName.trim() || !newColumnPosition.trim()) return;
    setAddingColumn(true);
    try {
      const res = await fetch(`${BASE_URL}/${addingColumnTemplate.uuid}/columns/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColumnName.trim(),
          position: parseInt(newColumnPosition, 10),
          is_phone_column: newColumnPhone,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to add column");

      setTemplates((prev) =>
        prev.map((t) =>
          t.uuid === addingColumnTemplate.uuid ? { ...t, columns: [...t.columns, json.data] } : t
        )
      );

      toast({ title: "Success", description: json.message || "Column added", variant: "success" });
      setAddingColumnTemplate(null);
      setNewColumnName("");
      setNewColumnPosition("");
      setNewColumnPhone(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to add column", variant: "destructive" });
    } finally {
      setAddingColumn(false);
    }
  };

  // columns
  const columns: ColumnDef<SmsTemplate>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "sample_message", header: "Message" },
    { accessorKey: "column_count", header: "Columns" },
    { accessorKey: "created_at", header: "Created", cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM dd, yyyy") },
    { accessorKey: "updated_at", header: "Updated", cell: ({ row }) => format(new Date(row.getValue("updated_at")), "MMM dd, yyyy") },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEditingTemplate({
                  uuid: template.uuid,
                  name: template.name,
                  sample_message: template.sample_message,
                  column_count: template.column_count.toString(),
                })
              }
              disabled={updating}
            >
              <Edit className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeletingTemplate(template)} disabled={!!deletingUuid}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddingColumnTemplate(template)}>
              <Plus className="mr-1 h-3 w-3" /> Add Column
            </Button>
            {/* ✅ New Preview Button */}
            {template.columns.length === template.column_count && (
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(template)}>
                <Eye className="mr-1 h-3 w-3" /> Preview
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SMS Templates</h1>
        <p className="text-muted-foreground">Manage and organize your SMS templates.</p>
      </div>

      {/* Create Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Create New Template
          </CardTitle>
          <CardDescription>Define a new SMS template with columns</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Template Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
          <Input placeholder="Sample Message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1" />
          <Input placeholder="Number of Columns" value={newColumnCount} onChange={(e) => setNewColumnCount(e.target.value)} className="flex-1" />
          <Button
            onClick={createTemplate}
            disabled={creating || !newName.trim() || !newMessage.trim() || !newColumnCount.trim()}
            className="flex items-center gap-2"
          >
            {creating ? "Creating..." : "Create Template"}
          </Button>
        </CardContent>
      </Card>

      {/* DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>A list of all your SMS templates and their columns.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={templates} searchPlaceholder="Search templates..." />
        </CardContent>
      </Card>

      {/* ✅ Preview Modal */}
      {previewTemplate && (
        <AlertDialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Template Preview - {previewTemplate.name}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4">
              <TemplatePreview template={previewTemplate} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPreviewTemplate(null)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Add Column Modal */}
      {addingColumnTemplate && (
        <AlertDialog open={!!addingColumnTemplate} onOpenChange={(open) => { if (!open && !addingColumn) setAddingColumnTemplate(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add Column to {addingColumnTemplate.name}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4 flex flex-col gap-3">
              <Input placeholder="Column Name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} />

              <SearchableSelect
                options={Array.from({ length: addingColumnTemplate.column_count }, (_, i) => ({ value: (i+1).toString(), label: `Column ${i+1}` }))}
                value={newColumnPosition}
                onValueChange={setNewColumnPosition}
                placeholder="Select column position"
              />

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Is this the phone column?</label>
                <ToggleSwitch checked={newColumnPhone} onChange={setNewColumnPhone} label="" />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !addingColumn && setAddingColumnTemplate(null)} disabled={addingColumn}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={addColumn} disabled={addingColumn || !newColumnName.trim() || !newColumnPosition}>
                {addingColumn ? "Adding..." : "Add Column to Template"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Edit Modal */}
      {editingTemplate && (
        <AlertDialog open={!!editingTemplate} onOpenChange={open => { if (!open && !updating) setEditingTemplate(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Template</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4 flex flex-col gap-2">
              <Input
                value={editingTemplate.name}
                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                placeholder="Template Name"
              />
              <Input
                value={editingTemplate.sample_message}
                onChange={e => setEditingTemplate({ ...editingTemplate, sample_message: e.target.value })}
                placeholder="Sample Message"
              />
              <Input
                value={editingTemplate.column_count}
                onChange={e => setEditingTemplate({ ...editingTemplate, column_count: e.target.value })}
                placeholder="Number of Columns"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !updating && setEditingTemplate(null)} disabled={updating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={editTemplate}
                disabled={updating || !editingTemplate.name.trim() || !editingTemplate.sample_message.trim() || !editingTemplate.column_count.trim()}
              >
                {updating ? "Saving..." : "Save Changes"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Modal */}
      {deletingTemplate && (
        <AlertDialog open={!!deletingTemplate} onOpenChange={open => { if (!open && !deletingUuid) setDeletingTemplate(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete "{deletingTemplate.name}"? This action cannot be undone.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !deletingUuid && setDeletingTemplate(null)} disabled={!!deletingUuid}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingTemplate && deleteTemplate(deletingTemplate.uuid)}
                className="bg-destructive text-destructive-foreground"
                disabled={!!deletingUuid}
              >
                Delete Template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
