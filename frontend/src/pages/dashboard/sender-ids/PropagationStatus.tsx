import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader } from '@/components/ui/loader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Network, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMeta } from '@/hooks/useMeta';

interface NetworkStatus {
  network_name: string;
  status: 'pending' | 'propagated' | 'failed';
  last_updated: string;
  details?: string;
}

interface PropagationData {
  sender_request_uuid: string;
  sender_id: string;
  networks: NetworkStatus[];
  overall_status: 'pending' | 'propagated' | 'failed' | 'partial';
  last_checked: string;
}

type ApiPropagationItem = {
  network_name: string;
  network_uuid: string;
  status: 'pending' | 'propagated' | 'failed';
  updated_at: string | null;
  details?: string | null;
};

type ApiResponse =
  | {
      success: true;
      data: ApiPropagationItem[];
      sender_id?: string;
      overall_status?: 'pending' | 'propagated' | 'failed' | 'partial';
      message?: string;
    }
  | {
      success: false;
      data?: unknown;
      message?: string;
    };

export default function PropagationStatus() {
  const { uuid: senderRequestUuid } = useParams<{ uuid: string }>();
  const fetchControllerRef = useRef<AbortController | null>(null);

  const [propagationData, setPropagationData] = useState<PropagationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No update';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'No update';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const computeOverallStatus = (items: NetworkStatus[]): PropagationData['overall_status'] => {
    if (!items.length) return 'pending';
    const counts = items.reduce(
      (acc, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1;
        return acc;
      },
      {} as Record<NetworkStatus['status'], number>
    );
    const all = items.length;
    const propagated = counts.propagated || 0;
    const failed = counts.failed || 0;
    const pending = counts.pending || 0;

    if (propagated === all) return 'propagated';
    if (failed === all) return 'failed';
    if (propagated > 0 && (failed > 0 || pending > 0)) return 'partial';
    return 'pending';
  };

  const mapApiToUi = useCallback(
    (api: ApiResponse): PropagationData => {
      if (!senderRequestUuid) {
        throw new Error('Missing sender request uuid');
      }
      if (!('success' in api) || !api.success) {
        throw new Error(api && 'message' in api && api.message ? api.message : 'Failed to fetch propagation');
      }

      const networks: NetworkStatus[] = (api.data || []).map((item: ApiPropagationItem) => ({
        network_name: item.network_name,
        status: item.status,
        last_updated: item.updated_at || '',
        details: item.details || '',
      }));

      const overall = api.overall_status || computeOverallStatus(networks);

      return {
        sender_request_uuid: senderRequestUuid,
        sender_id: api.sender_id || '',
        networks,
        overall_status: overall,
        last_checked: new Date().toISOString(),
      };
    },
    [senderRequestUuid]
  );

  const fetchPropagationStatus = useCallback(
    async (showRefreshToast = false) => {
      // abort any previous request
      if (fetchControllerRef.current) {
        try {
          fetchControllerRef.current.abort();
        } catch {}
      }

      const controller = new AbortController();
      fetchControllerRef.current = controller;

      if (showRefreshToast) setRefreshing(true);
      else setLoading(true);

      try {
        if (!senderRequestUuid) throw new Error('Missing sender request uuid');

        const res = await fetch(
          `https://api.sewmrsms.co.tz/api/v1/sender-ids/${encodeURIComponent(
            senderRequestUuid
          )}/propagation-status`,
          { credentials: 'include', signal: controller.signal }
        );

        // if aborted, fetch will throw; let that bubble up to finally
        const json: ApiResponse = await res.json();

        if (!res.ok || ('success' in json && !json.success)) {
          throw new Error(('message' in json && json.message) || 'Failed to fetch propagation status');
        }

        const mapped = mapApiToUi(json);
        setPropagationData(mapped);

        if (showRefreshToast) {
          toast({
            title: 'Status Updated',
            description: 'Propagation status has been refreshed',
            variant: 'success',
          });
        }
      } catch (error: any) {
        // If request was aborted, do not show an error toast
        if (error?.name === 'AbortError') {
          // no op
        } else {
          toast({
            title: 'Error',
            description: error?.message || 'Failed to load propagation status',
            variant: 'destructive',
          });
        }
      } finally {
        // clear controller only if it's the same one
        if (fetchControllerRef.current === controller) fetchControllerRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mapApiToUi, senderRequestUuid, toast]
  );

  useEffect(() => {
    fetchPropagationStatus();
    const id = setInterval(() => fetchPropagationStatus(false), 5 * 60 * 1000);

    return () => {
      clearInterval(id);
      if (fetchControllerRef.current) {
        try {
          fetchControllerRef.current.abort();
        } catch {}
      }
    };
  }, [fetchPropagationStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'propagated':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Propagated
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'propagated':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-4 w-4" />
            Fully Propagated
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="mr-1 h-4 w-4" />
            Partially Propagated
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="mr-1 h-4 w-4" />
            Propagation Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="mr-1 h-4 w-4" />
            Propagation Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = useMemo(() => {
    if (!propagationData) return { propagated: 0, pending: 0, failed: 0 };
    return propagationData.networks.reduce(
      (acc, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1;
        return acc;
      },
      { propagated: 0, pending: 0, failed: 0 } as Record<'propagated' | 'pending' | 'failed', number>
    );
  }, [propagationData]);

  // show retry only if not loading and no data
  if (!propagationData && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propagation Status</h1>
          <p className="text-muted-foreground">Unable to load propagation status data.</p>
        </div>
        <Button onClick={() => fetchPropagationStatus()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  useMeta({
    title: "Sender ID Propagation Status",
    description: "Monitor the propagation status of your sender ID across all networks. See detailed network status and overall progress."
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propagation Status</h1>
          <p className="text-muted-foreground">
            Monitor your sender ID propagation across networks.
          </p>
        </div>
        <Button onClick={() => fetchPropagationStatus(true)} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sender ID</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propagationData?.sender_id || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {getOverallStatusBadge(propagationData?.overall_status || 'pending')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propagated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.propagated}</div>
            <p className="text-xs text-muted-foreground">Networks active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">Networks processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            <p className="text-xs text-muted-foreground">Networks rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {propagationData?.overall_status === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Sender ID propagation has failed on all networks. Please contact support for assistance.
          </AlertDescription>
        </Alert>
      )}

      {propagationData?.overall_status === 'partial' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sender ID is partially propagated. Some networks are still processing or have failed.
          </AlertDescription>
        </Alert>
      )}

      {/* Networks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Propagation Details
          </CardTitle>
          <CardDescription>Detailed status for each network carrier</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          {(loading || refreshing) && <Loader overlay />}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propagationData?.networks.map((network, index) => (
                <TableRow key={`${network.network_name}-${index}`}>
                  <TableCell className="font-medium">{network.network_name}</TableCell>
                  <TableCell>{getStatusBadge(network.status)}</TableCell>
                  <TableCell>{formatDate(network.last_updated)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {network.details || 'No additional details'}
                  </TableCell>
                </TableRow>
              ))}
              {(!propagationData || propagationData.networks.length === 0) && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No propagation records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Last Checked Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last checked: {formatDate(propagationData?.last_checked || '')}</span>
            <span>Auto refresh every 5 minutes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
