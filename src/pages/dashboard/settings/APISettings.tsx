import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, BookOpen, ExternalLink, Shield, Code } from "lucide-react";
import { Link } from "react-router-dom";
import { useMeta } from "@/hooks/useMeta";
import { useAuth } from "@/components/AuthGuard";

export default function APISettings() {
  const { user } = useAuth();

  useMeta({ title: "API Settings", description: "Manage your SEWMR SMS API integration settings." });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
        <p className="text-muted-foreground">Configure your API access for programmatic SMS sending</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">API Tokens</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Create and manage your API authentication tokens</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/console/settings/api-tokens">Manage Tokens</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Read the full API documentation and integration guide</p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/developers/docs">View Docs <ExternalLink className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Security</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Review your API security settings and best practices</p>
            <Button size="sm" variant="outline" className="w-full" disabled>Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      {/* API Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Your API connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Base URL</label>
            <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm flex items-center justify-between">
              <span>https://api.sewmrsms.co.tz/api/v1</span>
              <Badge variant="default">Production</Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Account UUID</label>
            <div className="mt-1 p-3 rounded-lg bg-muted font-mono text-sm">
              {user?.uuid ?? "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Quick Start</CardTitle>
          <CardDescription>Send your first SMS via the API</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 rounded-lg bg-muted overflow-x-auto text-sm font-mono">
{`curl -X POST https://api.sewmrsms.co.tz/api/v1/sms/send \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sender_id": "YOUR_SENDER",
    "phone": "255712345678",
    "message": "Hello from SEWMR SMS!"
  }'`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
