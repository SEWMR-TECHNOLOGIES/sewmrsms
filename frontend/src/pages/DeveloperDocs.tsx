import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useMeta } from "@/hooks/useMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Key,
  Phone,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  BookOpen,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EndpointProps {
  method: "GET" | "POST" | "DELETE";
  path: string;
  title: string;
  description: string;
  headers?: { key: string; value: string }[];
  requestBody?: string;
  responseBody: string;
  children?: React.ReactNode;
}

const CodeBlock = ({ code, language = "json" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-foreground/5 border border-border rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-foreground/80">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const MethodBadge = ({ method }: { method: "GET" | "POST" | "DELETE" }) => {
  const colors = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <Badge variant="outline" className={cn("font-mono font-semibold", colors[method])}>
      {method}
    </Badge>
  );
};

const Endpoint = ({ method, path, title, description, headers, requestBody, responseBody, children }: EndpointProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-muted-foreground flex-1">{path}</code>
        <span className="text-foreground font-medium hidden sm:block">{title}</span>
        {isOpen ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-border space-y-4">
          <p className="text-muted-foreground">{description}</p>
          
          {headers && headers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Headers</h4>
              <CodeBlock code={headers.map(h => `${h.key}: ${h.value}`).join('\n')} language="text" />
            </div>
          )}
          
          {requestBody && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Request Body</h4>
              <CodeBlock code={requestBody} />
            </div>
          )}
          
          {children}
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Success Response (200)</h4>
            <CodeBlock code={responseBody} />
          </div>
        </div>
      )}
    </div>
  );
};

const sections = [
  { id: "authentication", title: "Authentication", icon: Key },
  { id: "phone-format", title: "Phone Format", icon: Phone },
  { id: "sender-id", title: "Sender ID", icon: Zap },
  { id: "user-endpoints", title: "User Endpoints", icon: User },
  { id: "sms-endpoints", title: "SMS Endpoints", icon: MessageSquare },
  { id: "bulk-sms", title: "Bulk SMS", icon: FileText },
  { id: "errors", title: "Error Responses", icon: AlertCircle },
  { id: "quick-reference", title: "Quick Reference", icon: BookOpen },
];

// Section Content Components
const AuthenticationSection = () => (
  <div className="space-y-6">
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Obtaining Your API Token</h3>
      <p className="text-muted-foreground mb-4">
        API tokens are generated from the <strong>SEWMR SMS Dashboard</strong>, not via API.
      </p>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
        <li>Log in to <a href="https://app.sewmrsms.co.tz" className="text-primary hover:underline">SEWMR SMS Dashboard</a></li>
        <li>Navigate to <strong>Settings → API Tokens</strong></li>
        <li>Click <strong>"Generate New Token"</strong></li>
        <li>Give your token a name (e.g., "My App Integration")</li>
        <li>Copy and securely store the token (it will only be shown once)</li>
      </ol>
    </div>

    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Using the Token</h3>
      <p className="text-muted-foreground mb-4">Include your token in all API requests:</p>
      <CodeBlock code="Authorization: Bearer your_api_token_here" language="text" />
    </div>
  </div>
);

const PhoneFormatSection = () => (
  <div className="bg-card border border-border rounded-lg p-6">
    <p className="text-muted-foreground mb-4">
      All recipient phone numbers <strong>must</strong> be Tanzanian numbers in format:
    </p>
    <CodeBlock code="255XXXXXXXXX" language="text" />
    <ul className="mt-4 space-y-2 text-muted-foreground">
      <li>• Must start with <code className="bg-muted px-1.5 py-0.5 rounded text-sm">255</code></li>
      <li>• Followed by <code className="bg-muted px-1.5 py-0.5 rounded text-sm">6</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-sm">7</code></li>
      <li>• Then 8 more digits</li>
      <li>• <strong>Example:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-sm">255712345678</code></li>
    </ul>
  </div>
);

