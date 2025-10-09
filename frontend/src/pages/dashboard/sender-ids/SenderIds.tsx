import React, { useState, useEffect } from 'react';
import { Plus, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader } from '@/components/ui/loader';
import { useMeta } from '@/hooks/useMeta';

interface SenderID {
  uuid: string;
  alias: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'inactive':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>;
    case 'inactive':
      return <Badge variant="destructive">Inactive</Badge>;
    case 'pending':
    default:
      return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Pending</Badge>;
  }
};

export default function UserSenderIds() {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSenderIds = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sender-ids/', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch sender IDs');
      setSenderIds(data.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Unable to load sender IDs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const columns: ColumnDef<SenderID>[] = [
    {
      accessorKey: 'alias',
      header: 'Sender ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue('alias')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            {getStatusBadge(status)}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.getValue('created_at') ? format(new Date(row.getValue('created_at')), 'MMM dd, yyyy') : '—'}
        </span>
      ),
    },
  ];
  
  useMeta({
    title: "My Sender IDs",
    description: "View and manage all your approved, pending, and inactive SMS sender IDs."
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Sender IDs</h1>
          <p className="text-muted-foreground">View all your approved, pending, and inactive sender IDs</p>
        </div>
        <Button onClick={() => navigate('/console/sender-ids/request')}>
          <Plus className="h-4 w-4 mr-2" />
          Request New Sender ID
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sender IDs</p>
                <p className="text-2xl font-bold">{senderIds.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">
                  {senderIds.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending / Inactive</p>
                <p className="text-2xl font-bold text-warning">
                  {senderIds.filter(s => s.status === 'pending' || s.status === 'inactive').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>My Sender IDs</CardTitle>
          <CardDescription>
            A list of all your sender IDs and their current status
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={senderIds} searchPlaceholder="Search sender IDs..." />
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && senderIds.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sender IDs Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't been assigned any sender IDs yet. Request one to start sending SMS.
            </p>
            <Button onClick={() => navigate('/console/sender-ids/request')}>
              <Plus className="h-4 w-4 mr-2" /> Request Sender ID
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
