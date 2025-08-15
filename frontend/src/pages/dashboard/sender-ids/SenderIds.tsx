import React, { useState, useEffect } from 'react';
import { Plus, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

interface SenderID {
  id: string;
  sender_id: string;
  business_name: string;
  organization: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  created_at: string;
  rejection_reason?: string;
  networks: string[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'under_review':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge variant="secondary" className="bg-success/10 text-success">Approved</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'under_review':
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Under Review</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export default function SenderIds() {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const fetchSenderIds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSenderIds((data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected' | 'under_review',
        networks: Array.isArray(item.networks) ? item.networks : JSON.parse(item.networks as string || '[]')
      })));
    } catch (error) {
      console.error('Error fetching sender IDs:', error);
      toast({
        title: "Error",
        description: "Failed to load sender IDs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<SenderID>[] = [
    {
      accessorKey: 'sender_id',
      header: 'Sender ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue('sender_id')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'business_name',
      header: 'Business Name',
    },
    {
      accessorKey: 'organization',
      header: 'Organization',
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
      accessorKey: 'networks',
      header: 'Networks',
      cell: ({ row }) => {
        const networks = row.getValue('networks') as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {networks?.length ? (
              networks.map((network, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {network}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return <span className="text-sm">{format(date, 'MMM dd, yyyy')}</span>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Sender IDs</h1>
            <p className="text-muted-foreground">Manage your SMS sender identities</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Request New Sender ID
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sender IDs</h1>
          <p className="text-muted-foreground">
            Manage your SMS sender identities and track their approval status
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/sender-ids/request')}>
          <Plus className="h-4 w-4 mr-2" />
          Request New Sender ID
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">
                  {senderIds.filter(s => s.status === 'approved').length}
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">
                  {senderIds.filter(s => s.status === 'pending' || s.status === 'under_review').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-destructive">
                  {senderIds.filter(s => s.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sender IDs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sender IDs</CardTitle>
          <CardDescription>
            View and manage all your sender ID requests and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={senderIds}
            searchKey="sender_id"
            searchPlaceholder="Search sender IDs..."
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {senderIds.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sender IDs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by requesting your first sender ID to send SMS messages
            </p>
            <Button onClick={() => navigate('/dashboard/sender-ids/request')}>
              <Plus className="h-4 w-4 mr-2" />
              Request Your First Sender ID
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}