const SenderIdSection = () => (
  <div className="bg-card border border-border rounded-lg p-6">
    <p className="text-muted-foreground mb-4">
      The <code className="bg-muted px-1.5 py-0.5 rounded text-sm">sender_id</code> field accepts <strong>either</strong>:
    </p>
    
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Format</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Example</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3 px-4 font-medium">Alias (Name)</td>
            <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded">SEWMR SMS</code></td>
            <td className="py-3 px-4 text-muted-foreground">Your registered sender name/alias</td>
          </tr>
          <tr>
            <td className="py-3 px-4 font-medium">UUID</td>
            <td className="py-3 px-4"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">550e8400-e29b-41d4-...</code></td>
            <td className="py-3 px-4 text-muted-foreground">Unique identifier from dashboard</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <p className="text-sm text-foreground">
        💡 <strong>Tip:</strong> Using the alias (e.g., <code className="bg-muted px-1.5 py-0.5 rounded">SEWMR SMS</code>) is often more readable and easier to work with.
      </p>
    </div>
  </div>
);

const UserEndpointsSection = () => (
  <div className="space-y-4">
    <Endpoint
      method="GET"
      path="/auth/me"
      title="Get Current User Info"
      description="Retrieve authenticated user's information and SMS balance."
      headers={[{ key: "Authorization", value: "Bearer your_api_token_here" }]}
      responseBody={`{
  "success": true,
  "message": "User authenticated",
  "data": {
    "id": 1,
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "255712345678",
    "remaining_sms": 500
  }
}`}
    />

    <Endpoint
      method="GET"
      path="/auth/api-tokens"
      title="List API Tokens"
      description="View all your API tokens."
      headers={[{ key: "Authorization", value: "Bearer your_api_token_here" }]}
      responseBody={`{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "My App Integration",
      "token_masked": "****-****-****-abc123",
      "created_at": "2025-01-01T10:00:00",
      "expires_at": "2025-01-31T10:00:00",
      "status": "active",
      "last_used": "2025-01-02T15:30:00"
    }
  ]
}`}
    />

    <Endpoint
      method="POST"
      path="/auth/api-tokens/{token_id}/revoke"
      title="Revoke API Token"
      description="Deactivate a token without deleting it."
      headers={[{ key: "Authorization", value: "Bearer your_api_token_here" }]}
      responseBody={`{
  "success": true,
  "message": "Token revoked successfully",
  "data": null
}`}
    />

    <Endpoint
      method="DELETE"
      path="/auth/api-tokens/{token_id}"
      title="Delete API Token"
      description="Permanently delete a token."
      headers={[{ key: "Authorization", value: "Bearer your_api_token_here" }]}
      responseBody={`{
  "success": true,
  "message": "Token deleted successfully",
  "data": null
}`}
    />
  </div>
);

const SmsEndpointsSection = () => (
  <div className="space-y-4">
    <Endpoint
      method="POST"
      path="/sms/quick-send"
      title="Quick Send SMS"
      description="Send SMS to multiple recipients with optional scheduling."
      headers={[
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer your_api_token_here" }
      ]}
      requestBody={`{
  "sender_id": "SEWMR SMS",
  "message": "Hello! Your order #12345 has been shipped.",
  "recipients": "255712345678\\n255723456789\\n255734567890",
  "schedule": false
}`}
      responseBody={`{
  "success": true,
  "message": "Sent SMS to 3 recipients. 0 errors.",
  "errors": [],
  "data": {
    "total_sent": 3,
    "total_parts_used": 3,
    "remaining_sms": 497,
    "sent_messages": [
      {
        "recipient": "255712345678",
        "sms_gateway_response": {
          "message_id": "msg_abc123",
          "status": "sent"
        }
      }
    ]
  }
}`}
    >
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Scheduled Send:</strong> Set <code className="bg-muted px-1.5 py-0.5 rounded">schedule: true</code> and include <code className="bg-muted px-1.5 py-0.5 rounded">scheduled_for</code> (format: "YYYY-MM-DD HH:MM:SS") and <code className="bg-muted px-1.5 py-0.5 rounded">schedule_name</code>.
        </p>
      </div>
    </Endpoint>

    <Endpoint
      method="POST"
      path="/sms/quick-send/group"
      title="Quick Send to Contact Group"
      description="Send personalized SMS to a contact group with placeholder support. Use placeholders like {first_name}, {last_name}, {phone}."
      headers={[
        { key: "Content-Type", value: "application/json" },
        { key: "Authorization", value: "Bearer your_api_token_here" }
      ]}
      requestBody={`{
  "sender_id": "SEWMR SMS",
  "message": "Hello {first_name}, your balance is now available!",
  "group_uuid": "grp-12345-abcdef",
  "schedule": false
}`}
      responseBody={`{
  "success": true,
  "message": "Sent SMS to 50 recipients. 2 errors.",
  "errors": [
    {"recipient": "255700000000", "error": "Invalid phone number format"}
  ],
  "data": {
    "total_sent": 50,
    "total_parts_used": 50,
    "remaining_sms": 450,
    "sent_messages": [...]
  }
}`}
    >
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-foreground mb-2">Special group_uuid Values:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li><code className="bg-muted px-1.5 py-0.5 rounded">"all"</code> - Send to all contacts</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">"none"</code> - Send to contacts without a group</li>
          <li><code className="bg-muted px-1.5 py-0.5 rounded">UUID</code> - Send to specific group</li>
        </ul>
      </div>
    </Endpoint>
  </div>
);

