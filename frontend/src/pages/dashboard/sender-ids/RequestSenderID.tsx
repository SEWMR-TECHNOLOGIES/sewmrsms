import React, { useState } from 'react';
import { ArrowLeft, Shield, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function RequestSenderID() {
  const [formData, setFormData] = useState({
    sender_id: '',
    business_name: '',
    organization: '',
    sample_message: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSenderIdChange = (value: string) => {
    // Only allow alphanumeric characters and limit to 11 characters
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 11) {
      handleInputChange('sender_id', cleaned);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sender_id || !formData.business_name || !formData.organization || !formData.sample_message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.sender_id.length < 3) {
      toast({
        title: "Invalid Sender ID",
        description: "Sender ID must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to request a sender ID",
          variant: "destructive",
        });
        return;
      }

      // First, submit to your API
      const apiResponse = await fetch('https://sewmrsmsapi.sewmrtechnologies.com/sender-id-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: formData.sender_id,
          business_name: formData.business_name,
          organization: formData.organization,
          sample_message: formData.sample_message,
          user_id: user.id,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to submit sender ID request to API');
      }

      // Then save to Supabase database
      const { error } = await supabase
        .from('sender_ids')
        .insert({
          user_id: user.id,
          sender_id: formData.sender_id,
          business_name: formData.business_name,
          organization: formData.organization,
          sample_message: formData.sample_message,
          status: 'pending',
          networks: [],
        });

      if (error) throw error;

      toast({
        title: "Request submitted successfully!",
        description: "Your sender ID request has been submitted for review. You'll be notified once it's processed.",
      });

      navigate('/dashboard/sender-ids');

    } catch (error) {
      console.error('Error submitting sender ID request:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/dashboard/sender-ids')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Request Sender ID</h1>
          <p className="text-muted-foreground">
            Submit your sender ID request for approval
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sender ID Information
              </CardTitle>
              <CardDescription>
                Provide the required information for your sender ID request. All fields are mandatory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sender_id">
                    Sender ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sender_id"
                    value={formData.sender_id}
                    onChange={(e) => handleSenderIdChange(e.target.value)}
                    placeholder="YOURCOMPANY"
                    maxLength={11}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum 11 characters, alphanumeric only. This will appear as the sender of your SMS messages.
                  </p>
                  {formData.sender_id && (
                    <p className="text-sm text-primary">
                      Characters used: {formData.sender_id.length}/11
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Your Business Name Ltd"
                  />
                  <p className="text-sm text-muted-foreground">
                    The legal name of your business or organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">
                    Organization <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Your Organization Name"
                  />
                  <p className="text-sm text-muted-foreground">
                    The organization or company requesting the sender ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_message">
                    Sample Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="sample_message"
                    value={formData.sample_message}
                    onChange={(e) => handleInputChange('sample_message', e.target.value)}
                    placeholder="Hello, this is a sample message from our company. We will use this sender ID for customer notifications and alerts."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a sample of the type of messages you'll be sending. This helps with approval.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Approval Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Review by carrier networks</li>
                  <li>• Compliance verification</li>
                  <li>• Business validation</li>
                  <li>• Network propagation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Timeline</h4>
                <p className="text-sm text-muted-foreground">
                  Approval typically takes 3-5 business days, but can vary depending on the network requirements.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Sender ID Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 3-11 characters maximum</li>
                  <li>• Alphanumeric only</li>
                  <li>• No special characters</li>
                  <li>• Should represent your brand</li>
                  <li>• Must be business-related</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}