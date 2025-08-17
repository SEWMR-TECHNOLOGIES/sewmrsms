import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Loader } from "@/components/ui/loader";
import { Users, Plus, Trash2, Edit, Search } from "lucide-react";
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

interface ContactGroup {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

const BASE_URL = "https://api.sewmrsms.co.tz/api/v1/contacts";

export default function ContactGroups() {
  const { toast } = useToast();

  // data
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // create
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // edit
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [updating, setUpdating] = useState(false);

  // delete
  const [deletingGroup, setDeletingGroup] = useState<ContactGroup | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  // search & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // fetch groups
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/groups`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch groups");
      setGroups(json.data.map((g: any) => ({ ...g, contact_count: Number(g.contact_count || 0) })));
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load groups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // create
  const createGroup = async () => {
    if (!newGroupName.trim()) return toast({ title: "Error", description: "Group name required", variant: "destructive" });
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create group");

      setGroups(prev => [{ ...json.data, contact_count: Number(json.data.contact_count || 0) }, ...prev]);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({ title: "Success", description: json.message || "Group created", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create group", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // edit
  const editGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/edit/${editingGroup.uuid}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingGroup.name, description: editingGroup.description }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update group");

      setGroups(prev => prev.map(g => (g.uuid === editingGroup.uuid ? { ...json.data, contact_count: Number(json.data.contact_count || 0) } : g)));
      setEditingGroup(null);
      toast({ title: "Success", description: json.message || "Group updated", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update group", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // delete
  const deleteGroup = async (uuid: string) => {
    if (!uuid) return;
    setDeletingUuid(uuid);
    try {
      const res = await fetch(`${BASE_URL}/groups/${uuid}/remove`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete group");
      setGroups(prev => prev.filter(g => g.uuid !== uuid));
      setDeletingGroup(null);
      toast({ title: "Success", description: json.message || "Group deleted", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete group", variant: "destructive" });
    } finally {
      setDeletingUuid(null);
    }
  };

  // filtered + paginated
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const totalPages = Math.ceil(filteredGroups.length / perPage);
  const paginatedGroups = filteredGroups.slice((page - 1) * perPage, page * perPage);

  // columns
  const columns: ColumnDef<ContactGroup>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description", cell: ({ row }) => row.getValue("description") || "No description" },
    {
      accessorKey: "contact_count",
      header: "Contacts",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue("contact_count") === 0
            ? "No contacts"
            : row.getValue("contact_count") === 1
            ? "1 contact"
            : `${row.getValue("contact_count")} contacts`}
        </Badge>
      ),
    },
    { accessorKey: "created_at", header: "Created", cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM dd, yyyy") },
    { accessorKey: "updated_at", header: "Updated", cell: ({ row }) => format(new Date(row.getValue("updated_at")), "MMM dd, yyyy") },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const group = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingGroup(group)} disabled={updating}>
              <Edit className="mr-1 h-3 w-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeletingGroup(group)} disabled={!!deletingUuid}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact Groups</h1>
        <p className="text-muted-foreground">Organize your contacts into groups for targeted messaging.</p>
      </div>

      {/* Create Group */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Create New Group
          </CardTitle>
          <CardDescription>Organize your contacts into a new group</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="flex-1" />
          <Input placeholder="Description (optional)" value={newGroupDescription} onChange={e => setNewGroupDescription(e.target.value)} className="flex-1" />
          <Button onClick={createGroup} disabled={creating || !newGroupName.trim()} className="flex items-center gap-2">
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </CardContent>
      </Card>

      {/* Search + pagination info */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by group name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Page {page} of {totalPages || 1}
        </div>
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={paginatedGroups} />
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Edit Modal */}
      {editingGroup && (
        <AlertDialog
          open={!!editingGroup}
          onOpenChange={open => { if (!open && !updating) setEditingGroup(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Group</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4 flex gap-2">
              <Input value={editingGroup.name} onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })} className="flex-1" />
              <Input value={editingGroup.description || ""} onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })} className="flex-1" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !updating && setEditingGroup(null)} disabled={updating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={editGroup} disabled={updating}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Modal */}
      {deletingGroup && (
        <AlertDialog
          open={!!deletingGroup}
          onOpenChange={open => { if (!open && !deletingUuid) setDeletingGroup(null); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete "{deletingGroup.name}"? This will remove {deletingGroup.contact_count} contacts.
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !deletingUuid && setDeletingGroup(null)} disabled={!!deletingUuid}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingGroup && deleteGroup(deletingGroup.uuid)} className="bg-destructive text-destructive-foreground" disabled={!!deletingUuid}>Delete Group</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.reduce((sum, g) => sum + g.contact_count, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm font-medium">Largest Group</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.length > 0 ? Math.max(...groups.map(g => g.contact_count)) : 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
