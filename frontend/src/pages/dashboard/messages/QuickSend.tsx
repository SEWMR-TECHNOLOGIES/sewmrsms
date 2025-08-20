import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Users, MessageSquare, Clock, Send, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ToggleSwitch } from '@/components/ui/toggle-switch';

const BASE_URL = 'https://api.sewmrsms.co.tz/api/v1';

interface SenderIdOption {
  value: string;
  label: string;
}

interface ContactGroup {
  value: string;
  label: string;
  count: number;
}

export default function QuickSend() {
  const { toast } = useToast();
  const [senders, setSenders] = useState<SenderIdOption[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [selectedSender, setSelectedSender] = useState<string>('');
  const [recipientsText, setRecipientsText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [message, setMessage] = useState('');
  const [messageLength, setMessageLength] = useState(0);
  const [scheduleFlag, setScheduleFlag] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'manual' | 'group'>('manual');
  const [scheduleName, setScheduleName] = useState<string>('');

  const [manualCount, setManualCount] = useState<number>(0);
  const [lastInvalidToastCount, setLastInvalidToastCount] = useState<number>(0);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const [hourSel, setHourSel] = useState<string>('00');
  const [minuteSel, setMinuteSel] = useState<string>('00');
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({ value: pad(i), label: pad(i) }));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sender IDs
        const senderRes = await fetch(`${BASE_URL}/sender-ids`, { credentials: 'include' });
        const senderData = await senderRes.json();
        if (senderData.success && Array.isArray(senderData.data)) {
          setSenders(senderData.data.map((s: any) => ({
            value: s.uuid,
            label: s.alias
          })));
        }

        // Fetch grouped contacts
        const groupRes = await fetch(`${BASE_URL}/contacts/grouped`, { credentials: 'include' });
        const groupData = await groupRes.json();
        if (groupData.success && groupData.data) {
          const groups: ContactGroup[] = [];
          for (const key in groupData.data) {
            const g = groupData.data[key];
            groups.push({
              value: key,
              label: g.group_name,
              count: g.count
            });
          }
          setContactGroups(groups);
        }
      } catch (err) {
        toast({
          title: 'Error fetching data',
          description: 'Unable to load sender IDs or contact groups.',
          variant: 'destructive'
        });
      }
    };

    fetchData();
  }, []);

  const contactGroupOptions = contactGroups.map(g => ({
    value: g.value,
    label: g.label,
    description: `${g.count.toLocaleString()} contacts`,
  }));

  function applyTimeToDate(baseDate: Date | null, hours: number, minutes: number, seconds: number): Date {
    const d = baseDate ? new Date(baseDate) : new Date();
    d.setHours(hours, minutes, seconds, 0);
    return d;
  }

  function onTimeChange(newHour: string, newMinute: string) {
    setHourSel(newHour);
    setMinuteSel(newMinute);
    setScheduledFor(prev => applyTimeToDate(prev, Number(newHour), Number(newMinute), 0));
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

  const GSM_7BIT_BASIC =
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const GSM_7BIT_EXTENDED = "^{}\\[~]|€";

  function countGsm7(msg: string): number | null {
    let count = 0;
    for (const ch of msg) {
      if (GSM_7BIT_BASIC.includes(ch)) count++;
      else if (GSM_7BIT_EXTENDED.includes(ch)) count += 2;
      else return null;
    }
    return count;
  }

  function getSmsParts(msg: string) {
    const septets = countGsm7(msg);
    if (septets !== null) {
      if (septets <= 160) return { parts: 1, perPart: 160, encoding: "GSM-7" };
      return { parts: Math.ceil(septets / 153), perPart: 153, encoding: "GSM-7" };
    } else {
      const length = msg.length;
      if (length <= 70) return { parts: 1, perPart: 70, encoding: "UCS-2" };
      return { parts: Math.ceil(length / 67), perPart: 67, encoding: "UCS-2" };
    }
  }

  const validTzPhone = (s: string) => {
    const normalized = s.replace(/\s+/g, '');
    return /^255[67]\d{8}$/.test(normalized);
  };

  const [invalidLines, setInvalidLines] = useState<string[]>([]);
  
  const handleRecipientsTextChange = (text: string) => {
    setRecipientsText(text);
  
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const valid = lines.filter(line => validTzPhone(line));
    const invalid = lines.filter(line => !validTzPhone(line));
  
    setManualCount(valid.length);
    setInvalidLines(invalid);
  
    if (invalid.length > 0 && invalid.length !== lastInvalidToastCount) {
      toast({
        title: 'Invalid number(s)',
        description: `${invalid.length} invalid line(s) detected. They will not be counted.`,
        variant: 'destructive',
      });
      setLastInvalidToastCount(invalid.length);
    }
  
    if (invalid.length === 0 && lastInvalidToastCount !== 0) {
      setLastInvalidToastCount(0);
    }
  };

  const handleSend = async () => {
    if (!selectedSender || !message.trim() ||
      (recipientMode === 'manual' && !recipientsText.trim()) ||
      (recipientMode === 'group' && !selectedGroup)) {
      toast({ title: "Error", description: "Sender, message, and recipients are required", variant: "destructive" });
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
    
    if (recipientMode === 'manual' && manualCount === 0) {
      toast({
        title: 'Error',
        description: 'No valid recipients in manual mode. Please correct the numbers.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const endpoint = recipientMode === 'group' 
        ? `${BASE_URL}/sms/quick-send/group` 
        : `${BASE_URL}/sms/quick-send`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({
          sender_id: selectedSender,
          message,
          recipients: recipientMode === 'manual' ? recipientsText : undefined,
          group_uuid: recipientMode === 'group' ? selectedGroup : undefined,
          schedule: scheduleFlag,
          scheduled_for: scheduledStr,
          schedule_name: scheduleFlag ? scheduleName : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "success" });
        setRecipientsText('');
        setSelectedGroup('');
        setMessage('');
        setMessageLength(0);
        setScheduledFor(null);
        setScheduleFlag(false);
        setManualCount(0);
        setLastInvalidToastCount(0);
      } else {
        toast({ title: "Partial/Failed", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send SMS. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Selected group object for preview & cost
  const selectedGroupObj = contactGroups.find(g => g.value === selectedGroup);

  // Derived values: parts, recipientsCount, totalCredits
  const smsPartsInfo = getSmsParts(message);
  const partsCount = smsPartsInfo.parts;
  const recipientsCount = recipientMode === 'group'
    ? (selectedGroupObj ? selectedGroupObj.count : 0)
    : manualCount;
  const totalCredits = recipientsCount * partsCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quick Send</h1>
        <p className="text-muted-foreground">Send SMS messages instantly to your recipients.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Form */}
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
                <label className="block mb-1 font-medium">Recipients</label> {/* New label above tabs */}
                <Tabs defaultValue="manual" className="space-y-3" onValueChange={(v) => setRecipientMode(v as 'manual' | 'group')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="group">Contact Group</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual">
                    <Textarea
                      value={recipientsText}
                      onChange={(e) => handleRecipientsTextChange(e.target.value)}
                      placeholder={`Enter recipients (one per line):
255701234567
255712345678
255713456789`}
                      className="min-h-[120px] font-mono"
                    />
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Placeholders (e.g., {"{name}"}) cannot be used when typing recipients manually.
                      </AlertDescription>
                    </Alert>
                    {/* Show live manual valid count */}
                    <div className="text-xs text-muted-foreground mt-1">
                      Valid numbers: {manualCount}
                    </div>
                    {invalidLines.length > 0 && (
                      <div className="mt-1 text-xs text-red-600 space-y-0.5">
                        <div>Invalid numbers:</div>
                        {invalidLines.map((line, idx) => (
                          <div key={idx} className="font-mono">{line}</div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="group">
                    <SearchableSelect
                      options={contactGroups.map(g => ({
                        value: g.value,
                        label: g.label,
                        description: `${g.count.toLocaleString()} contacts`
                      }))}
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                      placeholder="Select a contact group..."
                      searchPlaceholder="Search groups..."
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Placeholders like {"{name}"} are allowed when sending to contact groups.
                    </p>
                  </TabsContent>
                </Tabs>
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
                  {(() => {
                    const { parts, perPart, encoding } = getSmsParts(message);
                    return `${encoding} | Parts: ${parts}/${perPart}`;
                  })()}
                </Badge>

                {/* New: live character count */}
                <div className="text-xs text-muted-foreground mt-1">
                  Characters: {messageLength}
                </div>
              </div>

              <div className="space-y-2">
                <ToggleSwitch
                  checked={scheduleFlag}
                  onChange={setScheduleFlag}
                  label="Schedule Message"
                />

                {scheduleFlag && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> Schedule Message
                      </CardTitle>
                      <CardDescription>
                        Set a name and date/time for the scheduled message
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col lg:flex-row gap-2 w-full">
                      {/* Schedule Name */}
                      <Input
                        placeholder="Schedule Name"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        className="flex-1 w-full"
                      />

                      {/* Schedule Date & Time */}
                      <Popover>
                        <PopoverTrigger className="flex-1 w-full">
                          <Input
                            placeholder={
                              scheduledFor
                                ? format(scheduledFor, "yyyy-MM-dd HH:mm:ss")
                                : "Select date & time (GMT+3)"
                            }
                            readOnly
                            className="cursor-pointer w-full"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <Calendar
                              mode="single"
                              selected={scheduledFor || undefined}
                              onSelect={onCalendarSelect}
                            />
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Time (GMT+3)</div>
                              <div className="flex gap-2 mt-1">
                                <SearchableSelect
                                  options={hourOptions}
                                  value={hourSel}
                                  onValueChange={(v) => onTimeChange(v, minuteSel)}
                                  className="flex-1 w-full"
                                  placeholder="Hour"
                                />
                                <SearchableSelect
                                  options={minuteOptions}
                                  value={minuteSel}
                                  onValueChange={(v) => onTimeChange(hourSel, v)}
                                  className="flex-1 w-full"
                                  placeholder="Minute"
                                />
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Button
                onClick={handleSend}
                disabled={loading || (recipientMode === 'manual' && manualCount === 0)}
                className="flex items-center gap-2 w-full"
              >
                {loading ? (
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

        {/* Right Column: Preview + Cost */}
        <div className="space-y-4">
          {/* Message Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Message Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedSender && (
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{senders.find(s => s.value === selectedSender)?.label}</span>
                  </div>
                )}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Message</span>
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[60px]">
                    {message || 'Your message will appear here...'}
                  </p>
                  {message && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        const { parts, perPart, encoding } = getSmsParts(message);
                        return `Encoding: ${encoding} | Parts: ${parts} | Per Part: ${perPart}`;
                      })()}
                    </p>
                  )}
                  {scheduleFlag && scheduledFor && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{format(scheduledFor, 'yyyy-MM-dd HH:mm:ss')}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Estimate */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recipients:</span>
                  <span>{recipientsCount.toLocaleString()} contacts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Parts per message:</span>
                  <span>{partsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost per SMS part:</span>
                  <span>1 Credit</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span>
                      {totalCredits.toLocaleString()} Credits
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}