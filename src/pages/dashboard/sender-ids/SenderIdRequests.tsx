import React, { useState, useEffect } from 'react';
import { Plus, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { useMeta } from '@/hooks/useMeta';

interface SenderID {
  uuid: string;
  sender_alias: string;
  company_name: string;
  sample_message: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  is_student_request: boolean;
  student_id_path?: string;
  document_path?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'in_review':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'pending':
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
    case 'in_review':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border border-amber-300">Under Review</Badge>;
    case 'pending':
    default:
      return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Pending</Badge>;
  }
};

export default function UserSenderRequests() {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSenderIds = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sender-ids/requests', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch sender IDs');
      setSenderIds(data.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Unable to load sender ID requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const columns: ColumnDef<SenderID>[] = [
    {
      accessorKey: 'sender_alias',
      header: 'Sender ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue('sender_alias')}</span>
          {row.original.is_student_request && <Badge variant="secondary" className="text-xs ml-1">Student</Badge>}
        </div>
      ),
    },
    { accessorKey: 'company_name', header: 'Organization' },
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
      cell: ({ row }) => <span className="text-sm">{format(new Date(row.getValue('created_at')), 'MMM dd, yyyy')}</span>,
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const request = row.original;
        const isApproved = request.status === 'approved';
        const isUnderReview = request.status === 'in_review';
        return (
          <div className="flex flex-col gap-1">
            {isApproved && <Link to={`/console/sender-ids/${request.uuid}/propagation`} className="text-primary underline text-sm">Check Propagation</Link>}
            {request.document_path && <a href={request.document_path} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Uploaded Agreement</a>}
            {!isApproved && <a href={`https://api.sewmrsms.co.tz/api/v1/sender-ids/requests/${request.uuid}/download-agreement`} target="_blank" rel="noreferrer" className={`text-primary underline text-sm ${isUnderReview ? 'pointer-events-none opacity-50' : ''}`}>Download Agreement to Sign</a>}
            {!isApproved && <Link to={`/console/sender-ids/${request.uuid}/upload-agreement`} className={`text-primary underline text-sm ${isUnderReview ? 'pointer-events-none opacity-50' : ''}`}>Upload Agreement</Link>}
            {request.remarks && <span className="text-xs text-muted-foreground">Remarks: {request.remarks}</span>}
            {request.is_student_request && <span className="text-xs text-muted-foreground">Student ID uploaded</span>}
          </div>
        );
      },
    },
  ];

  useMeta({
    title: "Sender ID Requests",
    description: "View, manage, and track all your sender ID requests within your SEWMR SMS account."
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sender ID Requests</h1>
          <p className="text-muted-foreground">View and manage all your sender ID requests</p>
        </div>
        <Button onClick={() => navigate('/console/sender-ids/request')}>
          <Plus className="h-4 w-4 mr-2" />
          Request New Sender ID
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Requests</p><p className="text-2xl font-bold">{senderIds.length}</p></div><Shield className="h-8 w-8 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Approved</p><p className="text-2xl font-bold text-success">{senderIds.filter(s => s.status === 'approved').length}</p></div><CheckCircle className="h-8 w-8 text-success" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Pending / Review</p><p className="text-2xl font-bold text-warning">{senderIds.filter(s => s.status === 'pending' || s.status === 'in_review').length}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-destructive">{senderIds.filter(s => s.status === 'rejected').length}</p></div><XCircle className="h-8 w-8 text-destructive" /></div></CardContent></Card>
      </div>

      {/* DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Sender ID Requests</CardTitle>
          <CardDescription>
            A list of all your sender ID requests, their status, and actions you can take
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
            <h3 className="text-lg font-semibold mb-2">No Sender ID Requests Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by requesting your first sender ID to send SMS messages</p>
            <Button onClick={() => navigate('/console/sender-ids/request')}>
              <Plus className="h-4 w-4 mr-2" /> Request Your First Sender ID
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
