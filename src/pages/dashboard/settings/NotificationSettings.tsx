import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Save, Loader2, Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeta } from "@/hooks/useMeta";

export default function NotificationSettings() {
  const { toast } = useToast();
  const [outageEnabled, setOutageEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/get-outage-notification", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setOutageEnabled(data.data?.sms_enabled ?? false);
        }
      } catch {
        // Silent fail - default to false
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("https://api.sewmrsms.co.tz/api/v1/auth/set-outage-notification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sms_enabled: outageEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Saved", description: "Notification preferences updated.", variant: "success" });
      } else {
        toast({ title: "Error", description: data.message || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  useMeta({ title: "Notification Settings", description: "Manage your notification preferences for SEWMR SMS." });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">Configure how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Outage Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <Label className="text-sm font-medium">Service Outage Alerts</Label>
                <p className="text-xs text-muted-foreground">Get notified via SMS when there are service disruptions</p>
              </div>
            </div>
            <Switch checked={outageEnabled} onCheckedChange={setOutageEnabled} />
          </div>

          <Separator />

          {/* Email notifications - informational */}
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Payment receipts and account alerts via email</p>
              </div>
            </div>
            <Switch checked disabled />
          </div>

          <Separator />

          {/* SMS delivery reports */}
          <div className="flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <MessageSquare className="h-5 w-5 text-success" />
              </div>
              <div>
                <Label className="text-sm font-medium">Delivery Report Callbacks</Label>
                <p className="text-xs text-muted-foreground">Webhook callbacks for message delivery status</p>
              </div>
            </div>
            <Switch checked disabled />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
