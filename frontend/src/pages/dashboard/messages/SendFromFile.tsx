import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Users, MessageSquare, Clock, Send, UploadCloud, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { format } from 'date-fns';
import { UploadProgress } from '@/components/ui/upload-progress';

const BASE_URL = 'https://api.sewmrsms.co.tz/api/v1';

interface SenderIdOption {
  value: string;
  label: string;
}

interface TemplateOption {
  value: string;
  label: string;
  sample_message: string;
}

interface UploadResult {
  added_count: number;
  skipped_count: number;
  errors: { row: number; message: string }[];
}

export default function SendFromTemplate() {
  const { toast } = useToast();
  const [senders, setSenders] = useState<SenderIdOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [scheduleFlag, setScheduleFlag] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [hourSel, setHourSel] = useState('00');
  const [minuteSel, setMinuteSel] = useState('00');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const senderRes = await fetch(`${BASE_URL}/sender-ids`, { credentials: 'include' });
        const senderData = await senderRes.json();
        if (senderData.success && Array.isArray(senderData.data)) {
          setSenders(senderData.data.map((s: any) => ({ value: s.uuid, label: s.alias })));
        }

        const tmplRes = await fetch(`${BASE_URL}/templates`, { credentials: 'include' });
        const tmplData = await tmplRes.json();
        if (tmplData.success && Array.isArray(tmplData.data)) {
          setTemplates(tmplData.data.map((t: any) => ({
            value: t.uuid,
            label: t.name,
            sample_message: t.sample_message || ''
          })));
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Unable to load sender IDs or templates.', variant: 'destructive' });
      }
    };
    fetchData();
  }, [toast]);

  // Append template's sample message when selected
  useEffect(() => {
    if (selectedTemplate) {
      const tmpl = templates.find(t => t.value === selectedTemplate);
      if (tmpl) {
        setMessage(prev => prev ? `${prev}\n${tmpl.sample_message}` : tmpl.sample_message);
      }
    }
  }, [selectedTemplate]);

  function applyTimeToDate(baseDate: Date | null, hours: number, minutes: number) {
    const d = baseDate ? new Date(baseDate) : new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  function onTimeChange(newHour: string, newMinute: string) {
    setHourSel(newHour);
    setMinuteSel(newMinute);
    setScheduledFor(prev => applyTimeToDate(prev, Number(newHour), Number(newMinute)));
  }

  function onCalendarSelect(date: Date | undefined) {
    if (!date) return;
    if (scheduledFor) {
      const newDate = new Date(date);
      newDate.setHours(scheduledFor.getHours(), scheduledFor.getMinutes(), 0, 0);
      setScheduledFor(newDate);
    } else {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      setScheduledFor(newDate);
    }
  }

  useEffect(() => {
    if (scheduledFor) {
      setHourSel(pad(scheduledFor.getHours()));
      setMinuteSel(pad(scheduledFor.getMinutes()));
    } else {
      setHourSel('00');
      setMinuteSel('00');
    }
  }, [scheduledFor]);

  const parseBackendErrors = (errorsFromBackend: any[] | undefined) => {
    if (!Array.isArray(errorsFromBackend)) return [];
    return errorsFromBackend.map((e: any) => {
      if (typeof e === 'string') {
        const m = e.match(/^Row\s+(\d+):\s*(.+)$/i);
        if (m) return { row: Number(m[1]), message: m[2] };
        return { row: 0, message: e };
      }
      if (typeof e === 'object' && e !== null) return { row: Number(e.row || 0), message: String(e.message || JSON.stringify(e)) };
      return { row: 0, message: String(e) };
    });
  };

  const handleSendFromFile = async () => {
    if (!selectedSender || !selectedTemplate || !file) {
      toast({ title: 'Error', description: 'Sender, template, and file are required', variant: 'destructive' });
      return;
    }

    let scheduledStr: string | undefined;
    if (scheduleFlag && scheduledFor) scheduledStr = format(scheduledFor, 'yyyy-MM-dd HH:mm:ss');

    const formData = new FormData();
    formData.append('sender_id', selectedSender);
    formData.append('template_uuid', selectedTemplate);
    formData.append('message_template', message);
    formData.append('file', file);
    formData.append('schedule', String(scheduleFlag));
    if (scheduledStr) formData.append('scheduled_for', scheduledStr);

    setUploading(true);
    setUploadProgress(0);

    try {
      // simulate progress
      const progressInterval = setInterval(() => setUploadProgress(prev => Math.min(prev + 5, 90)), 150);

      const res = await fetch(`${BASE_URL}/sms/send-from-file`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Failed to send file (${res.status})`);

      const errors = parseBackendErrors(json.errors || []);
      const added = (json.data?.added_count ?? 0);
      const skipped = (json.data?.skipped_count ?? errors.length);

      setUploadResult({ added_count: added, skipped_count: skipped, errors });

      if (added > 0 && (skipped > 0 || errors.length > 0)) {
        toast({ title: 'Partial Success', description: `${added} messages sent. ${skipped} skipped.`, variant: 'success' });
      } else if (added > 0) {
        toast({ title: 'Success', description: `${added} messages sent successfully`, variant: 'success' });
      } else {
        toast({ title: 'Notice', description: json?.message || 'No messages were sent', variant: 'destructive' });
      }

      // reset
      setMessage('');
      setMessageLength(0);
      setFile(null);
      setScheduledFor(null);
      setScheduleFlag(false);
    } catch (err: any) {
      setUploadProgress(0);
      toast({ title: 'Error', description: err?.message || 'Failed to send messages', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!uploadResult?.errors.length) return;

    const csvContent = [
      'Row,Error',
      ...uploadResult.errors.map(e => `${e.row},"${e.message.replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sms-upload-errors.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send SMS from File</h1>
        <p className="text-muted-foreground">
          Note: To send messages from a file, you must have a predefined template selected.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose & Upload</CardTitle>
          <CardDescription>Fill details and upload a file with recipients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Sender ID</label>
            <SearchableSelect options={senders} value={selectedSender} onValueChange={setSelectedSender} placeholder="Select sender..." searchPlaceholder="Search sender..." className="w-full" />
          </div>

          <div>
            <label className="block mb-1 font-medium">Template</label>
            <SearchableSelect options={templates} value={selectedTemplate} onValueChange={setSelectedTemplate} placeholder="Select template..." searchPlaceholder="Search template..." className="w-full" />
          </div>

          <div>
            <label className="block mb-1 font-medium">Message</label>
            <Textarea value={message} onChange={e => { setMessage(e.target.value); setMessageLength(e.target.value.length); }} placeholder="Message content..." className="min-h-[120px]" />
            <Badge className={`mt-1 ${messageLength > 160 ? 'bg-red-600' : 'bg-gray-200'}`}>Characters: {messageLength}</Badge>
          </div>

          <div>
            <label className="block mb-1 font-medium">Upload File</label>
            <div className="flex items-center gap-2">
              <Input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} />
              {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
              <UploadCloud className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {uploading && <UploadProgress progress={uploadProgress} message="Uploading file..." />}

          <Button onClick={handleSendFromFile} disabled={uploading || !file} className="w-full flex items-center gap-2">
            {uploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {uploading ? 'Uploading...' : 'Send Messages'}
          </Button>

          {uploadResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" />Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center"><div className="text-2xl font-bold text-green-600">{uploadResult.added_count}</div><p className="text-sm text-muted-foreground">Messages Sent</p></div>
                  <div className="text-center"><div className="text-2xl font-bold text-yellow-600">{uploadResult.skipped_count}</div><p className="text-sm text-muted-foreground">Skipped</p></div>
                  <div className="text-center"><div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div><p className="text-sm text-muted-foreground">Errors</p></div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Upload Errors</h4>
                      <Button variant="outline" size="sm" onClick={downloadErrorReport}><Download className="mr-2 h-4 w-4" />Download Error Report</Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadResult.errors.slice(0, 5).map((err, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <Badge variant="destructive">Row {err.row}</Badge>
                          <span className="text-muted-foreground">{err.message}</span>
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && <p className="text-sm text-muted-foreground">And {uploadResult.errors.length - 5} more errors...</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
