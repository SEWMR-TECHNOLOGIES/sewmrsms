import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MobilePaymentWaiting() {
  const { orderUuid, checkoutRequestId } = useParams<{ orderUuid: string; checkoutRequestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    // Countdown timer
    const countdown = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    // Polling payment status every 5 seconds
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
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 5000);

    // Timeout after 60 seconds
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md text-center p-6 shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl font-semibold">Processing Your Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Loader className="animate-spin h-16 w-16 mx-auto text-primary" />
          <p className="text-gray-700 text-base md:text-lg">
            We are securely processing your mobile payment.<br/>
            Please do not leave this page.
          </p>
          <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-2 transition-all duration-1000"
              style={{ width: `${((60 - secondsLeft) / 60) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">Waiting for confirmation... {secondsLeft}s remaining</p>
        </CardContent>
      </Card>
    </div>
  );
}
