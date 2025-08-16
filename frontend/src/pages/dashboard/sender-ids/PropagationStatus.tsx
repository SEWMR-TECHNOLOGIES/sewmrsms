import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader"; 
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

interface Propagation {
  network_name: string;
  network_uuid: string;
  color_code: string;
  status: "pending" | "propagated" | "failed";
  updated_at: string | null;
}

export default function SenderIdPropagationStatus() {
  const { uuid } = useParams<{ uuid: string }>();
  const [propagations, setPropagations] = useState<Propagation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPropagationStatus();
  }, []);

  const fetchPropagationStatus = async () => {
    try {
      const res = await fetch(
        `https://api.sewmrsms.co.tz/api/v1/sender-ids/${uuid}/propagation-status`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to fetch propagation");
      setPropagations(json.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Unable to fetch propagation status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 rounded-full text-sm bg-gray-200 text-gray-700">Pending</span>;
      case "propagated":
        return <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Propagated</span>;
      case "failed":
        return <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-sm bg-gray-200 text-gray-700">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Propagation Status</h1>

      <Card className="relative">
        {loading && <Loader overlay />} {/* custom loader */}
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propagations.map((p) => (
            <div
              key={p.network_uuid}
              className="flex flex-col items-center p-4 rounded-lg shadow-md"
              style={{ borderTop: `4px solid ${p.color_code}` }}
            >
              <div className="font-semibold text-lg">{p.network_name}</div>
              <div className="mt-2">{getStatusBadge(p.status)}</div>
              {p.updated_at && (
                <div className="text-xs text-muted-foreground mt-1">
                  Last update: {format(new Date(p.updated_at), "MMM dd, yyyy HH:mm")}
                </div>
              )}
            </div>
          ))}

          {!loading && propagations.length === 0 && (
            <div className="text-center col-span-full py-12 text-muted-foreground">
              No propagation records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
