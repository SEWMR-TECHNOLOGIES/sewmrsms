import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadProgress } from '@/components/ui/upload-progress';
import { useUpload } from '@/hooks/useUpload';
import { FileUpload } from '@/components/ui/file-upload';

type PaymentMethod = 'bank' | 'mobile';

export default function OrderPayment() {
  const { orderUuid } = useParams<{ orderUuid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');

  const { progress, uploadFile, resetProgress } = useUpload();

  const resetForm = () => {
    setBankName('');
    setTransactionRef('');
    setFile(null);
    setMobileNumber('');
    resetProgress();
  };
  
  const handleBankPayment = async () => {
    if (!bankName || !transactionRef || !file) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'All bank fields are required.' });
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('bank_name', bankName);
      formData.append('transaction_reference', transactionRef);
      formData.append('file', file);

      const res = await uploadFile(
        `https://api.sewmrsms.co.tz/api/v1/subscriptions/${orderUuid}/payments/bank`,
        formData
      );

      let data;
      try {
        data = await res.json();
      } catch {
        toast({ variant: 'destructive', title: 'Payment Failed', description: 'Invalid response from server' });
        return;
      }

      // Check the JSON "success" field instead of HTTP status only
      if (!data.success) {
        toast({ variant: 'destructive', title: 'Payment Failed', description: data.message || 'Bank payment failed' });
      } else {
        toast({ variant: 'success', title: 'Payment Submitted', description: data.message || 'Your bank payment is pending review' });
        resetForm();
        navigate('/console/billing');
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Network Error', description: 'Unable to reach the server' });
    } finally {
      setLoading(false);
    }
  };


  const handleMobilePayment = async () => {
    if (!mobileNumber) {
      toast({ variant: 'destructive', title: 'Missing Field', description: 'Mobile number is required' });
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`https://api.sewmrsms.co.tz/api/v1/subscriptions/${orderUuid}/payments/mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      const data = await res.json();
      if (!data.success) {
        toast({ variant: 'destructive', title: 'Payment Failed', description: data.message || 'Mobile payment failed' });
        setLoading(false);
        return;
      }

      // Reset mobile number field before navigation
      resetForm();

      // Navigate to waiting page
      navigate(`/console/billing/mobile-payment-waiting/${orderUuid}/${data.data.checkout_request_id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Unable to reach the server' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/console/billing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Complete Payment</h1>
          <p className="text-muted-foreground">Pay for your SMS order to activate credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment
              </CardTitle>
              <CardDescription>Order ID: <code>{orderUuid}</code></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Button variant={paymentMethod === 'bank' ? 'default' : 'outline'} onClick={() => setPaymentMethod('bank')}>Bank</Button>
                <Button variant={paymentMethod === 'mobile' ? 'default' : 'outline'} onClick={() => setPaymentMethod('mobile')}>Mobile</Button>
              </div>

              {paymentMethod === 'bank' && (
                <>
                  {/* Bank Payment Details Card */}
                  <Card className="mb-4">
                    <CardHeader>
                      <CardTitle>Bank Payment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Bank Name:</p>
                        <p className="font-medium">CRDB BANK</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Name:</p>
                        <p className="font-medium">SEWMR TECHNOLOGIES</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Account Number:</p>
                        <p className="font-medium">0150999894700</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bank Payment Form */}
                  <div className="space-y-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Enter bank name" />
                    </div>
                    <div>
                      <Label>Transaction Reference</Label>
                      <Input value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="Enter reference number" />
                    </div>
                    <div>
                      <Label>Upload Bank Slip</Label>
                      <FileUpload
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={0.5}
                        onFileSelect={(files) => setFile(files[0] || null)}
                        onError={(message) => toast({ variant: 'destructive', title: 'File Error', description: message })}
                      />
                      <div className="text-sm text-muted-foreground mt-2">{file ? file.name : 'No file chosen'}</div>
                    </div>

                    {loading && <UploadProgress progress={progress} message="Uploading bank slip..." />}

                    <Button onClick={handleBankPayment} disabled={loading || !file} className="w-full">
                      {loading ? <Loader className="animate-spin h-4 w-4 mr-2 inline" /> : null} Pay Now
                    </Button>
                  </div>
                </>
              )}

              {paymentMethod === 'mobile' && (
                <div className="space-y-4">
                  <div>
                    <Label>Mobile Number</Label>
                    <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="2557XXXXXXXX" />
                  </div>
                  <Button onClick={handleMobilePayment} disabled={loading} className="w-full">
                    {loading ? <Loader className="animate-spin h-4 w-4 mr-2 inline" /> : null} Pay Now
                  </Button>
                </div>
              )}
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
                <li>Bank payment requires slip upload and valid transaction reference.</li>
                <li>Mobile payment requires your mobile number in format 255XXXXXXXXX.</li>
                <li>Mobile payments are processed via gateway and will poll until successful.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
