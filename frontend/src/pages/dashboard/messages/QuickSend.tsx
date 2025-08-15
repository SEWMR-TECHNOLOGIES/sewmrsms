import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Send, Users, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  recipients: z.string().min(1, 'Please select recipients'),
  message: z.string().min(1, 'Message is required').max(160, 'Message must be 160 characters or less'),
  scheduledAt: z.string().optional(),
});

const recipientOptions: SearchableSelectOption[] = [
  { value: 'all-customers', label: 'All Customers', description: '12,543 contacts' },
  { value: 'vip-customers', label: 'VIP Customers', description: '234 contacts' },
  { value: 'new-leads', label: 'New Leads', description: '1,821 contacts' },
  { value: 'partners', label: 'Partners', description: '45 contacts' },
  { value: 'inactive-users', label: 'Inactive Users', description: '3,456 contacts' },
];

export default function QuickSend() {
  const { toast } = useToast();
  const [messageLength, setMessageLength] = React.useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: '',
      message: '',
      scheduledAt: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    toast({
      title: "Message sent successfully!",
      description: "Your SMS has been queued for delivery.",
    });
    form.reset();
    setMessageLength(0);
  };

  const handleMessageChange = (value: string) => {
    setMessageLength(value.length);
    return value;
  };

  const selectedRecipient = recipientOptions.find(
    option => option.value === form.watch('recipients')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Send</h1>
          <p className="text-muted-foreground">
            Send SMS messages instantly to your contact groups.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>
                Create and send your SMS message to selected recipients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipients</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={recipientOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select recipient group..."
                            searchPlaceholder="Search groups..."
                            className="w-full"
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a contact group to send the message to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your message here..."
                            className="min-h-[120px] resize-none"
                            {...field}
                            onChange={(e) => {
                              field.onChange(handleMessageChange(e.target.value));
                            }}
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormDescription>
                            Keep your message clear and concise.
                          </FormDescription>
                          <Badge 
                            variant={messageLength > 160 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {messageLength}/160
                          </Badge>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty to send immediately, or select a future date and time.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-2">
                    <Button type="submit" className="flex-1">
                      <Send className="mr-2 h-4 w-4" />
                      {form.watch('scheduledAt') ? 'Schedule Message' : 'Send Now'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Clear
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recipient Info */}
                {selectedRecipient && (
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{selectedRecipient.label}</p>
                      <p className="text-xs text-muted-foreground">{selectedRecipient.description}</p>
                    </div>
                  </div>
                )}

                {/* Message Preview */}
                <div className="border rounded-lg p-4 bg-card">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Message</span>
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[60px]">
                    {form.watch('message') || 'Your message will appear here...'}
                  </p>
                </div>

                {/* Schedule Info */}
                {form.watch('scheduledAt') && (
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Scheduled</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(form.watch('scheduledAt') || '').toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recipients:</span>
                  <span>{selectedRecipient?.description || '0 contacts'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cost per SMS:</span>
                  <span>1 Credit</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost:</span>
                    <span>
                      {selectedRecipient 
                        ? `${selectedRecipient.description.match(/\d+/)?.[0] || 0} Credits`
                        : '0 Credits'
                      }
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