import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Loader } from "@/components/ui/loader";
import { Download, FileText, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import { useMeta } from "@/hooks/useMeta";

interface Invoice {
  id: string;
  reference: string;
  amount: number;
  credits: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export default function Invoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/payments/transactions", { credentials: "include" });
        const json = await res.json();
        if (json.success) {
          const completed = (json.data?.transactions ?? [])
            .filter((t: any) => t.transaction_type === "purchase" && t.status === "completed")
            .map((t: any) => ({
              id: t.id,
              reference: t.payment_reference || `INV-${t.id}`,
              amount: t.amount,
              credits: t.credits,
              status: t.status,
              payment_method: t.payment_method || "N/A",
              created_at: t.created_at,
            }));
          setInvoices(completed);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const exportCSV = () => {
    if (invoices.length === 0) return;
    const headers = ["Reference", "Amount (TZS)", "Credits", "Method", "Date"];
    const rows = invoices.map(inv => [
      inv.reference, inv.amount, inv.credits, inv.payment_method, format(new Date(inv.created_at), "yyyy-MM-dd HH:mm")
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const columns: ColumnDef<Invoice>[] = [
    { accessorKey: "reference", header: "Reference", cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("reference")}</span> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-medium">TZS {Number(row.getValue("amount")).toLocaleString()}</span> },
    { accessorKey: "credits", header: "Credits", cell: ({ row }) => <span>{Number(row.getValue("credits")).toLocaleString()}</span> },
    { accessorKey: "payment_method", header: "Method", cell: ({ row }) => <span className="capitalize">{row.getValue("payment_method")}</span> },
    { accessorKey: "status", header: "Status", cell: () => <Badge variant="default">Paid</Badge> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => format(new Date(row.getValue("created_at")), "MMM dd, yyyy") },
  ];

  useMeta({ title: "Invoices", description: "View and download your billing invoices." });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Your completed payment invoices</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={invoices.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> All Invoices</CardTitle>
          <CardDescription>{invoices.length} completed invoices</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {loading && <Loader overlay />}
          {!loading && <DataTable columns={columns} data={invoices} searchPlaceholder="Search invoices..." />}
        </CardContent>
      </Card>

      {!loading && invoices.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground">Invoices will appear here after your first completed purchase</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
