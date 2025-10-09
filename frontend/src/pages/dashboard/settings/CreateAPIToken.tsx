import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Key, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useMeta } from '@/hooks/useMeta';

export default function CreateToken() {
  const [tokenName, setTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateToken = async () => {
    if (!tokenName.trim()) {
      toast({ title: "Error", description: "Please enter a token name", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/auth/generate-api-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName }),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedToken(data.data.access_token);
        setExpiresAt(data.data.expires_at);
        setTokenName('');
        toast({ title: "Token Generated", description: data.message , variant: 'success'});
      } else {
        toast({ title: "Error", description: data.message || "Failed to generate token", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Unable to reach the server. Try again shortly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast({ title: "Copied", description: "Token copied to clipboard" , variant: 'success'});
    }
  };

  const resetForm = () => {
    setGeneratedToken(null);
    setExpiresAt(null);
    setTokenName('');
  };

  useMeta({
    title: "Create API Token",
    description: "Generate a new API token to access your SEWMR SMS account programmatically."
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create API Token</h1>
        <p className="text-muted-foreground">
          Generate a new API token to access your account programmatically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {!generatedToken ? 'Generate New Token' : 'Token Generated'}
            </CardTitle>
            <CardDescription>
              {!generatedToken
                ? 'Create a new API token with a descriptive name'
                : 'Your API token has been created. Please copy and store it securely.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!generatedToken ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tokenName">Token Name</Label>
                  <Input
                    id="tokenName"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g., Production API, Mobile App"
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a descriptive name to help you identify this token later
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> The token will only be shown once. Copy it securely.
                  </AlertDescription>
                </Alert>

                <Button onClick={generateToken} disabled={loading || !tokenName.trim()} className="w-full">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Token...
                    </>
                  ) : (
                    'Generate Token'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This token will only be displayed once.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Your API Token</Label>
                  <div className="flex space-x-2">
                    <Input value={generatedToken} readOnly className="font-mono text-sm" />
                    <Button onClick={copyToClipboard} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expiresAt && (
                  <div className="space-y-2">
                    <Label>Expires At</Label>
                    <Badge variant="outline">
                      {new Date(expiresAt).toLocaleDateString("en-GB")} at {new Date(expiresAt).toLocaleTimeString()}
                    </Badge>
                  </div>
                )}

                <Separator />

                <div className="flex space-x-2">
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    Generate Another Token
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/console/settings/api-tokens">
                        View All Tokens
                    </Link>
                   </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Card */}
        <Card>
          <CardHeader>
            <CardTitle>Using Your API Token</CardTitle>
            <CardDescription>How to authenticate with your new API token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Authentication Header</Label>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto mt-2">
                <code>Authorization: Bearer YOUR_TOKEN_HERE</code>
              </pre>
            </div>

            <div>
              <Label>Example cURL Request</Label>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto mt-2">
                <code>{`curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \\ 
-H "Content-Type: application/json" \\ 
https://api.sewmrsms.co.tz/v1/api/sms`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
