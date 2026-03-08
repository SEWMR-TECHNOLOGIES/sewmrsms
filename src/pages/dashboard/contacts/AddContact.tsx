import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { UserPlus, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { UploadProgress } from '@/components/ui/upload-progress';
import { useMeta } from '@/hooks/useMeta';

interface ContactGroup {
  uuid: string;
  name: string;
  contact_count: number;
}

interface UploadResult {
  added_count: number;
  skipped_count: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

const API_BASE = 'https://api.sewmrsms.co.tz/api/v1/contacts';

export default function AddContacts() {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('none');
  const [contactsText, setContactsText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  // Fetch contact groups from backend
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${API_BASE}/groups`, {
          method: 'GET',
          credentials: 'include', 
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          // If backend returns non-200, try to read message
          const text = await res.text().catch(() => 'Failed to load groups');
          toast({
            title: 'Error',
            description: `Failed to load contact groups: ${text}`,
            variant: 'destructive',
          });
          return;
        }

        const json = await res.json();

        // backend returns { success: True, message, data: [...] }
        const data = Array.isArray(json?.data) ? json.data : [];
        const mapped: ContactGroup[] = data.map((g: any) => ({
          uuid: g.uuid,
          name: g.name,
          contact_count: Number(g.contact_count || 0),
        }));
        setGroups(mapped);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load contact groups',
          variant: 'destructive',
        });
      }
    };

    fetchGroups();
  }, [toast]);

  // Build options for SearchableSelect (include 'No Group' option)
  const groupOptions: SearchableSelectOption[] = [
    { value: 'none', label: 'No Group', description: 'Do not assign to any group' },
    ...groups.map(g => ({
      value: g.uuid,
      label: g.name,
      description: `${g.contact_count} contacts`,
    })),
  ];

  const parseBackendErrors = (errorsFromBackend: any[] | undefined) => {
    if (!Array.isArray(errorsFromBackend)) return [];
    return errorsFromBackend.map((e: any) => {
      // Backend returns strings like "Row 3: Invalid phone '...'"
      if (typeof e === 'string') {
        const m = e.match(/^Row\s+(\d+):\s*(.+)$/i);
        if (m) {
          return { row: Number(m[1]), message: m[2] };
        } else {
          return { row: 0, message: e };
        }
      }
      // or object form
      if (typeof e === 'object' && e !== null) {
        return { row: Number(e.row || 0), message: String(e.message || JSON.stringify(e)) };
      }
      return { row: 0, message: String(e) };
    });
  };

  const handleTextSubmit = async () => {
    if (!contactsText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter contact information',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const url = `${API_BASE}/add-contacts`;
      const payload = {
        contact_group_uuid: selectedGroup,
        contacts_text: contactsText,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = json?.message || json?.detail || `Failed to add contacts (${response.status})`;
        throw new Error(msg);
      }

      // Backend sometimes returns success:false with 200
      if (json && json.success === false) {
        const errorsList = parseBackendErrors(json.errors || []);
        setUploadResult({
          added_count: (json.data && json.data.added_count) || 0,
          skipped_count: (json.data && json.data.skipped_count) || (errorsList.length || 0),
          errors: errorsList,
        });
        toast({
          title: 'Submission failed',
          description: json.message || 'Failed to add contacts',
          variant: 'destructive',
        });
        return;
      }

      // success path
      const added = (json.data && json.data.added_count) ?? json.added_count ?? 0;
      const skipped = (json.data && json.data.skipped_count) ?? json.skipped_count ?? 0;
      const errors = parseBackendErrors(json.errors || []);

      setUploadResult({
        added_count: Number(added),
        skipped_count: Number(skipped),
        errors,
      });

      setContactsText('');

      // New logic: clearer toast when some items were skipped
      if (Number(added) > 0 && (Number(skipped) > 0 || errors.length > 0)) {
        const skipCount = Number(skipped) > 0 ? Number(skipped) : errors.length;
        toast({
          title: 'Partial success',
          description: `${added} contacts added. ${skipCount} skipped due to errors.`,
          variant: 'success',
        });
      } else if (Number(added) > 0) {
        toast({
          title: 'Success',
          description: `${added} contacts added successfully`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Notice',
          description: json?.message || 'No contacts were added',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 150);

      const url = `${API_BASE}/add-contacts`;
      const formData = new FormData();
      formData.append('contact_group_uuid', selectedGroup);
      formData.append('file', selectedFile);

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = json?.message || `Failed to upload file (${response.status})`;
        throw new Error(msg);
      }

      if (json && json.success === false) {
        const errorsList = parseBackendErrors(json.errors || []);
        setUploadResult({
          added_count: (json.data && json.data.added_count) || 0,
          skipped_count: (json.data && json.data.skipped_count) || (errorsList.length || 0),
          errors: errorsList,
        });
        toast({
          title: 'Submission failed',
          description: json.message || 'Failed to upload file',
          variant: 'destructive',
        });
        return;
      }

      // success
      const added = (json.data && json.data.added_count) ?? json.added_count ?? 0;
      const skipped = (json.data && json.data.skipped_count) ?? json.skipped_count ?? 0;
      const errors = parseBackendErrors(json.errors || []);

      setUploadResult({
        added_count: Number(added),
        skipped_count: Number(skipped),
        errors,
      });

      setSelectedFile(null);

      // New logic: clearer toast when some items were skipped
      if (Number(added) > 0 && (Number(skipped) > 0 || errors.length > 0)) {
        const skipCount = Number(skipped) > 0 ? Number(skipped) : errors.length;
        toast({
          title: 'Partial success',
          description: `${added} contacts added. ${skipCount} skipped due to errors.`,
          variant: 'success',
        });
      } else if (Number(added) > 0) {
        toast({
          title: 'Success',
          description: `${added} contacts added successfully`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Notice',
          description: json?.message || 'No contacts were added',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!uploadResult?.errors.length) return;

    const csvContent = [
      'Row,Error',
      ...uploadResult.errors.map(error => `${error.row},"${error.message.replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contact-upload-errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  useMeta({
    title: 'Add Contacts',
    description: 'Add contacts manually or via file upload. Organize them into groups and view upload results with errors highlighted.'
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Contacts</h1>
        <p className="text-muted-foreground">
          Import contacts via text input or file upload.
        </p>
      </div>

      <Tabs defaultValue="text" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Text Input
          </TabsTrigger>
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
        </TabsList>

        {/* Text Area Input */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Manual Contact Entry
              </CardTitle>
              <CardDescription>
                Paste contact information in a structured format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactGroup">Contact Group (Optional)</Label>

                {/* Searchable Select in place of normal Select */}
                <SearchableSelect
                  options={groupOptions}
                  value={selectedGroup}
                  onValueChange={(val: string) => setSelectedGroup(val)}
                  placeholder="Select a group or leave blank"
                  searchPlaceholder="Search groups..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactsText">Contact Information</Label>
                <Textarea
                  id="contactsText"
                  value={contactsText}
                  onChange={(e) => setContactsText(e.target.value)}
                  placeholder={`Enter contact information in this format:
John Doe, 2551234567890, john@example.com
Jane Smith, 2550987654321, jane@example.com
Bob Johnson, 2551122334455, bob@example.com`}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Format: Name, Phone, Email (one contact per line)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The system will automatically parse and validate each contact entry. 
                  Invalid entries will be skipped and reported in the results.
                </AlertDescription>
              </Alert>

              <Button onClick={handleTextSubmit} disabled={uploading || !contactsText.trim()} className="w-full">
                {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <UserPlus className="h-4 w-4 mr-2" />} {uploading ? 'Processing...' : 'Add Contacts'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* File Upload */}
        <TabsContent value="file" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload contacts from CSV, XLS, or XLSX files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fileContactGroup">Contact Group (Required)</Label>

                {/* Searchable Select for file tab */}
                <SearchableSelect
                  options={groupOptions}
                  value={selectedGroup}
                  onValueChange={(val: string) => setSelectedGroup(val)}
                  placeholder="Select a contact group"
                  searchPlaceholder="Search groups..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Upload File</Label>
                <FileUpload accept=".csv,.xls,.xlsx" maxSize={10} onFileSelect={(files) => setSelectedFile(files[0] || null)} onError={(message) => toast({ variant: "destructive", title: "File Error", description: message })} />
                <p className="text-sm text-muted-foreground">
                  Supported formats: CSV, XLS, XLSX (max 10MB)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  File should contain columns: Name, Phone, Email. 
                  The system will attempt to parse CSV first, then XLS, then XLSX formats.
                </AlertDescription>
              </Alert>

              {uploading && <UploadProgress progress={uploadProgress} message="Uploading file..." />}

              <Button onClick={handleFileSubmit} disabled={uploading || !selectedFile} className="w-full">
                {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Upload className="h-4 w-4 mr-2" />} {uploading ? 'Uploading...' : 'Upload File'}
              </Button>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadResult.added_count}
                </div>
                <p className="text-sm text-muted-foreground">Contacts Added</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {uploadResult.skipped_count}
                </div>
                <p className="text-sm text-muted-foreground">Contacts Skipped</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadResult.errors.length}
                </div>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Upload Errors</h4>
                  <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Badge variant="destructive">Row {error.row}</Badge>
                      <span className="text-muted-foreground">{error.message}</span>
                    </div>
                  ))}
                  {uploadResult.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      And {uploadResult.errors.length - 5} more errors...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
