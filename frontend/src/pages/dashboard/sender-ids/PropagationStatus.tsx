import React, { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';

interface Propagation {
  network_name: string;
  network_uuid: string;
  status: 'pending' | 'propagated' | 'failed';
  updated_at: string | null;
}

export default function SenderIdPropagationStatus() {
  const params = useParams();
  const uuid = params.uuid as string | undefined;
  const [propagations, setPropagations] = useState<Propagation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!uuid) return;
    fetchPropagationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  const fetchPropagationStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.sewmrsms.co.tz/api/v1/sender-ids/${uuid}/propagation-status`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch propagation');
      setPropagations(json.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Unable to fetch propagation status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCounts = propagations.reduce(
    (acc, p) => {
      acc.all += 1;
      if (p.status === 'propagated') acc.propagated += 1;
      if (p.status === 'pending') acc.pending += 1;
      if (p.status === 'failed') acc.failed += 1;
      return acc;
    },
    { all: 0, propagated: 0, pending: 0, failed: 0 }
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'propagated':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'propagated':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">Propagated</Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propagation Status</h1>
          <p className="text-muted-foreground">Where your sender ID stands across networks</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Networks Checked</p>
                <p className="text-2xl font-bold">{totalCounts.all}</p>
              </div>
              <div className="rounded-full bg-muted/10 p-2">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Propagated</p>
                <p className="text-2xl font-bold text-success">{totalCounts.propagated}</p>
              </div>
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{totalCounts.pending}</p>
              </div>
              <div className="rounded-full bg-warning/10 p-2">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-destructive">{totalCounts.failed}</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-2">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative">
        {loading && <Loader overlay />}
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {propagations.map((p) => (
            <div
              key={p.network_uuid}
              className="p-4 rounded-2xl shadow-sm bg-gradient-to-br from-white/60 to-muted/5 border border-muted/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md p-2 bg-muted/5">{statusIcon(p.status)}</div>
                    <div className="font-semibold text-lg">{p.network_name}</div>
                  </div>
                  <div className="mt-3">{getStatusBadge(p.status)}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.updated_at ? format(new Date(p.updated_at), 'MMM dd, yyyy HH:mm') : 'No update'}
                </div>
              </div>

              {p.status === 'failed' && (
                <div className="mt-3 text-sm text-destructive">Propagation failed. Check logs or contact support.</div>
              )}
            </div>
          ))}

          {!loading && propagations.length === 0 && (
            <div className="text-center col-span-full py-12 text-muted-foreground">No propagation records found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
