import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { useMeta } from '@/hooks/useMeta';

export default function OutageNotificationSettings() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notifyBeforeMessages, setNotifyBeforeMessages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // NEW
  const { toast } = useToast();

  // Fetch existing settings from backend
  const fetchSettings = async () => {
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/get-outage-notification', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPhone(data.data.phone || '');
        setEmail(data.data.email || '');
        setNotifyBeforeMessages(data.data.notify_before_messages || 1);
      }
    } catch (err) {
      console.error('Error fetching outage notification settings:', err);
      toast({ title: 'Error', description: 'Failed to fetch settings', variant: 'destructive' });
    } finally {
      setInitialLoading(false); // STOP loader
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save or update settings
  const saveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/set-outage-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phone.trim() || null,
          email: email.trim() || null,
          notify_before_messages: notifyBeforeMessages,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Success', description: data.message, variant: 'success' });
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Network Error', description: 'Unable to reach server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  useMeta({
    title: "Outage Notification Settings",
    description: "Configure how and when you want to be notified before your SMS balance runs out."
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Outage Notification Settings</h1>
        <p className="text-muted-foreground">
          Set when and how you want to be notified before your SMS balance runs out.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            {!phone && !email
              ? 'No settings found. Fill in your details below (optional).'
              : 'Update your existing preferences. Leave blank to use account defaults.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {initialLoading && <Loader overlay />} {/* NEW */}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 2557XXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notifyBeforeMessages">Notify Before Messages</Label>
            <Input
              id="notifyBeforeMessages"
              type="number"
              value={notifyBeforeMessages}
              onChange={(e) => setNotifyBeforeMessages(Number(e.target.value))}
              min={1}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Notifications will be sent to the phone and email you provide. If left blank, your account phone/email will be used.
            </AlertDescription>
          </Alert>

          <Separator />

          <Button onClick={saveSettings} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
