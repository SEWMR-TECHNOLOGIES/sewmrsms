import React, { useState, useEffect } from 'react';
import { History, CreditCard, Download, Filter, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';

interface Transaction {
  id: string;
  amount: number;
  credits: number;
  transaction_type: 'purchase' | 'usage' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'refunded':
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Refunded</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'purchase':
      return <Badge className="bg-primary/10 text-primary">Purchase</Badge>;
    case 'usage':
      return <Badge variant="outline">Usage</Badge>;
    case 'refund':
      return <Badge variant="secondary">Refund</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data || []).map(item => ({
        ...item,
        transaction_type: item.transaction_type as 'purchase' | 'usage' | 'refund',
        status: item.status as 'pending' | 'completed' | 'failed' | 'refunded'
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'payment_reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.getValue('payment_reference') || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'transaction_type',
      header: 'Type',
      cell: ({ row }) => getTypeBadge(row.getValue('transaction_type')),
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return <span className="font-medium">${amount.toFixed(2)}</span>;
      },
    },
    {
      accessorKey: 'credits',
      header: 'Credits',
      cell: ({ row }) => (
        <span className="font-medium">
          {(row.getValue('credits') as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="capitalize">
          {row.getValue('payment_method') || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return (
          <div className="text-sm">
            <div>{format(date, 'MMM dd, yyyy')}</div>
            <div className="text-muted-foreground">{format(date, 'HH:mm')}</div>
          </div>
        );
      },
    },
  ];

  const totalSpent = transactions
    .filter(t => t.transaction_type === 'purchase' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = transactions
    .filter(t => t.transaction_type === 'purchase' && t.status === 'completed')
    .reduce((sum, t) => sum + t.credits, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">View all your payment transactions and history</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">
            View all your payment transactions and download reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credits Purchased</p>
                <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <History className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Complete history of all your payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={transactions}
            searchKey="payment_reference"
            searchPlaceholder="Search by reference..."
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {transactions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Your payment history will appear here once you make your first purchase
            </p>
            <Button onClick={() => window.location.href = '/dashboard/billing/purchase'}>
              <CreditCard className="h-4 w-4 mr-2" />
              Purchase Credits
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}