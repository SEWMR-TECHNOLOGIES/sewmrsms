import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader } from '@/components/ui/loader';
import { Users, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactGroup {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

const BASE_URL = 'https://api.sewmrsms.co.tz/api/v1/contacts';

export default function ContactGroups() {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Button/loading states
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Edit modal state
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [updating, setUpdating] = useState(false);

  // Delete dialog state (controlled single dialog)
  const [deletingGroup, setDeletingGroup] = useState<ContactGroup | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  // Row-level refresh indicator (general)
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();

  // Fetch all contact groups
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/groups`, { credentials: 'include' });
      const json = await res.json();
      if (res.ok && json.success) setGroups(json.data);
      else throw new Error(json.message || 'Failed to fetch groups');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load contact groups', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Create group
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: 'Error', description: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast({ title: 'Error', description: json.message || 'Failed to create group', variant: 'destructive' });
        return;
      }

      setGroups([json.data, ...groups]);
      setNewGroupName('');
      setNewGroupDescription('');
      toast({ title: 'Success', description: json.message || 'Contact group created', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to create group', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Edit group (Save from modal)
  const editGroup = async () => {
    if (!editingGroup) return;
    if (!editingGroup.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/edit/${editingGroup.uuid}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroup.name, description: editingGroup.description }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast({ title: 'Error', description: json.message || 'Failed to update group', variant: 'destructive' });
        return;
      }

      setGroups(groups.map(g => (g.uuid === editingGroup.uuid ? json.data : g)));
      // leave modal open until we explicitly close (we'll close after success)
      setEditingGroup(null);
      toast({ title: 'Success', description: json.message || 'Contact group updated', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update contact group', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // Delete group (confirmed via controlled dialog)
  const deleteGroup = async (uuid: string) => {
    if (!uuid) return;
    setDeletingUuid(uuid); // mark which row is being deleted
    setRefreshing(true);
    try {
      const res = await fetch(`${BASE_URL}/groups/${uuid}/remove`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast({ title: 'Error', description: json.message || 'Failed to delete group', variant: 'destructive' });
        return;
      }

      setGroups(groups.filter(g => g.uuid !== uuid));
      // close dialog only after success
      setDeletingGroup(null);
      toast({ title: 'Success', description: json.message || 'Contact group deleted', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to delete contact group', variant: 'destructive' });
    } finally {
      setDeletingUuid(null);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <Loader overlay />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contact Groups</h1>
        <p className="text-muted-foreground">Organize your contacts into groups for targeted messaging.</p>
      </div>

      {/* Create Group */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create New Group</CardTitle>
          <CardDescription>Organize your contacts into a new group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
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
            <Button
              onClick={createGroup}
              disabled={creating || !newGroupName.trim()}
              className="flex items-center gap-2"
            >
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

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Your Contact Groups ({groups.length})</CardTitle>
          <CardDescription>Manage your contact groups</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {refreshing && <Loader overlay />}
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
              {groups.map(group => (
                <TableRow key={group.uuid}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.description || 'No description'}</TableCell>
                  <TableCell><Badge variant="secondary">{group.contact_count} contacts</Badge></TableCell>
                  <TableCell>{formatDate(group.created_at)}</TableCell>
                  <TableCell>{formatDate(group.updated_at)}</TableCell>
                  <TableCell className="flex space-x-2">
                    {/* Edit trigger: opens edit modal */}
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

                    {/* Delete trigger: open controlled delete dialog by setting deletingGroup */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingGroup(group)}
                      className="flex items-center gap-2"
                      disabled={!!deletingUuid} // disable while any delete in progress
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingGroup && (
        <AlertDialog open={!!editingGroup} onOpenChange={(open) => {
          // prevent closing while updating
          if (!open && updating) return;
          if (!open) setEditingGroup(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Contact Group</AlertDialogTitle>
              <AlertDialogDescription>Edit name or description for "{editingGroup.name}"</AlertDialogDescription>
            </AlertDialogHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  className="flex-1"
                  value={editingGroup.name}
                  onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                />
                <Input
                  className="flex-1"
                  value={editingGroup.description || ''}
                  onChange={e => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  placeholder="Description (optional)"
                />
              </div>
            </CardContent>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !updating && setEditingGroup(null)} disabled={updating}>
                {updating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Cancelling...
                  </div>
                ) : (
                  'Cancel'
                )}
              </AlertDialogCancel>
              {/* Use AlertDialogAction as save; keep it disabled while updating */}
              <AlertDialogAction onClick={editGroup} disabled={updating}>
                {updating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Controlled Delete Dialog (single instance) */}
      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => {
        // prevent closing while delete in progress for this group
        if (!open && deletingUuid) return;
        if (!open) setDeletingGroup(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Group</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingGroup ? `Are you sure you want to delete "${deletingGroup.name}"? This will remove ${deletingGroup.contact_count} contacts. This action cannot be undone.` : 'Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => !deletingUuid && setDeletingGroup(null)} disabled={!!deletingUuid}>
              {deletingUuid ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Cancelling...
                </div>
              ) : (
                'Cancel'
              )}
            </AlertDialogCancel>

            {/* We use a normal button-ish action (AlertDialogAction) but deleteGroup controls closing */}
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
                'Delete Group'
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
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.reduce((sum, g) => sum + g.contact_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Group</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groups.length > 0 ? Math.max(...groups.map(g => g.contact_count)).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
