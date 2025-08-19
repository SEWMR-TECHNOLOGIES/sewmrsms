import React, { useEffect, useState } from "react";
import {
  History,
  CreditCard,
  Download,
  ArrowUpDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

interface Transaction {
  order_uuid: string;
  subscription_order_uuid: string;
  amount: number;
  credits: number;
  transaction_type: "purchase" | "usage" | "refund";
  status: "pending" | "completed" | "failed" | "cancelled" | "rejected";
  payment_method?: string;
  transaction_reference?: string;
  created_at: string;
  bank_name?: string;
  gateway?: string;
  checkout_request_id?: string;
}

const BASE_URL = "https://api.sewmrsms.co.tz/api/v1/payments/all-transactions";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-success/10 text-success">
          Completed
        </Badge>
      );
    case "failed":
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "cancelled":
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning">
          Cancelled
        </Badge>
      );
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

export default function Billing() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.message || "Failed to fetch transactions");

      setTransactions(json.data.transactions || []);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "transaction_reference",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.getValue("transaction_reference") || "N/A"}
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
        <span className="capitalize">
          {row.getValue("payment_method") || "N/A"}
        </span>
      ),
    },
   {
    accessorKey: "bank_name",
    header: "Bank/Gateway",
    cell: ({ row }) => {
        const bank = row.getValue("bank_name") as string | null;
        const gateway = row.original.gateway as string | null;
        return (
        <span className="capitalize">
            {bank || gateway || "N/A"}
        </span>
        );
    },
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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const t = row.original;

        // Bank rejected → Upload slip
        if (t.payment_method === "bank" && t.status === "rejected") {
          return (
            <Button asChild size="sm">
              <Link to={`/console/billing/${t.order_uuid}/pay?re-upload-slip`}>
                Upload New Slip
              </Link>
            </Button>
          );
        }

        // Mobile pending → Refresh
        if (t.payment_method === "mobile" && t.status === "pending") {
          return (
            <Button asChild size="sm">
              <Link
                to={`/console/billing/mobile-payment-waiting/${t.order_uuid}/${t.checkout_request_id}`}
              >
                Refresh Status
              </Link>
            </Button>
          );
        }

        // Cancelled → Repay
        if (t.status === "cancelled") {
          return (
            <Button asChild size="sm">
              <Link to={`/console/billing/${t.order_uuid}/pay?mobile-repay`}>
                Repay
              </Link>
            </Button>
          );
        }

        return null;
      },
    },
  ];

  // Stats counts
  const completedCount = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const pendingCount = transactions.filter((t) => t.status === "pending")
    .length;
  const rejectedCount = transactions.filter(
    (t) => t.status === "rejected"
  ).length;
  const cancelledCount = transactions.filter(
    (t) => t.status === "cancelled"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Subscription Orders
          </h1>
          <p className="text-muted-foreground">
            View all your subscription orders and their status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{completedCount}</p>
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
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
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
                <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
            </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-amber-700">{cancelledCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-700" />
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
        <CardContent className="relative">
          {loading && <Loader overlay />}
          <DataTable
            columns={columns}
            data={transactions}
            searchPlaceholder="Search by reference..."
          />
        </CardContent>
      </Card>

      {/* Empty state */}
      {!loading && transactions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Transactions Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Your payment history will appear here once you make your
              first purchase
            </p>
            <Button asChild>
              <Link to="/console/billing/purchase">
                <CreditCard className="h-4 w-4 mr-2" /> Purchase Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