const BulkSmsSection = () => (
  <div className="space-y-4">
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4">Send SMS from File (Bulk Upload)</h3>
      <p className="text-muted-foreground mb-4">
        Send personalized bulk SMS using an Excel or CSV file.
      </p>
      
      <div className="flex items-center gap-2 mb-4">
        <MethodBadge method="POST" />
        <code className="text-sm font-mono text-muted-foreground">/sms/send-from-file</code>
      </div>

      <h4 className="font-semibold text-sm text-foreground mb-3">Form Data Fields</h4>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-semibold text-foreground">Field</th>
              <th className="text-left py-2 px-3 font-semibold text-foreground">Type</th>
              <th className="text-left py-2 px-3 font-semibold text-foreground">Required</th>
              <th className="text-left py-2 px-3 font-semibold text-foreground">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border">
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">sender_id</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">✅</td>
              <td className="py-2 px-3">Sender alias or UUID</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">message_template</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">✅</td>
              <td className="py-2 px-3">Message with placeholders</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">template_uuid</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">✅</td>
              <td className="py-2 px-3">Template UUID from dashboard</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">file</code></td>
              <td className="py-2 px-3">file</td>
              <td className="py-2 px-3">✅</td>
              <td className="py-2 px-3">Excel (.xlsx) or CSV file</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">schedule_flag</code></td>
              <td className="py-2 px-3">boolean</td>
              <td className="py-2 px-3">❌</td>
              <td className="py-2 px-3">Enable scheduling (default: false)</td>
            </tr>
            <tr>
              <td className="py-2 px-3"><code className="bg-muted px-1 rounded">scheduled_for</code></td>
              <td className="py-2 px-3">string</td>
              <td className="py-2 px-3">❌</td>
              <td className="py-2 px-3">Schedule datetime (if scheduling)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 className="font-semibold text-sm text-foreground mb-3">Example Request (cURL)</h4>
      <CodeBlock 
        code={`curl -X POST "https://api.sewmrsms.co.tz/api/v1/sms/send-from-file" \\
  -H "Authorization: Bearer your_api_token_here" \\
  -F "sender_id=SEWMR SMS" \\
  -F "message_template=Hello {name}, your code is {code}" \\
  -F "template_uuid=tmpl-12345-abcdef" \\
  -F "file=@contacts.xlsx" \\
  -F "schedule_flag=false"`}
        language="bash"
      />

      <h4 className="font-semibold text-sm text-foreground mt-6 mb-3">Success Response (200)</h4>
      <CodeBlock 
        code={`{
  "success": true,
  "message": "Sent 150 SMS messages. 3 errors.",
  "errors": [
    {"row": 5, "phone": "invalid", "error": "Invalid or missing phone number"}
  ],
  "data": {
    "total_sent": 150,
    "total_parts_used": 150,
    "remaining_sms": 350,
    "sent_messages": [...]
  }
}`}
      />
    </div>
  </div>
);

