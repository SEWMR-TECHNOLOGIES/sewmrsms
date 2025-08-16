import React, { useState, useRef } from 'react';
import { ArrowLeft, Shield, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE = 524288; // 0.5 MB

export default function RequestSenderID() {
  const [formData, setFormData] = useState({
    sender_id: '',
    organization: '',
    sample_message: '',
  });
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Prefill values for student mode
  const STUDENT_SENDER_ID = 'EasyTextAPI';
  const STUDENT_ORGANIZATION = 'SEWMR Technologies';
  const STUDENT_SAMPLE_MESSAGE =
    'Hello, this is a test message from EasyTextAPI for your project integration.';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSenderIdChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
    if (cleaned.length <= 11) handleInputChange('sender_id', cleaned);
  };

  const toggleStudent = () => {
    if (!isStudent) {
      // Entering student mode: prefill and disable fields visually via state
      setFormData({
        sender_id: STUDENT_SENDER_ID,
        organization: STUDENT_ORGANIZATION,
        sample_message: STUDENT_SAMPLE_MESSAGE,
      });
    } else {
      // Leaving student mode: clear previously prefills (keep user's typed values empty)
      setFormData({
        sender_id: '',
        organization: '',
        sample_message: '',
      });
      setFileName(null);
      if (fileRef.current) fileRef.current.value = '';
    }
    setIsStudent(prev => !prev);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFileName(null);
      return;
    }
    // Validate type and size immediately for quick feedback
    if (f.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Only PDF files are allowed.',
      });
      e.target.value = '';
      setFileName(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'File size must be less than 0.5 MB.',
      });
      e.target.value = '';
      setFileName(null);
      return;
    }
    setFileName(f.name);
  };

  const submitStudent = async (file: File) => {
    const fd = new FormData();
    fd.append('is_student_request', 'true');
    fd.append('file', file);

    const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sender-ids/request/student', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });

    return res;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Student flow
    if (isStudent) {
      const chosenFile = fileRef.current?.files?.[0];
      if (!chosenFile) {
        toast({
          variant: 'destructive',
          title: 'Missing student ID',
          description: 'Please upload your student ID as a PDF.',
        });
        return;
      }

      setLoading(true);
      try {
        const res = await submitStudent(chosenFile);
        if (!res.ok) {
          let errMsg = 'Unable to submit student request';
          try {
            const json = await res.json();
            errMsg = json?.detail || json?.message || errMsg;
          } catch {}
          toast({
            variant: 'destructive',
            title: 'Submission failed',
            description: errMsg,
          });
        } else {
          const data = await res.json();
          toast({
            variant: 'success',
            title: 'We received your student request',
            description: data?.message || 'Your student sender ID request was submitted.',
          });
          navigate('/console/sender-ids');
        }
      } catch (err) {
        console.error(err);
        toast({
          variant: 'destructive',
          title: 'Network error',
          description: 'Unable to reach the server. Try again shortly.',
        });
      } finally {
        setLoading(false);
      }

      return;
    }

    // Non-student flow remains exactly as before
    if (!formData.sender_id || !formData.organization || !formData.sample_message) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (formData.sender_id.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Invalid Sender ID',
        description: 'Sender ID must be at least 3 characters long',
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('https://api.sewmrsms.co.tz/api/v1/sender-ids/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          alias: formData.sender_id,
          company_name: formData.organization,
          sample_message: formData.sample_message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          variant: 'success',
          title: 'Request submitted successfully',
          description: data.message,
        });
        navigate('/console/sender-ids');
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission failed',
          description: data.message || 'Unable to submit request',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Network error',
        description: 'Unable to reach the server. Try again shortly.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/console/sender-ids')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Request Sender ID</h1>
          <p className="text-muted-foreground">Submit your sender ID request for approval</p>
        </div>
      </div>

      {/* Student toggle — custom styled, not default checkbox */}
      <div className="flex items-center gap-3">
        <div
          role="button"
          onClick={toggleStudent}
          className={`inline-flex items-center cursor-pointer select-none rounded-full px-3 py-1 border ${
            isStudent ? 'bg-primary/10 border-primary' : 'bg-muted/10 border-border'
          }`}
        >
          <div
            className={`mr-3 inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform ${
              isStudent ? 'bg-primary text-white' : 'bg-white text-muted-foreground'
            }`}
            aria-hidden
          >
            {isStudent ? 'S' : 'U'}
          </div>
          <div className="text-sm">
            <div className="font-medium">{isStudent ? 'Student mode' : 'Standard request'}</div>
            <div className="text-xs text-muted-foreground">Click to toggle student request</div>
          </div>
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
                    disabled={isStudent}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum 11 characters, alphanumeric only. This will appear as the sender of your SMS messages.
                  </p>
                  {formData.sender_id && (
                    <p className="text-sm text-primary">Characters used: {formData.sender_id.length}/11</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">
                    Organization / Company <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Your Organization Name"
                    disabled={isStudent}
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
                    disabled={isStudent}
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a sample of the type of messages you'll be sending. This helps with approval.
                  </p>
                </div>

                {/* Student file upload appears only in student mode */}
                {isStudent && (
                  <div className="space-y-2">
                    <Label htmlFor="student_id_file">Upload Student ID (PDF)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileRef}
                        id="student_id_file"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                      >
                        {fileName ? 'Change file' : 'Choose file'}
                      </Button>
                      <div className="text-sm text-muted-foreground">{fileName ?? 'No file chosen'}</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload a PDF of your student ID. Max size 0.5 MB.
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
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
          {/* About EasyTextAPI - only shown in student mode */}
          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About EasyTextAPI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  EasyTextAPI is the default sender ID we provide to students. It allows you to send test or project messages through our system without needing your own business-approved sender ID. Think of it as a sandbox or trial sender ID just for student use. Once your request is approved, you can immediately start testing or integrating SMS functionality for your project.
                </p>
                <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                  <li>• It’s pre-configured for student use.</li>
                  <li>• No setup required on your side.</li>
                  <li>• Messages will come from EasyTextAPI as the sender ID.</li>
                  <li>• It’s temporary for academic/testing purposes and doesn’t require approval like a normal business sender ID.</li>
                </ul>
              </CardContent>
            </Card>
          )}

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
