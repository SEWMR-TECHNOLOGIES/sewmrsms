import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, UserPlus, Download, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';

export type Contact = {
  id: string;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  group_uuid?: string;
  group_name: string;
  blacklisted: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactGroup = {
  uuid: string;
  name: string;
  contact_count: number;
};

const API_BASE = 'https://api.sewmrsms.co.tz/api/v1/contacts';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalFromLastMonth: 0,
    active: 0,
    activePercentage: 0,
    groups: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Edit/Delete state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [updatingContact, setUpdatingContact] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);

  // Edit modal local state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroup, setEditGroup] = useState<string>('none');

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch contacts');
      setContacts(data.data.contacts);
      setStats(data.data.stats);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load contacts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch groups for searchable select
  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/groups`, { credentials: 'include' });
      const data = await res.json();
      const mapped = Array.isArray(data?.data) ? data.data.map((g: any) => ({
        uuid: g.uuid,
        name: g.name,
        contact_count: Number(g.contact_count || 0),
      })) : [];
      setGroups(mapped);
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch groups', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  const handleToggleBlacklist = async (contact: Contact) => {
    const action = contact.blacklisted ? 'unblacklist' : 'blacklist';
    try {
      const res = await fetch(`${API_BASE}/${contact.uuid}/${action}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setContacts(prev =>
          prev.map(c => (c.uuid === contact.uuid ? { ...c, blacklisted: !contact.blacklisted } : c))
        );
        toast({ title: 'Success', description: data.message, variant: 'success' });
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: `Failed to ${action} contact.`, variant: 'destructive' });
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name || '');
    setEditPhone(contact.phone || '');
    setEditEmail(contact.email || '');
    setEditGroup(contact.group_uuid || 'none');
  };

  // CSV export 
  const exportContactsCSV = () => {
    if (contacts.length === 0) {
      toast({ title: 'Info', description: 'No contacts to export', variant: 'default' });
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Group', 'Status', 'Created At', 'Updated At'];
    const rows = contacts.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      `"${c.group_name || ''}"`,
      `"${c.blacklisted ? 'Blocked' : 'Active'}"`,
      `"${new Date(c.created_at).toLocaleString('en-GB')}"`,
      `"${new Date(c.updated_at).toLocaleString('en-GB')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // VCF export
  const exportContactsVCF = () => {
    if (contacts.length === 0) {
      toast({ title: 'Info', description: 'No contacts to export', variant: 'default' });
      return;
    }

    let vcfContent = contacts.map(c => {
      const [firstName, ...lastNameParts] = c.name.split(' ');
      const lastName = lastNameParts.join(' ');
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.name}`,
        `N:${lastName};${firstName};;;`,
        `TEL;TYPE=CELL:${c.phone}`,
        c.email ? `EMAIL:${c.email}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    }).join('\n');

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const editContact = async () => {
    if (!editingContact) return;
    if (!editName.trim() || !editPhone.trim()) {
      toast({ title: 'Error', description: 'Name and phone are required', variant: 'destructive' });
      return;
    }

    setUpdatingContact(true);
    try {
      const res = await fetch(`${API_BASE}/${editingContact.uuid}/edit`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim(), email: editEmail.trim() || null, group_uuid: editGroup }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to update contact');

      setContacts(prev => prev.map(c =>
        c.uuid === editingContact.uuid
          ? { ...c, name: json.data.name, phone: json.data.phone, email: json.data.email, group_name: json.data.group_name, group_uuid: json.data.group_uuid }
          : c
      ));
      setEditingContact(null);
      toast({ title: 'Success', description: json.message || 'Contact updated', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to update contact', variant: 'destructive' });
    } finally {
      setUpdatingContact(false);
    }
  };

  const openDeleteModal = (contact: Contact) => setDeletingContact(contact);
  const deleteContact = async (uuid: string) => {
    if (!uuid) return;
    setDeletingUuid(uuid);
    try {
      const res = await fetch(`${API_BASE}/${uuid}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to delete contact');

      setContacts(prev => prev.filter(c => c.uuid !== uuid));
      setDeletingContact(null);
      toast({ title: 'Success', description: json.message || 'Contact deleted', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete contact', variant: 'destructive' });
    } finally {
      setDeletingUuid(null);
    }
  };

  const groupOptions: SearchableSelectOption[] = [
    { value: 'none', label: 'No Group', description: 'Unassigned' },
    ...groups.map(g => ({
      value: g.uuid,
      label: g.name,
      description: `${g.contact_count} contacts`,
    })),
  ];

  const columns: ColumnDef<Contact>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.getValue('email') || <span className="text-muted-foreground">-</span> },
    { accessorKey: 'group_name', header: 'Group', cell: ({ row }) => <Badge variant="secondary">{row.getValue('group_name')}</Badge> },
    {
      accessorKey: 'blacklisted',
      header: 'Status',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center justify-between">
            <Badge variant={contact.blacklisted ? 'destructive' : 'default'}>
              {contact.blacklisted ? 'Blocked' : 'Active'}
            </Badge>
            <ToggleSwitch checked={contact.blacklisted} onChange={() => handleToggleBlacklist(contact)} label="" />
          </div>
        );
      },
    },
    { accessorKey: 'created_at', header: 'Created', cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString('en-GB') },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditModal(row.original)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteModal(row.original)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database and organize recipients.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportContactsCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>

          <Button variant="outline" onClick={exportContactsVCF}>
            <Download className="mr-2 h-4 w-4" /> Export VCF
          </Button>

          <Button asChild>
            <Link to="/console/contacts/new">
              <UserPlus className="mr-2 h-4 w-4" /> Add Contact
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">+{stats.totalFromLastMonth} from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{stats.activePercentage}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groups}</div>
            <p className="text-xs text-muted-foreground">Contact groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">New contacts added</p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts</CardTitle>
          <CardDescription>A list of all your contacts with their details and status.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={contacts} searchPlaceholder="Search contacts..." />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingContact && (
        <AlertDialog open={!!editingContact} onOpenChange={(open) => { if (!open && !updatingContact) setEditingContact(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Contact</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4 flex flex-col gap-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" />
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email (optional)" />
              <SearchableSelect
                options={groupOptions}
                value={editGroup}
                onValueChange={(val: string) => setEditGroup(val)}
                placeholder="Select a group or leave blank"
                searchPlaceholder="Search groups..."
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !updatingContact && setEditingContact(null)} disabled={updatingContact}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={editContact} disabled={updatingContact}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Modal */}
      {deletingContact && (
        <AlertDialog open={!!deletingContact} onOpenChange={(open) => { if (!open && !deletingUuid) setDeletingContact(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Are you sure you want to delete "{deletingContact.name}"?</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => !deletingUuid && setDeletingContact(null)} disabled={!!deletingUuid}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingContact && deleteContact(deletingContact.uuid)} className="bg-destructive text-destructive-foreground" disabled={!!deletingUuid}>Delete Contact</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}