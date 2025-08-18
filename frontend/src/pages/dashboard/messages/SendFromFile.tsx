import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Users, MessageSquare, Clock, Send, UploadCloud, PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { format } from 'date-fns';
import { FileUpload } from '@/components/ui/file-upload';
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

export default function SendFromTemplate() {
  const { toast } = useToast();
  const [senders, setSenders] = useState<SenderIdOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scheduleFlag, setScheduleFlag] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [hourSel, setHourSel] = useState<string>('00');
  const [minuteSel, setMinuteSel] = useState<string>('00');

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
  }, []);

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

  const handleSend = async () => {
    if (!selectedSender || !selectedTemplate || !message.trim() || !file) {
      toast({ title: "Error", description: "Sender, template, message, and file are required", variant: "destructive" });
      return;
    }

    // validate file
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Error', description: 'File must be CSV, XLS, or XLSX', variant: 'destructive' });
      return;
    }
    if (file.size > 0.5 * 1024 * 1024) { // 0.5MB
      toast({ title: 'Error', description: 'File size must not exceed 0.5 MB', variant: 'destructive' });
      return;
    }

    let scheduledStr: string | undefined;
    if (scheduleFlag) {
      if (!scheduledFor) {
        toast({ title: "Error", description: "Please select a scheduled date and time", variant: "destructive" });
        return;
      }
      scheduledStr = format(scheduledFor, 'yyyy-MM-dd HH:mm:ss');
    }

    const formData = new FormData();
    formData.append('sender_id', selectedSender);
    formData.append('message_template', message);
    formData.append('template_uuid', selectedTemplate);
    formData.append('file', file);
    formData.append('schedule', String(scheduleFlag));
    if (scheduledStr) formData.append('scheduled_for', scheduledStr);

    setUploading(true);
    setUploadProgress(0);

    try {
      // simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const res = await fetch(`${BASE_URL}/sms/send-from-file`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: result.message, variant: 'success' });
        setMessage('');
        setMessageLength(0);
        setFile(null);
        setScheduledFor(null);
        setScheduleFlag(false);
      } else {
        toast({ title: 'Failed', description: result.message, variant: 'destructive' });
      }
    } catch (err) {
      setUploadProgress(0);
      toast({ title: 'Error', description: 'Failed to send messages', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send SMS from File</h1>
        <p className="text-muted-foreground">Select a sender, template, type message, and upload a file with recipients.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>Fill in details to send SMS immediately or schedule it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <label className="block mb-1 font-medium">Sender ID</label>
                <SearchableSelect
                  options={senders}
                  value={selectedSender}
                  onValueChange={setSelectedSender}
                  placeholder="Select sender..."
                  searchPlaceholder="Search sender..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Template</label>
                <div className="flex items-center gap-2">
                  <SearchableSelect
                    options={templates}
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                    placeholder="Select template..."
                    searchPlaceholder="Search template..."
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => window.open('/templates/create', '_blank')}>
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Must have predefined templates to use file sending.
                </p>
              </div>

              <div>
                <label className="block mb-1 font-medium">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setMessageLength(e.target.value.length); }}
                  placeholder="Type your message here..."
                  className="min-h-[120px]"
                />
                <Badge className={`mt-1 ${messageLength > 160 ? 'bg-red-600' : 'bg-gray-200'}`}>
                  Characters: {messageLength}
                </Badge>
              </div>

              <div>
                <label className="block mb-1 font-medium">Upload File</label>
                <FileUpload
                  accept=".csv,.xls,.xlsx"
                  maxSize={0.5}
                  onFileSelect={(files) => setFile(files[0] || null)}
                  onError={(message) => toast({ variant: "destructive", title: "File Error", description: message })}
                />
                {uploading && <UploadProgress progress={uploadProgress} message="Uploading file..." />}
              </div>

              <div className="space-y-2">
                <ToggleSwitch checked={scheduleFlag} onChange={setScheduleFlag} label="Schedule Message" />
                {scheduleFlag && (
                  <Popover>
                    <PopoverTrigger>
                      <Input
                        placeholder={scheduledFor ? format(scheduledFor, 'yyyy-MM-dd HH:mm:ss') : 'Select date & time (GMT+3)'}
                        readOnly
                        className="cursor-pointer"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Calendar mode="single" selected={scheduledFor || undefined} onSelect={onCalendarSelect} />
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Time (GMT+3)</div>
                          <div className="flex gap-2 mt-1">
                            <SearchableSelect options={hourOptions} value={hourSel} onValueChange={(v) => onTimeChange(v, minuteSel)} className="flex-1" placeholder="                            Hour" />
                            <SearchableSelect options={minuteOptions} value={minuteSel} onValueChange={(v) => onTimeChange(hourSel, v)} className="flex-1" placeholder="Minute" />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              <Button
                onClick={handleSend}
                disabled={uploading}
                className="flex items-center gap-2 w-full"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {scheduleFlag ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {scheduleFlag ? 'Schedule Message' : 'Send Now'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSender && (
                <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{senders.find(s => s.value === selectedSender)?.label}</span>
                </div>
              )}
              <div className="border rounded-lg p-4 bg-card mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Message</span>
                </div>
                <p className="text-sm text-muted-foreground min-h-[60px]">{message || 'Your message will appear here...'}</p>
                {scheduleFlag && scheduledFor && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{format(scheduledFor, 'yyyy-MM-dd HH:mm:ss')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

