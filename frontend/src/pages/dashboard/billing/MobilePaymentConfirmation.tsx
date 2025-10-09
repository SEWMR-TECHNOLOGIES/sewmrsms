import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMeta } from '@/hooks/useMeta';

export default function MobilePaymentWaiting() {
  const { orderUuid, checkoutRequestId } = useParams<{ orderUuid: string; checkoutRequestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const countdown = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `https://api.sewmrsms.co.tz/api/v1/subscriptions/${orderUuid}/payments/${checkoutRequestId}/status`,
          { credentials: 'include' }
        );
        const data = await res.json();

        if (data.success) {
          toast({ variant: 'success', title: 'Payment Completed', description: data.message });
          clearInterval(countdown);
          clearInterval(pollInterval);
          navigate('/console/billing');
        } else if (data.success === false) {
          toast({ variant: 'destructive', title: 'Payment Failed', description: data.message || 'Your mobile payment was not successful.' });
          clearInterval(countdown);
          clearInterval(pollInterval);
          navigate('/console/billing');
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 5000);

    const timeout = setTimeout(() => {
      toast({
        variant: 'destructive',
        title: 'Payment Pending',
        description: "We're unable to confirm your payment at the moment. Please check your billing page later for the status."
      });
      clearInterval(countdown);
      clearInterval(pollInterval);
      navigate('/console/billing');
    }, 60000);

    return () => {
      clearInterval(countdown);
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [checkoutRequestId, orderUuid, navigate, toast]);

  useMeta({
    title: 'Processing Mobile Payment',
    description: 'Your mobile payment is being securely processed. Please wait for confirmation before leaving this page.'
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="btn-ghost btn-icon" onClick={() => navigate('/console/billing')}>
          <CreditCard className="h-4 w-4" />
        </button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Processing Payment</h1>
          <p className="text-muted-foreground">Your mobile payment is being confirmed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Status
              </CardTitle>
              <CardDescription>Order ID: <code>{orderUuid}</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader className="animate-spin h-16 w-16 text-primary" />
                <p className="text-gray-700 text-base md:text-lg text-center">
                  We are securely processing your mobile payment. Please do not leave this page.
                </p>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-2 transition-all duration-1000"
                    style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">Waiting for confirmation... {secondsLeft}s remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                <li>Do not refresh the page during processing.</li>
                <li>Mobile payments may take a few seconds to confirm via the gateway.</li>
                <li>Check your billing page later if payment is not immediately confirmed.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