const ErrorsSection = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Message</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Cause</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline">400</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"sender_id is required"</code></td>
            <td className="py-3 px-4">Missing sender_id field</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline">400</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"message is required"</code></td>
            <td className="py-3 px-4">Missing message field</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline">400</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"recipients is required"</code></td>
            <td className="py-3 px-4">Missing recipients field</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">401</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"Invalid or expired API token"</code></td>
            <td className="py-3 px-4">Token is invalid, expired, or revoked</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">403</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"Insufficient SMS balance..."</code></td>
            <td className="py-3 px-4">No SMS credits remaining</td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-3 px-4"><Badge variant="outline">404</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"Sender ID not found..."</code></td>
            <td className="py-3 px-4">Invalid sender_id</td>
          </tr>
          <tr>
            <td className="py-3 px-4"><Badge variant="outline">415</Badge></td>
            <td className="py-3 px-4"><code className="text-xs">"Invalid content type..."</code></td>
            <td className="py-3 px-4">Wrong Content-Type header</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="p-4 border-t border-border">
      <h4 className="font-semibold text-sm text-foreground mb-3">Error Response Format</h4>
      <CodeBlock 
        code={`{
  "success": false,
  "message": "Error description here",
  "data": null
}`}
      />
    </div>
  </div>
);

const QuickReferenceSection = () => (
  <div className="bg-card border border-border rounded-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Endpoint</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Method</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/auth/me</code></td>
            <td className="py-3 px-4"><MethodBadge method="GET" /></td>
            <td className="py-3 px-4">Get current user info</td>
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/auth/api-tokens</code></td>
            <td className="py-3 px-4"><MethodBadge method="GET" /></td>
            <td className="py-3 px-4">List all API tokens</td>
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/auth/api-tokens/{'{id}'}/revoke</code></td>
            <td className="py-3 px-4"><MethodBadge method="POST" /></td>
            <td className="py-3 px-4">Revoke a token</td>
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/auth/api-tokens/{'{id}'}</code></td>
            <td className="py-3 px-4"><MethodBadge method="DELETE" /></td>
            <td className="py-3 px-4">Delete a token</td>
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/sms/quick-send</code></td>
            <td className="py-3 px-4"><MethodBadge method="POST" /></td>
            <td className="py-3 px-4">Send SMS to multiple recipients</td>
          </tr>
          <tr className="border-b border-border hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/sms/quick-send/group</code></td>
            <td className="py-3 px-4"><MethodBadge method="POST" /></td>
            <td className="py-3 px-4">Send personalized SMS to contact group</td>
          </tr>
          <tr className="hover:bg-muted/30 transition-colors">
            <td className="py-3 px-4"><code className="text-xs">/sms/send-from-file</code></td>
            <td className="py-3 px-4"><MethodBadge method="POST" /></td>
            <td className="py-3 px-4">Bulk SMS from Excel/CSV file</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const sectionContent: Record<string, { title: string; component: React.ReactNode }> = {
  "authentication": { title: "Authentication", component: <AuthenticationSection /> },
  "phone-format": { title: "Phone Number Format", component: <PhoneFormatSection /> },
  "sender-id": { title: "Sender ID Format", component: <SenderIdSection /> },
  "user-endpoints": { title: "User Endpoints", component: <UserEndpointsSection /> },
  "sms-endpoints": { title: "SMS Endpoints", component: <SmsEndpointsSection /> },
  "bulk-sms": { title: "Bulk SMS from File", component: <BulkSmsSection /> },
  "errors": { title: "Common Error Responses", component: <ErrorsSection /> },
  "quick-reference": { title: "Quick Reference", component: <QuickReferenceSection /> },
};

const DeveloperDocs = () => {
  useMeta({
    title: "API Documentation - SEWMR SMS",
    description: "Complete API documentation for SEWMR SMS. Learn how to integrate SMS functionality into your applications.",
  });

  const [activeSection, setActiveSection] = useState("authentication");
  const ActiveIcon = sections.find(s => s.id === activeSection)?.icon || Key;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Badge variant="secondary" className="mb-4">API Documentation</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                SEWMR SMS API
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Everything you need to integrate SMS functionality into your applications.
              </p>
              <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg w-fit">
                <span className="text-sm text-muted-foreground">Base URL:</span>
                <code className="text-sm font-mono text-primary">https://api.sewmrsms.co.tz/api/v1</code>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Sidebar Navigation */}
            <nav className="lg:sticky lg:top-24 lg:self-start space-y-1">
              <h3 className="font-semibold text-foreground mb-4 px-3">Contents</h3>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 text-left",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground font-medium shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {section.title}
                  </button>
                );
              })}
            </nav>

            {/* Main Content */}
            <div className="min-h-[600px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <ActiveIcon className="h-6 w-6 text-primary" />
                  {sectionContent[activeSection]?.title}
                </h2>
              </div>
              <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
                {sectionContent[activeSection]?.component}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeveloperDocs;
