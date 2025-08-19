import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Loader } from '@/components/ui/loader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Key, Plus, Trash2, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export interface ApiToken {
  id: string;
  name: string;
  token_masked: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'revoked';
  last_used?: string;
}

export default function ApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load tokens from backend
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/api-tokens', {
        credentials: 'include', // <-- add this
      });
      const data = await res.json();
      if (data.success) {
        setTokens(data.data);
      } else {
        toast({ title: 'Error', description: 'Failed to load API tokens', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load API tokens', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const res = await fetch(`https://api.sewmrsms.co.tz/api/v1/auth/api-tokens/${tokenId}/revoke`, {
        method: 'POST',
        credentials: 'include', // <-- add this
      });
      const data = await res.json();
      if (data.success) {
        setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: 'revoked' } : t));
        toast({ title: 'Token Revoked', description: data.message });
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to revoke token', variant: 'destructive' });
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const res = await fetch(`https://api.sewmrsms.co.tz/api/v1/auth/api-tokens/${tokenId}`, {
        method: 'DELETE',
        credentials: 'include', // <-- add this
      });
      const data = await res.json();
      if (data.success) {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
        toast({ title: 'Token Deleted', description: data.message });
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete token', variant: 'destructive' });
    }
  };


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const columns: ColumnDef<ApiToken>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'token_masked', header: 'Token', cell: ({ row }) => <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{row.getValue('token_masked')}</code> },
    { accessorKey: 'created_at', header: 'Created', cell: ({ row }) => formatDate(row.getValue('created_at')) },
    { accessorKey: 'expires_at', header: 'Expires', cell: ({ row }) => formatDate(row.getValue('expires_at')) },
    { accessorKey: 'last_used', header: 'Last Used', cell: ({ row }) => row.getValue('last_used') ? formatDate(row.getValue('last_used')) : 'Never' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => row.getValue('status') === 'active' ? <Badge variant="default">Active</Badge> : <Badge variant="destructive">Revoked</Badge> },
    {
      id: 'actions',
      cell: ({ row }) => {
        const token = row.original;
        return (
          <div className="flex items-center space-x-2">
            {token.status === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm"><Ban className="mr-1 h-3 w-3" /> Revoke</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke API Token</AlertDialogTitle>
                    <p>Are you sure you want to revoke "{token.name}"? This cannot be undone.</p>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => revokeToken(token.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke Token</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm"><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete API Token</AlertDialogTitle>
                  <p>Are you sure you want to delete "{token.name}"? This action cannot be undone.</p>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteToken(token.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Token</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Tokens</h1>
          <p className="text-muted-foreground">Manage your API tokens for programmatic access to your account.</p>
        </div>
        <Button asChild>
          <Link to="/console/settings/create-token">
            <Plus className="mr-2 h-4 w-4" /> Create Token
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Your API Tokens</CardTitle>
          <CardDescription>Manage and monitor your API tokens</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          {!loading && <DataTable columns={columns} data={tokens} searchPlaceholder="Search tokens..." />}
        </CardContent>
      </Card>
    </div>
  );
}
