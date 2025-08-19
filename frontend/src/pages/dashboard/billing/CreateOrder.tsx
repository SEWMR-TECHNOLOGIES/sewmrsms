import React, { useState } from 'react';
import { ArrowLeft, Send, CreditCard } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type OrderResponse = {
  success: boolean;
  message?: string;
  data?: {
    uuid: string;
    package_uuid: string;
    package_name?: string;
    amount: number;
    total_sms: number;
    payment_status: string;
    created_at: string;
  } | null;
};

export default function CreateOrder(): JSX.Element {
  const { packageUuid } = useParams<{ packageUuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [numberOfMessages, setNumberOfMessages] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResponse['data'] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const n = parseInt(numberOfMessages, 10);
    if (Number.isNaN(n) || n <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid number',
        description: 'Enter a positive integer for number of messages',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/subscriptions/purchase-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ number_of_messages: n }),
      });

      const payload: OrderResponse = await res.json();

      if (!payload || !payload.success) {
        const msg = payload?.message || 'Failed to create order';
        toast({ variant: 'destructive', title: 'Order failed', description: msg });
        setLoading(false);
        return;
      }

      if (!payload.data) {
        toast({ variant: 'destructive', title: 'Order failed', description: 'No order data returned' });
        setLoading(false);
        return;
      }

      setOrder(payload.data);
      toast({ variant: 'success', title: 'Order created', description: 'Complete payment to activate your SMS credits' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Network error', description: 'Unable to reach the server. Try again shortly.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/console/billing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Purchase SMS Credits</h1>
          <p className="text-muted-foreground">Quickly top up SMS bundles and continue sending</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Purchase SMS
              </CardTitle>
              <CardDescription>
                Package UUID: <code>{packageUuid || 'not provided'}</code>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-2">
                  <Label htmlFor="number_of_messages">Number of messages to purchase <span className="text-destructive">*</span></Label>
                  <Input
                    id="number_of_messages"
                    type="number"
                    min={1}
                    placeholder="e.g. 1000"
                    value={numberOfMessages}
                    onChange={(e) => setNumberOfMessages(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Enter how many SMS credits you want to buy.</p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Creating order...' : 'Create Order'}
                  </Button>

                  <Button variant="outline" onClick={() => setNumberOfMessages('')}>
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Order result */}
          {order && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order ready for payment
                </CardTitle>
                <CardDescription>Order ID: <code>{order.uuid}</code></CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm">Package</p>
                    <p className="font-medium">{order.package_name || order.package_uuid}</p>
                  </div>

                  <div>
                    <p className="text-sm">Amount</p>
                    <p className="font-medium">TZS {Number(order.amount).toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-sm">Total SMS</p>
                    <p className="font-medium">{order.total_sms}</p>
                  </div>

                  <div className="flex gap-3">
                    {/* Link to payment page. This follows your requested route:
                        /console/billing/<order-uuid>/pay */}
                    <Link to={`/console/billing/${order.uuid}/pay`} className="inline-block">
                      <Button>
                        Proceed to payment
                      </Button>
                    </Link>

                    <Button variant="ghost" onClick={() => {
                      // If user wants to stay on the page but copy link or re-open payment
                      navigator.clipboard?.writeText(`${window.location.origin}/console/billing/${order.uuid}/pay`);
                      toast({ title: 'Link copied', description: 'Payment link copied to clipboard' });
                    }}>
                      Copy payment link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create an order with the number of SMS you want. After the order is created, complete payment to activate the credits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                <li>You need at least one active sender ID to purchase SMS. The backend enforces this.</li>
                <li>Payment must be completed for the credits to be added to your account.</li>
                <li>If your order fails, check your network and try again.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If the backend returns an error about sender IDs, create or activate a sender ID before retrying.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
