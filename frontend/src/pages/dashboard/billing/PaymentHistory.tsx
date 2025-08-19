import React, { useEffect, useState } from "react";
import { History, CreditCard, Download, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

interface Transaction {
  id: string;
  amount: number;
  credits: number;
  transaction_type: "purchase" | "usage" | "refund";
  status: "pending" | "completed" | "failed" | "refunded";
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
}

const BASE_URL = "https://api.sewmrsms.co.tz/api/v1/payments/transactions";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "refunded":
      return <Badge variant="secondary" className="bg-warning/10 text-warning">Refunded</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case "purchase":
      return <Badge className="bg-primary/10 text-primary">Purchase</Badge>;
    case "usage":
      return <Badge variant="outline">Usage</Badge>;
    case "refund":
      return <Badge variant="secondary">Refund</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function PaymentHistory() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch transactions");

      setTransactions(
        (json.data.transactions || []).map((t: any) => ({
          ...t,
          transaction_type: t.transaction_type as "purchase" | "usage" | "refund",
          status: t.status as "pending" | "completed" | "failed" | "refunded",
        }))
      );
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "payment_reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.getValue("payment_reference") || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => getTypeBadge(row.getValue("transaction_type")),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amt = Number(row.getValue("amount") ?? 0);
        return (
          <span className="font-medium">
            TZS {amt.toLocaleString("en-TZ", { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => (
        <span className="font-medium">
          {(row.getValue("credits") as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => (
        <span className="capitalize">{row.getValue("payment_method") || "N/A"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-sm">
            <div>{format(date, "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground">{format(date, "HH:mm")}</div>
          </div>
        );
      },
    },
  ];

  const totalSpent = transactions.filter(t => t.transaction_type === "purchase" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = transactions.filter(t => t.transaction_type === "purchase" && t.status === "completed").reduce((sum, t) => sum + t.credits, 0);

  // Inside PaymentHistory component, before return()
  const exportToCSV = () => {
    if (transactions.length === 0) return;

    // Define CSV headers
    const headers = ["Reference", "Type", "Amount (TZS)", "Credits", "Status", "Method", "Date"];
    
    // Map transactions to CSV rows
    const rows = transactions.map(t => [
      t.payment_reference || "",
      t.transaction_type,
      t.amount.toLocaleString("en-TZ", { maximumFractionDigits: 0 }),
      t.credits.toLocaleString(),
      t.status,
      t.payment_method || "",
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm")
    ]);

    // Combine headers and rows
    const csvContent =
      [headers, ...rows].map(e => e.join(",")).join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
          <p className="text-muted-foreground">View all your payment transactions and download reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">TZS {totalSpent.toLocaleString("en-TZ", { maximumFractionDigits: 0 })}</p>
            </div>
            <CreditCard className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credits Purchased</p>
              <p className="text-2xl font-bold">{totalCredits.toLocaleString("en-TZ", { maximumFractionDigits: 0 })}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <History className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Complete history of all your payment transactions</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable columns={columns} data={transactions} searchPlaceholder="Search by reference..." />
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && transactions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-muted-foreground mb-4">Your payment history will appear here once you make your first purchase</p>
            <Button asChild>
              <Link to="/console/billing/purchase">
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
