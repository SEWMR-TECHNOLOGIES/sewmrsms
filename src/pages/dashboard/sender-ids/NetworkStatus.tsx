import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wifi, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeta } from "@/hooks/useMeta";

interface Network {
  id: number;
  name: string;
  color_code: string;
  created_at: string;
}

export default function NetworkStatus() {
  const { toast } = useToast();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/sender-id/networks", { credentials: "include" });
        const data = await res.json();
        setNetworks(data.data ?? []);
      } catch {
        toast({ title: "Error", description: "Failed to load network information", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchNetworks();
  }, []);

  useMeta({ title: "Network Status", description: "View available mobile networks and their status for sender ID propagation." });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
        <p className="text-muted-foreground">Available mobile networks for sender ID propagation</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : networks.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No networks available</p>
          </div>
        ) : (
          networks.map((n) => (
            <Card key={n.id} className="overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: n.color_code }} />
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: n.color_code + "20" }}>
                    <Wifi className="h-5 w-5" style={{ color: n.color_code }} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{n.name}</h3>
                    <Badge variant="default" className="mt-1 text-xs">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && networks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Details</CardTitle>
            <CardDescription>Full list of supported mobile networks</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell><div className="w-6 h-6 rounded-full border" style={{ backgroundColor: n.color_code }} /></TableCell>
                    <TableCell className="font-medium">{n.name}</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
