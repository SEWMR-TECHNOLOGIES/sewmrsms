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

export type Contact = {
  id: string;
  uuid: string;
  name: string;
  phone: string;
  email?: string;
  group_name: string;
  blacklisted: boolean;
  created_at: string;
  updated_at: string;
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
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

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/contacts', { credentials: 'include' });
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

  useEffect(() => {
    fetchContacts();
  }, []);

  const columns: ColumnDef<Contact>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone', header: 'Phone' },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return email || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'group_name',
      header: 'Group',
      cell: ({ row }) => {
        const group = row.getValue('group_name') as string;
        return <Badge variant="secondary">{group}</Badge>;
      },
    },
    {
      accessorKey: 'blacklisted',
      header: 'Status',
      cell: ({ row }) => {
        const blocked = row.getValue('blacklisted') as boolean;
        return (
          <Badge variant={blocked ? 'destructive' : 'default'}>
            {blocked ? 'Blocked' : 'Active'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return date.toLocaleDateString();
      },
    },
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
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
          <p className="text-muted-foreground">
            Manage your contact database and organize recipients.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/dashboard/contacts/import">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild>
            <Link to="/dashboard/contacts/new">
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
          <CardDescription>
            A list of all your contacts with their details and status.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={contacts} searchPlaceholder="Search contacts..." />
        </CardContent>
      </Card>
    </div>
  );
}
