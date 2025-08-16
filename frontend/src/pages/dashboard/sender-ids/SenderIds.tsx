import React, { useState, useEffect } from 'react';
import { Plus, Shield, CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader } from '@/components/ui/loader';

interface SenderID {
  uuid: string;
  sender_alias: string;
  company_name: string;
  sample_message: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
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

export default function UserSenderRequests() {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const fetchSenderIds = async () => {
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sender-ids/requests', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch sender IDs');
      setSenderIds(data.data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Unable to load sender ID requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSenderIds = senderIds.filter(s =>
    s.sender_alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedSenderIds = filteredSenderIds.slice((page - 1) * perPage, page * perPage);

  const totalPages = Math.ceil(filteredSenderIds.length / perPage);

  const columns: ColumnDef<SenderID>[] = [
    {
      accessorKey: 'sender_alias',
      header: 'Sender ID',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{row.getValue('sender_alias')}</span>
          {row.original.is_student_request && (
            <Badge variant="secondary" className="text-xs ml-1">Student</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company_name',
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
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return <span className="text-sm">{format(date, 'MMM dd, yyyy')}</span>;
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div className="flex flex-col gap-1">
            <Link to={`/console/sender-ids/${request.uuid}/propagation`} className="text-primary underline text-sm">
              Check Propagation
            </Link>
            {request.document_path && (
              <a href={request.document_path} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
                Download Agreement
              </a>
            )}
            <Link to={`/console/sender-ids/${request.uuid}/upload-agreement`} className="text-primary underline text-sm">
              Upload Agreement
            </Link>
            {request.is_student_request && (
              <span className="text-xs text-muted-foreground">Student ID uploaded</span>
            )}
          </div>
        );
      },
    },
  ];

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

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search sender IDs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded-md w-1/3"
        />
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </div>
      </div>

      <Card className="relative">
        {loading && <Loader overlay />}
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedSenderIds}
          />
        </CardContent>
      </Card>


      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {senderIds.length === 0 && !loading && (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sender ID Requests Yet</h3>
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
