import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader } from "@/components/ui/loader";
import { Users, Plus, Trash2, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // table loading only
  const [loading, setLoading] = useState(true);

  // create form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // edit modal
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [updating, setUpdating] = useState(false);

  // delete dialog
  const [deletingGroup, setDeletingGroup] = useState<ContactGroup | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  // small spinner for row-level refreshes
  const [refreshing, setRefreshing] = useState(false);

  // search + pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // fetch groups (table loader only)
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/groups`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch groups");
      }
      // ensure numeric contact_count
      const normalized: ContactGroup[] = json.data.map((g: any) => ({
        ...g,
        contact_count: Number(g.contact_count || 0),
      }));
      setGroups(normalized);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load contact groups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // create group
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "Error", description: "Please enter a group name", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast({ title: "Error", description: json.message || "Failed to create group", variant: "destructive" });
        return;
      }

      const newItem = { ...json.data, contact_count: Number(json.data.contact_count || 0) } as ContactGroup;
      setGroups(prev => [newItem, ...prev]);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({ title: "Success", description: json.message || "Contact group created", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to create group", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // edit group
  const editGroup = async () => {
    if (!editingGroup) return;
    if (!editingGroup.name.trim()) {
      toast({ title: "Error", description: "Please enter a group name", variant: "destructive" });
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/edit/${editingGroup.uuid}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingGroup.name, description: editingGroup.description }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: "Error", description: json.message || "Failed to update group", variant: "destructive" });
        return;
      }

      setGroups(prev => prev.map(g => (g.uuid === editingGroup.uuid ? { ...json.data, contact_count: Number(json.data.contact_count || 0) } : g)));
      // close modal only after success
      setEditingGroup(null);
      toast({ title: "Success", description: json.message || "Contact group updated", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update contact group", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  // delete group
  const deleteGroup = async (uuid: string) => {
    if (!uuid) return;
    setDeletingUuid(uuid);
    setRefreshing(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/${uuid}/remove`, { method: "DELETE", credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: "Error", description: json.message || "Failed to delete group", variant: "destructive" });
        return;
      }

      setGroups(prev => prev.filter(g => g.uuid !== uuid));
      setDeletingGroup(null); // close dialog after success
      toast({ title: "Success", description: json.message || "Contact group deleted", variant: "success" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to delete contact group", variant: "destructive" });
    } finally {
      setDeletingUuid(null);
      setRefreshing(false);
    }
  };

  // search and pagination computations
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const totalPages = Math.ceil(filteredGroups.length / perPage);
  const paginatedGroups = filteredGroups.slice((page - 1) * perPage, page * perPage);

  // small helpers for stats using numeric coercion
  const totalContacts = groups.reduce((sum, g) => sum + Number(g.contact_count || 0), 0);
  const largestGroup = groups.length > 0 ? Math.max(...groups.map(g => Number(g.contact_count || 0))) : 0;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact Groups</h1>
        <p className="text-muted-foreground">Organize your contacts into groups for targeted messaging.</p>
      </div>

      {/* Create Group inline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Group
          </CardTitle>
          <CardDescription>Organize your contacts into a new group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="Group Name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
            <Input
              className="flex-1"
              placeholder="Description (optional)"
              value={newGroupDescription}
              onChange={e => setNewGroupDescription(e.target.value)}
            />
            <Button onClick={createGroup} disabled={creating || !newGroupName.trim()} className="flex items-center gap-2">
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>Create Group</>
              )}
            </Button>
          </div>
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

      {/* Table card: loader overlays on table only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Contact Groups ({groups.length})
          </CardTitle>
          <CardDescription>Manage your contact groups</CardDescription>
        </CardHeader>

        <CardContent className="relative">
          {/* loader overlay on table only */}
          {loading && <Loader overlay />}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.map(group => (
                <TableRow key={group.uuid}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.description || "No description"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {group.contact_count === 0 ? "No contacts" : group.contact_count === 1 ? "1 contact" : `${group.contact_count} contacts`}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(group.created_at)}</TableCell>
                  <TableCell>{formatDate(group.updated_at)}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                      className="flex items-center gap-2"
                      disabled={updating}
                    >
                      {editingGroup?.uuid === group.uuid && updating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Edit className="mr-1 h-3 w-3" />Edit
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingGroup(group)}
                      className="flex items-center gap-2"
                      disabled={!!deletingUuid}
                    >
                      {deletingUuid === group.uuid ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3 w-3" />Delete
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* empty state for filtered results */}
              {paginatedGroups.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {filteredGroups.length === 0 ? "No groups found" : "No items on this page"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Edit modal - prevents closing while updating */}
      {editingGroup && (
        <AlertDialog
          open={!!editingGroup}
          onOpenChange={(open) => {
            if (!open && updating) return; // prevent close while updating
            if (!open) setEditingGroup(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Contact Group</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="p-4">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                />
                <Input
                  className="flex-1"
                  value={editingGroup.description || ""}
                  onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !updating && setEditingGroup(null)} disabled={updating}>
                {updating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Cancelling...
                  </div>
                ) : (
                  "Cancel"
                )}
              </AlertDialogCancel>

              <AlertDialogAction onClick={editGroup} disabled={updating}>
                {updating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Controlled Delete Dialog */}
      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => {
          if (!open && deletingUuid) return;
          if (!open) setDeletingGroup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Group</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              {deletingGroup
                ? `Are you sure you want to delete "${deletingGroup.name}"? This will remove ${deletingGroup.contact_count} contacts. This action cannot be undone.`
                : "Are you sure?"}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => !deletingUuid && setDeletingGroup(null)} disabled={!!deletingUuid}>
              {deletingUuid ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Cancelling...
                </div>
              ) : (
                "Cancel"
              )}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => deletingGroup && deleteGroup(deletingGroup.uuid)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingUuid}
            >
              {deletingUuid ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Deleting...
                </div>
              ) : (
                "Delete Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length > 0 ? groups.length : "No groups yet"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalContacts > 0 ? totalContacts.toLocaleString() : "No contacts yet"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Group</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{largestGroup > 0 ? largestGroup.toLocaleString() : "No contacts in groups"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
