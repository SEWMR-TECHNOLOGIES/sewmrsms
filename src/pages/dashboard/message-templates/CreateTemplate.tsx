import React, { useState } from 'react';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useMeta } from '@/hooks/useMeta';

export default function CreateTemplate() {
  const [formData, setFormData] = useState({
    name: '',
    sample_message: '',
    column_count: '',
  });
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sample_message || !formData.column_count) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          sample_message: formData.sample_message,
          column_count: parseInt(formData.column_count, 10),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ variant: 'success', title: 'Template created', description: data.message });
        navigate('/console/templates');
      } else {
        toast({ variant: 'destructive', title: 'Failed', description: data.message || 'Unable to create template' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Network Error', description: 'Unable to reach the server. Try again shortly.' });
    } finally {
      setLoading(false);
    }
  };

  useMeta({
    title: 'Create SMS Template',
    description: 'Define reusable SMS templates with placeholders for dynamic data like {name} or {order_id}.'
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/console/templates')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
          <p className="text-muted-foreground">Define reusable SMS message structures with placeholders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Template Information
              </CardTitle>
              <CardDescription>Fill out the fields below to create your SMS template</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Order Confirmation"
                    maxLength={255}
                  />
                  <p className="text-sm text-muted-foreground">1–255 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_message">Sample Message <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="sample_message"
                    value={formData.sample_message}
                    onChange={(e) => handleInputChange('sample_message', e.target.value)}
                    placeholder="Dear {name}, your order #{order_id} has been confirmed."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Use placeholders like <code>{'{name}'}</code> or <code>{'{date}'}</code> for dynamic data
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="column_count">Number of Columns <span className="text-destructive">*</span></Label>
                  <Input
                    id="column_count"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.column_count}
                    onChange={(e) => handleInputChange('column_count', e.target.value)}
                    placeholder="3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Specify how many placeholders (dynamic fields) your template uses
                  </p>
                  <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                    Important: Always include a column for the phone number.  
                    Even if it does not appear in your sample message, it is required to send SMS to the right recipient.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Panels */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What is a Template?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A template is a predefined SMS message structure with placeholders for dynamic data.  
                For example, <code>{"{name}"}</code> or <code>{"{order_id}"}</code> can be replaced when sending messages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Create</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Enter a descriptive template name</li>
                <li>Write a sample message using placeholders</li>
                <li>Specify the number of columns (dynamic fields)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Example</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm"><strong>Sample Message:</strong> Dear {"{name}"}, your order #{"{order_id}"} has been confirmed.</p>
              <p className="text-sm"><strong>Columns:</strong> 3</p>
              <ul className="text-sm text-muted-foreground list-disc pl-4 mt-2">
                <li><strong>Column 1:</strong> name (customer name)</li>
                <li><strong>Column 2:</strong> order_id (unique order number)</li>
                <li><strong>Column 3:</strong> phone (recipient’s phone number)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
